"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createEmployeeAccidentNotification } from "@/lib/notifications";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";
import { getVehicleAccidentFilePath } from "@/lib/vehicle-accidents";
import { VEHICLE_BUCKET } from "@/lib/vehicles";

const SEVERITIES = new Set(["Minor", "Moderate", "Major"]);
const REPAIR_STATUSES = new Set(["Not Started", "In Progress", "Completed"]);

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

function normalizeAccidentForm(formData, basePath) {
  const vehicleId = requiredText(formData, "vehicle_id");
  const employeeId = requiredText(formData, "employee_id");
  const accidentDate = requiredText(formData, "accident_date");
  const location = requiredText(formData, "location");
  const description = requiredText(formData, "description");
  const severity = requiredText(formData, "severity") || "Minor";
  const repairStatus = requiredText(formData, "repair_status") || "Not Started";
  const estimatedCostText = optionalText(formData, "estimated_cost");
  const estimatedCost = estimatedCostText ? Number(estimatedCostText) : null;

  if (!vehicleId || !employeeId || !accidentDate || !location || !description) {
    redirectWithError(basePath, "Vehicle, employee, accident date, location, and description are required.");
  }

  if (!SEVERITIES.has(severity)) {
    redirectWithError(basePath, "Select a valid severity.");
  }

  if (!REPAIR_STATUSES.has(repairStatus)) {
    redirectWithError(basePath, "Select a valid repair status.");
  }

  if (estimatedCostText && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) {
    redirectWithError(basePath, "Estimated cost must be zero or greater.");
  }

  return {
    vehicle_id: vehicleId,
    employee_id: employeeId,
    accident_date: accidentDate,
    location,
    description,
    damage_details: optionalText(formData, "damage_details"),
    severity,
    police_report_number: optionalText(formData, "police_report_number"),
    repair_status: repairStatus,
    estimated_cost: estimatedCost,
    notes: optionalText(formData, "notes"),
  };
}

async function uploadAccidentAttachment(accidentId, file) {
  const path = getVehicleAccidentFilePath(accidentId, file);

  if (!path) {
    return null;
  }

  await uploadPrivateFile(VEHICLE_BUCKET, path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  return {
    attachment_path: path,
    attachment_file_name: file.name || path.split("/").pop(),
    attachment_file_type: file.type || null,
    attachment_file_size: file.size || 0,
  };
}

export async function createVehicleAccident(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const basePath = "/dashboard/vehicles/accidents/new";
  const payload = normalizeAccidentForm(formData, basePath);
  const accidentId = crypto.randomUUID();
  const supabase = await createClient();
  const file = formData.get("attachment");
  let filePayload = null;

  try {
    filePayload = await uploadAccidentAttachment(accidentId, file);
  } catch (error) {
    redirectWithError(basePath, error.message);
  }

  const { error } = await supabase
    .from("vehicle_accidents")
    .insert({
      id: accidentId,
      ...payload,
      ...(filePayload || {}),
      created_by: profile.id,
    });

  if (error) {
    if (filePayload?.attachment_path) {
      await deletePrivateFile(VEHICLE_BUCKET, filePayload.attachment_path);
    }

    redirectWithError(basePath, error.message);
  }

  await createAccidentNotification(supabase, profile, accidentId, payload);

  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard");
  redirect("/dashboard/vehicles");
}

export async function updateVehicleAccident(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const basePath = `/dashboard/vehicles/accidents/${id}/edit`;
  const payload = normalizeAccidentForm(formData, basePath);
  const supabase = await createClient();
  const existing = await getEditableAccident(supabase, id, basePath);
  const file = formData.get("attachment");
  const updates = { ...payload };
  let filePayload = null;

  try {
    filePayload = await uploadAccidentAttachment(id, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    }
  } catch (error) {
    redirectWithError(basePath, error.message);
  }

  const { error } = await supabase.from("vehicle_accidents").update(updates).eq("id", id);

  if (error) {
    if (filePayload?.attachment_path) {
      await deletePrivateFile(VEHICLE_BUCKET, filePayload.attachment_path);
    }

    redirectWithError(basePath, error.message);
  }

  if (filePayload?.attachment_path && existing.attachment_path) {
    await deletePrivateFile(VEHICLE_BUCKET, existing.attachment_path);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

export async function deleteVehicleAccident(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const existing = await getEditableAccident(supabase, id, "/dashboard/vehicles");
  const { error } = await supabase.from("vehicle_accidents").delete().eq("id", id);

  if (error) {
    redirectWithError("/dashboard/vehicles", error.message);
  }

  if (existing.attachment_path) {
    await deletePrivateFile(VEHICLE_BUCKET, existing.attachment_path);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

async function getEditableAccident(supabase, id, basePath) {
  const { data, error } = await supabase
    .from("vehicle_accidents")
    .select("id, attachment_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(basePath, error?.message || "Accident record not found.");
  }

  return data;
}

async function createAccidentNotification(supabase, profile, accidentId, payload) {
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

  await createEmployeeAccidentNotification({
    profile,
    employeeId: payload.employee_id,
    accidentId,
    title: "New vehicle accident assigned",
    body: `An accident was recorded for ${vehicleLabel}${employee?.name ? ` and assigned to ${employee.name}` : ""}.`,
    href: "/dashboard/vehicles",
  });
}
