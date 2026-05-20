"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createAdminSubmissionNotification, createEmployeeAdvanceNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getLinkedEmployee } from "@/lib/site-allowance";
import { ADVANCE_PAYMENT_METHODS, ADVANCE_STATUSES } from "@/lib/employee-advances";

function isAdmin(profile) {
  return profile?.role === "admin";
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function requiredText(formData, name) {
  return String(formData.get(name) || "").trim();
}

function optionalNumber(formData, name) {
  const value = Number(formData.get(name) || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
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

async function buildAdvancePayload(supabase, profile, formData, basePath, existing = null) {
  const employeeId = existing && !isAdmin(profile) ? existing.employee_id : await resolveEmployeeId(profile, formData, basePath);
  const projectId = requiredText(formData, "project_id");
  const amount = optionalNumber(formData, "amount");
  const advanceDate = requiredText(formData, "advance_date");
  const paymentMethod = requiredText(formData, "payment_method");
  const requestedStatus = optionalText(formData, "status");
  const status = isAdmin(profile) && ADVANCE_STATUSES.includes(requestedStatus) ? requestedStatus : "Pending";

  if (!projectId || !amount || !advanceDate || !ADVANCE_PAYMENT_METHODS.includes(paymentMethod)) {
    redirectWithError(basePath, "Project, amount, advance date, and payment method are required.");
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
    amount,
    advance_date: advanceDate,
    payment_method: paymentMethod,
    reason: optionalText(formData, "reason"),
    admin_notes: isAdmin(profile) ? optionalText(formData, "admin_notes") : existing?.admin_notes || null,
    status,
  };
}

export async function createEmployeeAdvance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = "/dashboard/advances/new";
  const supabase = await createClient();
  const payload = await buildAdvancePayload(supabase, profile, formData, basePath);
  const statusUpdates = buildStatusUpdates({}, payload.status, profile);

  const { data: inserted, error } = await supabase
    .from("employee_advances")
    .insert({
      ...payload,
      ...statusUpdates,
      requested_by: profile.id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    redirectWithError(basePath, error.message);
  }

  await createAdminSubmissionNotification({
    profile,
    entityType: "employee_advance",
    entityId: inserted.id,
    title: "New advance request submitted",
    body: `${await getNotificationActorName(supabase, payload.employee_id, profile)} requested ${payload.amount.toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} SAR for ${payload.project_name}.`,
    href: `/dashboard/advances/${inserted.id}`,
  });

  revalidatePath("/dashboard/advances");
  redirect(`/dashboard/advances/${inserted.id}`);
}

export async function updateEmployeeAdvance(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = `/dashboard/advances/${id}/edit`;
  const supabase = await createClient();
  const existing = await getEditableAdvance(supabase, id, profile, basePath);
  const payload = await buildAdvancePayload(supabase, profile, formData, basePath, existing);
  const statusUpdates = isAdmin(profile) ? buildStatusUpdates(existing, payload.status, profile) : {};

  const { error } = await supabase
    .from("employee_advances")
    .update({
      ...payload,
      ...statusUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirectWithError(basePath, error.message);
  }

  if (isAdmin(profile) && existing.status !== payload.status) {
    await notifyEmployeeAdvanceStatusChange({
      supabase,
      profile,
      advanceId: id,
      employeeId: payload.employee_id,
      referenceNo: existing.reference_no,
      status: payload.status,
    });
  }

  revalidatePath("/dashboard/advances");
  revalidatePath(`/dashboard/advances/${id}`);
  redirect(`/dashboard/advances/${id}`);
}

export async function updateEmployeeAdvanceStatus(formData) {
  const { profile } = await requireCurrentUserProfile();

  if (!isAdmin(profile)) {
    throw new Error("Admin access required.");
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");

  if (!ADVANCE_STATUSES.includes(status)) {
    redirect(`/dashboard/advances/${id}?error=Invalid status.`);
  }

  const supabase = await createClient();
  const existing = await getAdvanceForAdmin(supabase, id, "/dashboard/advances");
  const { error } = await supabase
    .from("employee_advances")
    .update({
      ...buildStatusUpdates(existing, status, profile),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/advances/${id}?error=${encodeURIComponent(error.message)}`);
  }

  const statusChanged = existing.status !== status;

  if (statusChanged) {
    await notifyEmployeeAdvanceStatusChange({
      supabase,
      profile,
      advanceId: id,
      employeeId: existing.employee_id,
      referenceNo: existing.reference_no,
      status,
    });
  }

  revalidatePath("/dashboard/advances");
  revalidatePath(`/dashboard/advances/${id}`);
  revalidatePath("/dashboard/site-allowance");
  redirect(`/dashboard/advances/${id}${statusChanged ? "?statusChanged=1" : ""}`);
}

export async function deleteEmployeeAdvance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const existing = await getEditableAdvance(supabase, id, profile, "/dashboard/advances");

  if (Number(existing.deducted_amount || 0) > 0) {
    redirect("/dashboard/advances?error=Advances with deductions cannot be deleted. Cancel the record instead.");
  }

  const { error } = await supabase.from("employee_advances").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/advances?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/advances");
  redirect("/dashboard/advances");
}

async function getEditableAdvance(supabase, id, profile, redirectPath) {
  const { data, error } = await supabase
    .from("employee_advances")
    .select("id, reference_no, employee_id, status, approved_by, approved_at, paid_by, paid_at, employees(user_id), advance_deductions(amount)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(redirectPath, error?.message || "Advance record not found.");
  }

  const deductedAmount = (data.advance_deductions || []).reduce((sum, deduction) => sum + Number(deduction.amount || 0), 0);

  if (isAdmin(profile)) {
    return { ...data, deducted_amount: deductedAmount };
  }

  if (data.employees?.user_id !== profile.id || data.status !== "Pending") {
    redirect(`/dashboard/advances/${id}?error=Only pending advance requests can be edited.`);
  }

  return { ...data, deducted_amount: deductedAmount };
}

async function getAdvanceForAdmin(supabase, id, redirectPath) {
  const { data, error } = await supabase
    .from("employee_advances")
    .select("id, reference_no, employee_id, status, approved_by, approved_at, paid_by, paid_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(redirectPath, error?.message || "Advance record not found.");
  }

  return data;
}

function buildStatusUpdates(existing, nextStatus, profile) {
  return {
    status: nextStatus,
    approved_by: ["Approved", "Paid"].includes(nextStatus) && !existing.approved_by ? profile.id : existing.approved_by || null,
    approved_at: ["Approved", "Paid"].includes(nextStatus) && !existing.approved_at ? new Date().toISOString() : existing.approved_at || null,
    paid_by: nextStatus === "Paid" && !existing.paid_by ? profile.id : existing.paid_by || null,
    paid_at: nextStatus === "Paid" && !existing.paid_at ? new Date().toISOString() : existing.paid_at || null,
  };
}

async function getNotificationActorName(supabase, employeeId, profile) {
  const { data } = await supabase
    .from("employees")
    .select("name")
    .eq("id", employeeId)
    .maybeSingle();

  return data?.name || profile.full_name || profile.email || "An employee";
}

async function notifyEmployeeAdvanceStatusChange({ supabase, profile, advanceId, employeeId, referenceNo, status }) {
  const employeeName = await getNotificationActorName(supabase, employeeId, profile);

  await createEmployeeAdvanceNotification({
    profile,
    employeeId,
    advanceId,
    title: `Advance ${status}`,
    body: `${employeeName}, your advance request ${referenceNo || ""} was marked ${status}.`,
    href: `/dashboard/advances/${advanceId}`,
  });
}
