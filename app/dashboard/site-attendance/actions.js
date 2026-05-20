"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getDateInputValue } from "@/lib/dates";
import { createAdminSubmissionNotification } from "@/lib/notifications";
import { getLinkedEmployee } from "@/lib/site-allowance";
import { getSiteAttendanceFilePath, SITE_ATTENDANCE_BUCKET, SITE_ATTENDANCE_TYPES } from "@/lib/site-attendance";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

function isAdmin(profile) {
  return profile?.role === "admin";
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function requiredText(formData, name) {
  return String(formData.get(name) || "").trim();
}

function redirectWithError(path, message) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function resolveEmployeeId(profile, formData, basePath) {
  if (isAdmin(profile)) {
    const employeeId = optionalText(formData, "employee_id");

    if (!employeeId) {
      redirectWithError(basePath, "Employee is required.");
    }

    return employeeId;
  }

  const employee = await getLinkedEmployee(profile.id);

  if (!employee) {
    redirectWithError(basePath, "Your login account is not linked to an employee record.");
  }

  return employee.id;
}

async function buildAttendancePayload(supabase, profile, formData, basePath) {
  const employeeId = await resolveEmployeeId(profile, formData, basePath);
  const projectId = requiredText(formData, "project_id");
  const attendanceType = requiredText(formData, "type");
  const attendanceDate = requiredText(formData, "attendance_date");
  const enterTime = requiredText(formData, "enter_time");
  const exitTime = requiredText(formData, "exit_time");

  if (!projectId || !attendanceDate || !enterTime || !exitTime || !SITE_ATTENDANCE_TYPES.includes(attendanceType)) {
    redirectWithError(basePath, "Project, date, enter time, exit time, and type are required.");
  }

  if (attendanceDate > getDateInputValue()) {
    redirectWithError(basePath, "Attendance date cannot be in the future.");
  }

  const { data: project, error: projectError } = await supabase
    .from("site_projects")
    .select("id, name, order_no, is_active")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    redirectWithError(basePath, projectError?.message || "Project not found.");
  }

  if (!project.is_active && !isAdmin(profile)) {
    redirectWithError(basePath, "Selected project is not active.");
  }

  return {
    employee_id: employeeId,
    project_id: project.id,
    project_name: project.name,
    order_no: project.order_no,
    attendance_date: attendanceDate,
    enter_time: enterTime,
    exit_time: exitTime,
    type: attendanceType,
    notes: optionalText(formData, "notes"),
  };
}

async function uploadSiteAttendanceFile(employeeId, attendanceId, file) {
  const path = getSiteAttendanceFilePath(employeeId, attendanceId, file);

  if (!path) {
    return null;
  }

  await uploadPrivateFile(SITE_ATTENDANCE_BUCKET, path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  return {
    attendance_file_path: path,
    attendance_file_name: file.name || path.split("/").pop(),
    attendance_file_type: file.type || null,
    attendance_file_size: file.size || 0,
  };
}

export async function createSiteAttendance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = "/dashboard/site-attendance/new";
  const supabase = await createClient();
  const payload = await buildAttendancePayload(supabase, profile, formData, basePath);
  const attendanceId = crypto.randomUUID();
  const file = formData.get("attendance_file");
  let filePayload = null;
  let errorMessage = null;

  try {
    filePayload = await uploadSiteAttendanceFile(payload.employee_id, attendanceId, file);
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError(basePath, errorMessage);
  }

  const { data: inserted, error } = await supabase
    .from("site_attendance")
    .insert({ id: attendanceId, ...payload, ...(filePayload || {}), created_by: profile.id })
    .select("id")
    .single();

  if (error) {
    if (filePayload?.attendance_file_path) {
      await deletePrivateFile(SITE_ATTENDANCE_BUCKET, filePayload.attendance_file_path);
    }

    redirectWithError(basePath, error.message);
  }

  await createAdminSubmissionNotification({
    profile,
    entityType: "site_attendance",
    entityId: inserted.id,
    title: "New site attendance submitted",
    body: `${await getNotificationActorName(supabase, payload.employee_id, profile)} submitted ${payload.type} attendance for ${payload.project_name}.`,
    href: `/dashboard/site-attendance/${inserted.id}/edit`,
  });

  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-attendance");
}

export async function updateSiteAttendance(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = `/dashboard/site-attendance/${id}/edit`;
  const supabase = await createClient();
  const existing = await getEditableAttendance(supabase, id, profile, basePath);
  const payload = await buildAttendancePayload(supabase, profile, formData, basePath);
  const file = formData.get("attendance_file");
  const updates = { ...payload, updated_at: new Date().toISOString() };
  let filePayload = null;
  let errorMessage = null;

  try {
    filePayload = await uploadSiteAttendanceFile(payload.employee_id, id, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    }
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError(basePath, errorMessage);
  }

  const { error } = await supabase
    .from("site_attendance")
    .update(updates)
    .eq("id", id);

  if (error) {
    if (filePayload?.attendance_file_path && filePayload.attendance_file_path !== existing.attendance_file_path) {
      await deletePrivateFile(SITE_ATTENDANCE_BUCKET, filePayload.attendance_file_path);
    }

    redirectWithError(basePath, error.message);
  }

  if (filePayload?.attendance_file_path && existing.attendance_file_path && existing.attendance_file_path !== filePayload.attendance_file_path) {
    await deletePrivateFile(SITE_ATTENDANCE_BUCKET, existing.attendance_file_path);
  }

  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-attendance");
}

export async function deleteSiteAttendance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const existing = await getEditableAttendance(supabase, id, profile, "/dashboard/site-attendance");
  const { error } = await supabase.from("site_attendance").delete().eq("id", id);

  if (error) {
    redirectWithError("/dashboard/site-attendance", error.message);
  }

  if (existing.attendance_file_path) {
    await deletePrivateFile(SITE_ATTENDANCE_BUCKET, existing.attendance_file_path);
  }

  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-attendance");
}

async function getEditableAttendance(supabase, id, profile, redirectPath) {
  const { data, error } = await supabase
    .from("site_attendance")
    .select("id, employee_id, allowance_id, attendance_file_path, employees(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(redirectPath, error?.message || "Attendance record not found.");
  }

  if (isAdmin(profile)) {
    return data;
  }

  if (data.employees?.user_id !== profile.id || data.allowance_id) {
    redirect("/dashboard/site-attendance?error=Submitted attendance can only be changed by an admin.");
  }

  return data;
}

async function getNotificationActorName(supabase, employeeId, profile) {
  const { data } = await supabase
    .from("employees")
    .select("name")
    .eq("id", employeeId)
    .maybeSingle();

  return data?.name || profile.full_name || profile.email || "An employee";
}
