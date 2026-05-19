import { createClient } from "@/lib/supabase/server";
import { createPrivateFileUrl } from "@/lib/storage/r2";

export const VEHICLE_BUCKET = process.env.R2_VEHICLE_DOCUMENTS_BUCKET || "vehicle-documents";

export async function listVehicles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, vehicle_name, type, vehicle_number, istamara_number, istamara_expiry, istamara_other_details, istamara_file_path, fahas_expiry_date, insurance_expiry_date, insurance_upload_path, other_details"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all((data || []).map(withSignedVehicleUrls));
}

export async function getVehicle(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, vehicle_name, type, vehicle_number, istamara_number, istamara_expiry, istamara_other_details, istamara_file_path, fahas_expiry_date, insurance_expiry_date, insurance_upload_path, other_details"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedVehicleUrls(data);
}

async function withSignedVehicleUrls(vehicle) {
  return {
    ...vehicle,
    istamara_file_url: await createSignedUrl(vehicle.istamara_file_path),
    insurance_upload_url: await createSignedUrl(vehicle.insurance_upload_path),
  };
}

async function createSignedUrl(path) {
  if (!path) {
    return null;
  }

  return createPrivateFileUrl(VEHICLE_BUCKET, path);
}

export function getVehicleFilePath(vehicleId, label, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${vehicleId}/${label}-${Date.now()}.${extension}`;
}
