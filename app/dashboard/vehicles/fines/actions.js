"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createEmployeeFineNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getVehicleFineFilePath } from "@/lib/vehicle-fines";
import { VEHICLE_BUCKET } from "@/lib/vehicles";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles?error=Admin access required.");
  }
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

function normalizeFineForm(formData, basePath) {
  const vehicleId = requiredText(formData, "vehicle_id");
  const employeeId = requiredText(formData, "employee_id");
  const fineDate = requiredText(formData, "fine_date");
  const amountText = requiredText(formData, "amount");
  const reason = requiredText(formData, "reason");
  const amount = Number(amountText);

  if (!vehicleId || !employeeId || !fineDate || !amountText || !reason) {
    redirectWithError(basePath, "Vehicle, employee, fine date, amount, and reason are required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    redirectWithError(basePath, "Fine amount must be greater than zero.");
  }

  return {
    vehicle_id: vehicleId,
    employee_id: employeeId,
    fine_date: fineDate,
    amount,
    reason,
    authority: optionalText(formData, "authority"),
    reference_number: optionalText(formData, "reference_number"),
    location: optionalText(formData, "location"),
    notes: optionalText(formData, "notes"),
  };
}

async function uploadFineAttachment(supabase, fineId, file) {
  const path = getVehicleFineFilePath(fineId, file);

  if (!path) {
    return null;
  }

  const { error } = await supabase.storage.from(VEHICLE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    attachment_path: path,
    attachment_file_name: file.name || path.split("/").pop(),
    attachment_file_type: file.type || null,
    attachment_file_size: file.size || 0,
  };
}

export async function createVehicleFine(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const basePath = "/dashboard/vehicles/fines/new";
  const payload = normalizeFineForm(formData, basePath);
  const fineId = crypto.randomUUID();
  const supabase = await createClient();
  const file = formData.get("attachment");
  let filePayload = null;

  try {
    filePayload = await uploadFineAttachment(supabase, fineId, file);
  } catch (error) {
    redirectWithError(basePath, error.message);
  }

  const { error } = await supabase
    .from("vehicle_fines")
    .insert({
      id: fineId,
      ...payload,
      ...(filePayload || {}),
      created_by: profile.id,
    });

  if (error) {
    if (filePayload?.attachment_path) {
      await supabase.storage.from(VEHICLE_BUCKET).remove([filePayload.attachment_path]);
    }

    redirectWithError(basePath, error.message);
  }

  await createFineNotification(supabase, profile, fineId, payload);

  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard");
  redirect("/dashboard/vehicles");
}

export async function updateVehicleFine(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const basePath = `/dashboard/vehicles/fines/${id}/edit`;
  const payload = normalizeFineForm(formData, basePath);
  const supabase = await createClient();
  const existing = await getEditableFine(supabase, id, basePath);
  const file = formData.get("attachment");
  const updates = { ...payload };
  let filePayload = null;

  try {
    filePayload = await uploadFineAttachment(supabase, id, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    }
  } catch (error) {
    redirectWithError(basePath, error.message);
  }

  const { error } = await supabase.from("vehicle_fines").update(updates).eq("id", id);

  if (error) {
    if (filePayload?.attachment_path) {
      await supabase.storage.from(VEHICLE_BUCKET).remove([filePayload.attachment_path]);
    }

    redirectWithError(basePath, error.message);
  }

  if (filePayload?.attachment_path && existing.attachment_path) {
    await supabase.storage.from(VEHICLE_BUCKET).remove([existing.attachment_path]);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

export async function deleteVehicleFine(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const existing = await getEditableFine(supabase, id, "/dashboard/vehicles");
  const { error } = await supabase.from("vehicle_fines").delete().eq("id", id);

  if (error) {
    redirectWithError("/dashboard/vehicles", error.message);
  }

  if (existing.attachment_path) {
    await supabase.storage.from(VEHICLE_BUCKET).remove([existing.attachment_path]);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

async function getEditableFine(supabase, id, basePath) {
  const { data, error } = await supabase
    .from("vehicle_fines")
    .select("id, attachment_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(basePath, error?.message || "Fine record not found.");
  }

  return data;
}

async function createFineNotification(supabase, profile, fineId, payload) {
  const [{ data: vehicle }, { data: employee }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("vehicle_name, vehicle_number")
      .eq("id", payload.vehicle_id)
      .maybeSingle(),
    supabase
      .from("employees")
      .select("name")
      .eq("id", payload.employee_id)
      .maybeSingle(),
  ]);

  const vehicleLabel = [vehicle?.vehicle_name, vehicle?.vehicle_number].filter(Boolean).join(" / ") || "a vehicle";
  const amount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(payload.amount || 0));

  await createEmployeeFineNotification({
    profile,
    employeeId: payload.employee_id,
    fineId,
    title: "New vehicle fine assigned",
    body: `${amount} was recorded for ${vehicleLabel}${employee?.name ? ` and assigned to ${employee.name}` : ""}.`,
    href: "/dashboard/vehicles",
  });
}
