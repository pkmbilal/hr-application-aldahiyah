"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createAdminSubmissionNotification } from "@/lib/notifications";
import { getLinkedEmployee } from "@/lib/site-allowance";
import { SITE_ATTENDANCE_TYPES } from "@/lib/site-attendance";
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

async function resolveEmployeeId(profile, formData, basePath) {
  if (isAdmin(profile)) {
    const employeeId = optionalText(formData, "employee_id");

    if (!employeeId) {
      redirect(`${basePath}?error=Employee is required.`);
    }

    return employeeId;
  }

  const employee = await getLinkedEmployee(profile.id);

  if (!employee) {
    redirect(`${basePath}?error=Your login account is not linked to an employee record.`);
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
    redirect(`${basePath}?error=Project, date, enter time, exit time, and type are required.`);
  }

  const { data: project, error: projectError } = await supabase
    .from("site_projects")
    .select("id, name, order_no, is_active")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    redirect(`${basePath}?error=${encodeURIComponent(projectError?.message || "Project not found.")}`);
  }

  if (!project.is_active && !isAdmin(profile)) {
    redirect(`${basePath}?error=Selected project is not active.`);
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

export async function createSiteAttendance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = "/dashboard/site-attendance/new";
  const supabase = await createClient();
  const payload = await buildAttendancePayload(supabase, profile, formData, basePath);
  const { data: inserted, error } = await supabase
    .from("site_attendance")
    .insert({ ...payload, created_by: profile.id })
    .select("id")
    .single();

  if (error) {
    redirect(`${basePath}?error=${encodeURIComponent(error.message)}`);
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
  await getEditableAttendance(supabase, id, profile, basePath);
  const payload = await buildAttendancePayload(supabase, profile, formData, basePath);
  const { error } = await supabase
    .from("site_attendance")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${basePath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-attendance");
}

export async function deleteSiteAttendance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await getEditableAttendance(supabase, id, profile, "/dashboard/site-attendance");
  const { error } = await supabase.from("site_attendance").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/site-attendance?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-attendance");
}

async function getEditableAttendance(supabase, id, profile, redirectPath) {
  const { data, error } = await supabase
    .from("site_attendance")
    .select("id, employee_id, allowance_id, employees(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirect(`${redirectPath}?error=${encodeURIComponent(error?.message || "Attendance record not found.")}`);
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
