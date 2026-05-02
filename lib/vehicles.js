import { createClient } from "@/lib/supabase/server";

export const VEHICLE_BUCKET = "vehicle-documents";

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
  const supabase = await createClient();

  return {
    ...vehicle,
    istamara_file_url: await createSignedUrl(supabase, vehicle.istamara_file_path),
    insurance_upload_url: await createSignedUrl(supabase, vehicle.insurance_upload_path),
  };
}

async function createSignedUrl(supabase, path) {
  if (!path) {
    return null;
  }

  const { data } = await supabase.storage.from(VEHICLE_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl || null;
}

export function getVehicleFilePath(vehicleId, label, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${vehicleId}/${label}-${Date.now()}.${extension}`;
}
