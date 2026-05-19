"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getInstrumentFilePath, INSTRUMENT_BUCKET } from "@/lib/instruments";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function normalizeInstrumentForm(formData) {
  return {
    name: String(formData.get("name") || "").trim(),
    model_number: String(formData.get("model_number") || "").trim() || null,
    serial_number: String(formData.get("serial_number") || "").trim() || null,
    last_calibration_date: String(formData.get("last_calibration_date") || "") || null,
    calibration_due_date: String(formData.get("calibration_due_date") || "") || null,
  };
}

export async function createInstrument(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeInstrumentForm(formData);

  if (!payload.name) {
    redirect("/dashboard/instruments/new?error=Instrument name is required.");
  }

  const supabase = await createClient();
  const { data: inserted, error: insertError } = await supabase
    .from("instruments")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    redirect(`/dashboard/instruments/new?error=${encodeURIComponent(insertError.message)}`);
  }

  const file = formData.get("calibration_file");
  const filePath = getInstrumentFilePath(inserted.id, file);

  if (filePath) {
    try {
      await uploadPrivateFile(INSTRUMENT_BUCKET, filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    } catch (error) {
      redirect(`/dashboard/instruments/${inserted.id}/edit?error=${encodeURIComponent(error.message)}`);
    }

    await supabase
      .from("instruments")
      .update({
        calibration_file_path: filePath,
      })
      .eq("id", inserted.id);
  }

  revalidatePath("/dashboard/instruments");
  redirect("/dashboard/instruments");
}

export async function updateInstrument(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeInstrumentForm(formData);

  if (!payload.name) {
    redirect(`/dashboard/instruments/${id}/edit?error=Instrument name is required.`);
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("instruments")
    .select("calibration_file_path")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    redirect(`/dashboard/instruments/${id}/edit?error=${encodeURIComponent(existingError?.message || "Instrument not found.")}`);
  }

  const { error: updateError } = await supabase.from("instruments").update(payload).eq("id", id);

  if (updateError) {
    redirect(`/dashboard/instruments/${id}/edit?error=${encodeURIComponent(updateError.message)}`);
  }

  const file = formData.get("calibration_file");
  const filePath = getInstrumentFilePath(id, file);

  if (filePath) {
    try {
      await uploadPrivateFile(INSTRUMENT_BUCKET, filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    } catch (error) {
      redirect(`/dashboard/instruments/${id}/edit?error=${encodeURIComponent(error.message)}`);
    }

    const { error: fileUpdateError } = await supabase
      .from("instruments")
      .update({
        calibration_file_path: filePath,
      })
      .eq("id", id);

    if (fileUpdateError) {
      await deletePrivateFile(INSTRUMENT_BUCKET, filePath);
      redirect(`/dashboard/instruments/${id}/edit?error=${encodeURIComponent(fileUpdateError.message)}`);
    }

    if (existing.calibration_file_path && existing.calibration_file_path !== filePath) {
      await deletePrivateFile(INSTRUMENT_BUCKET, existing.calibration_file_path);
    }
  }

  revalidatePath("/dashboard/instruments");
  redirect("/dashboard/instruments");
}

export async function deleteInstrument(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const calibrationFilePath = String(formData.get("calibration_file_path") || "");
  const supabase = await createClient();

  const { error } = await supabase.from("instruments").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/instruments?error=${encodeURIComponent(error.message)}`);
  }

  if (calibrationFilePath) {
    await deletePrivateFile(INSTRUMENT_BUCKET, calibrationFilePath);
  }

  revalidatePath("/dashboard/instruments");
  redirect("/dashboard/instruments");
}
