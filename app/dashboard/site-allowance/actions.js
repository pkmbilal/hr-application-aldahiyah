"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createAdminSubmissionNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import {
  SITE_ALLOWANCE_DAILY_RATE,
  SITE_ALLOWANCE_STATUSES,
  calculateAllowanceTotals,
  getLinkedEmployee,
} from "@/lib/site-allowance";
import { buildAllowanceItemsFromAttendance, listEligibleJobAttendance } from "@/lib/site-attendance";

function isAdmin(profile) {
  return profile?.role === "admin";
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function optionalNumber(formData, name) {
  const value = Number(formData.get(name) || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function optionalDate(formData, name) {
  return String(formData.get(name) || "") || null;
}

function normalizeClaimMonth(formData) {
  const month = String(formData.get("claim_month") || "");
  return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : null;
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

async function normalizePayload(formData, employeeId, profile, allowanceId = null) {
  const claimMonth = normalizeClaimMonth(formData);
  const attendanceRows = await listEligibleJobAttendance(employeeId, claimMonth, allowanceId);
  const items = buildAllowanceItemsFromAttendance(attendanceRows, SITE_ALLOWANCE_DAILY_RATE);
  const petrolAmount = optionalNumber(formData, "petrol_amount");
  const otherBillsAmount = optionalNumber(formData, "other_bills_amount");
  const advanceAmount = optionalNumber(formData, "advance_amount");
  const totals = calculateAllowanceTotals(items, petrolAmount, otherBillsAmount, advanceAmount);
  const requestedStatus = optionalText(formData, "status");
  const status = isAdmin(profile) && SITE_ALLOWANCE_STATUSES.includes(requestedStatus) ? requestedStatus : "Pending";

  return {
    allowance: {
      employee_id: employeeId,
      claim_month: claimMonth,
      summary_date: optionalDate(formData, "summary_date"),
      petrol_amount: petrolAmount,
      other_bills_amount: otherBillsAmount,
      advance_amount: advanceAmount,
      subtotal_amount: totals.subtotal_amount,
      net_amount: totals.net_amount,
      status,
      notes: optionalText(formData, "notes"),
    },
    items,
  };
}

function validatePayload(payload, basePath) {
  if (!payload.allowance.claim_month) {
    redirect(`${basePath}?error=Month is required.`);
  }

  if (!payload.allowance.summary_date) {
    redirect(`${basePath}?error=Summary date is required.`);
  }

  if (!payload.items.length) {
    redirect(`${basePath}?error=No unclaimed Job attendance found for this employee and month.`);
  }
}

export async function createSiteAllowance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = "/dashboard/site-allowance/new";
  const employeeId = await resolveEmployeeId(profile, formData, basePath);
  const payload = await normalizePayload(formData, employeeId, profile);

  if (isAdmin(profile) && !optionalText(formData, "status")) {
    payload.allowance.status = "Approved";
  }

  validatePayload(payload, basePath);

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("site_allowances")
    .insert({
      ...payload.allowance,
      created_by: profile.id,
      approved_by: payload.allowance.status === "Approved" ? profile.id : null,
      approved_at: payload.allowance.status === "Approved" ? new Date().toISOString() : null,
      paid_at: payload.allowance.status === "Paid" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`${basePath}?error=${encodeURIComponent(error.message)}`);
  }

  const { error: itemError } = await supabase
    .from("site_allowance_items")
    .insert(payload.items.map((item) => ({ ...item, allowance_id: inserted.id })));

  if (itemError) {
    redirect(`/dashboard/site-allowance/${inserted.id}/edit?error=${encodeURIComponent(itemError.message)}`);
  }

  await lockAttendanceRows(supabase, payload.items, inserted.id);

  await createAdminSubmissionNotification({
    profile,
    entityType: "site_allowance",
    entityId: inserted.id,
    title: "New site allowance submitted",
    body: `${await getNotificationActorName(supabase, employeeId, profile)} submitted an allowance claim for ${payload.items.length} project ${payload.items.length === 1 ? "row" : "rows"}.`,
    href: `/dashboard/site-allowance/${inserted.id}`,
  });

  revalidatePath("/dashboard/site-allowance");
  revalidatePath("/dashboard/site-attendance");
  redirect(`/dashboard/site-allowance/${inserted.id}`);
}

export async function updateSiteAllowance(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  const basePath = `/dashboard/site-allowance/${id}/edit`;
  const supabase = await createClient();
  const existing = await getEditableAllowance(supabase, id, profile, basePath);
  const employeeId = isAdmin(profile) ? await resolveEmployeeId(profile, formData, basePath) : existing.employee_id;
  const payload = await normalizePayload(formData, employeeId, profile, id);

  validatePayload(payload, basePath);
  await unlockAllowanceAttendance(supabase, id);

  const statusUpdates = buildStatusUpdates(existing, payload.allowance.status, profile);
  const { error } = await supabase
    .from("site_allowances")
    .update({
      ...payload.allowance,
      ...statusUpdates,
    })
    .eq("id", id);

  if (error) {
    redirect(`${basePath}?error=${encodeURIComponent(error.message)}`);
  }

  const { error: deleteError } = await supabase.from("site_allowance_items").delete().eq("allowance_id", id);

  if (deleteError) {
    redirect(`${basePath}?error=${encodeURIComponent(deleteError.message)}`);
  }

  const { error: itemError } = await supabase
    .from("site_allowance_items")
    .insert(payload.items.map((item) => ({ ...item, allowance_id: id })));

  if (itemError) {
    redirect(`${basePath}?error=${encodeURIComponent(itemError.message)}`);
  }

  await lockAttendanceRows(supabase, payload.items, id);

  revalidatePath("/dashboard/site-allowance");
  revalidatePath("/dashboard/site-attendance");
  revalidatePath(`/dashboard/site-allowance/${id}`);
  redirect(`/dashboard/site-allowance/${id}`);
}

export async function deleteSiteAllowance(formData) {
  const { profile } = await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await getEditableAllowance(supabase, id, profile, "/dashboard/site-allowance");

  const { error } = await supabase.from("site_allowances").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/site-allowance?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-allowance");
  revalidatePath("/dashboard/site-attendance");
  redirect("/dashboard/site-allowance");
}

export async function updateSiteAllowanceStatus(formData) {
  const { profile } = await requireCurrentUserProfile();

  if (!isAdmin(profile)) {
    throw new Error("Admin access required.");
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");

  if (!SITE_ALLOWANCE_STATUSES.includes(status)) {
    redirect(`/dashboard/site-allowance/${id}?error=Invalid status.`);
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("site_allowances")
    .select("id, status, approved_by, approved_at, paid_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    redirect(`/dashboard/site-allowance?error=${encodeURIComponent(existingError?.message || "Record not found.")}`);
  }

  const { error } = await supabase
    .from("site_allowances")
    .update(buildStatusUpdates(existing, status, profile))
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/site-allowance/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-allowance");
  revalidatePath(`/dashboard/site-allowance/${id}`);
  redirect(`/dashboard/site-allowance/${id}`);
}

async function getEditableAllowance(supabase, id, profile, redirectPath) {
  const { data, error } = await supabase
    .from("site_allowances")
    .select("id, employee_id, status, approved_by, approved_at, paid_at, employees(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirect(`${redirectPath}?error=${encodeURIComponent(error?.message || "Record not found.")}`);
  }

  if (isAdmin(profile)) {
    return data;
  }

  if (data.employees?.user_id !== profile.id || data.status !== "Pending") {
    redirect(`/dashboard/site-allowance/${id}?error=Only pending records can be edited.`);
  }

  return data;
}

function buildStatusUpdates(existing, nextStatus, profile) {
  return {
    status: nextStatus,
    approved_by: nextStatus === "Approved" && existing.status !== "Approved" ? profile.id : existing.approved_by,
    approved_at: nextStatus === "Approved" && existing.status !== "Approved" ? new Date().toISOString() : existing.approved_at,
    paid_at: nextStatus === "Paid" && existing.status !== "Paid" ? new Date().toISOString() : existing.paid_at,
  };
}

async function lockAttendanceRows(supabase, items, allowanceId) {
  const attendanceIds = [...new Set(items.flatMap((item) => item.attendance_ids || []))];

  if (!attendanceIds.length) {
    return;
  }

  const { error } = await supabase.rpc("lock_site_allowance_attendance", {
    p_allowance_id: allowanceId,
    p_attendance_ids: attendanceIds,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function unlockAllowanceAttendance(supabase, allowanceId) {
  const { error } = await supabase.rpc("unlock_site_allowance_attendance", {
    p_allowance_id: allowanceId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function getNotificationActorName(supabase, employeeId, profile) {
  const { data } = await supabase
    .from("employees")
    .select("name")
    .eq("id", employeeId)
    .maybeSingle();

  return data?.name || profile.full_name || profile.email || "An employee";
}
