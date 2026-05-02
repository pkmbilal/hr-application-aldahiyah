"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VEHICLE_BUCKET, getVehicleFilePath } from "@/lib/vehicles";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function optionalDate(formData, name) {
  return String(formData.get(name) || "") || null;
}

function normalizeVehicleForm(formData) {
  return {
    vehicle_name: optionalText(formData, "vehicle_name"),
    type: optionalText(formData, "type"),
    vehicle_number: optionalText(formData, "vehicle_number"),
    istamara_number: optionalText(formData, "istamara_number"),
    istamara_expiry: optionalDate(formData, "istamara_expiry"),
    istamara_other_details: optionalText(formData, "istamara_other_details"),
    fahas_expiry_date: optionalDate(formData, "fahas_expiry_date"),
    insurance_expiry_date: optionalDate(formData, "insurance_expiry_date"),
    other_details: optionalText(formData, "other_details"),
  };
}

async function uploadVehicleFile(supabase, vehicleId, label, file) {
  const path = getVehicleFilePath(vehicleId, label, file);

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

  return path;
}

export async function createVehicle(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeVehicleForm(formData);

  if (!payload.vehicle_name) {
    redirect("/dashboard/vehicles/new?error=Vehicle name is required.");
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase.from("vehicles").insert(payload).select("id").single();

  if (error) {
    redirect(`/dashboard/vehicles/new?error=${encodeURIComponent(error.message)}`);
  }

  try {
    await saveVehicleFiles(supabase, inserted.id, formData);
  } catch (uploadError) {
    redirect(`/dashboard/vehicles/${inserted.id}/edit?error=${encodeURIComponent(uploadError.message)}`);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

export async function updateVehicle(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeVehicleForm(formData);

  if (!payload.vehicle_name) {
    redirect(`/dashboard/vehicles/${id}/edit?error=Vehicle name is required.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(payload).eq("id", id);

  if (error) {
    redirect(`/dashboard/vehicles/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  try {
    await saveVehicleFiles(supabase, id, formData);
  } catch (uploadError) {
    redirect(`/dashboard/vehicles/${id}/edit?error=${encodeURIComponent(uploadError.message)}`);
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

export async function deleteVehicle(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/vehicles?error=${encodeURIComponent(error.message)}`);
  }

  const { data: files } = await supabase.storage.from(VEHICLE_BUCKET).list(id);
  if (files?.length) {
    await supabase.storage.from(VEHICLE_BUCKET).remove(files.map((file) => `${id}/${file.name}`));
  }

  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles");
}

async function saveVehicleFiles(supabase, vehicleId, formData) {
  const updates = {};
  const istamaraPath = await uploadVehicleFile(supabase, vehicleId, "istamara", formData.get("istamara_file"));
  const insurancePath = await uploadVehicleFile(supabase, vehicleId, "insurance", formData.get("insurance_upload"));

  if (istamaraPath) {
    updates.istamara_file_path = istamaraPath;
  }

  if (insurancePath) {
    updates.insurance_upload_path = insurancePath;
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase.from("vehicles").update(updates).eq("id", vehicleId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
