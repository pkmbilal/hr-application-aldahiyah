import { createClient } from "@/lib/supabase/server";
import { createPrivateFileUrl } from "@/lib/storage/r2";
import { VEHICLE_BUCKET } from "@/lib/vehicles";

const ACCIDENT_SELECT =
  "id, vehicle_id, employee_id, accident_date, location, description, damage_details, severity, police_report_number, repair_status, estimated_cost, notes, attachment_path, attachment_file_name, attachment_file_type, attachment_file_size, created_at, vehicles(id, vehicle_name, vehicle_number), employees(id, name, email, user_id)";

export async function listVehicleAccidents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_accidents")
    .select(ACCIDENT_SELECT)
    .order("accident_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all((data || []).map(withSignedAccidentUrl));
}

export async function getVehicleAccident(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_accidents")
    .select(ACCIDENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedAccidentUrl(data);
}

async function withSignedAccidentUrl(accident) {
  return {
    ...accident,
    attachment_url: await createSignedUrl(accident.attachment_path),
  };
}

async function createSignedUrl(path) {
  if (!path) {
    return null;
  }

  return createPrivateFileUrl(VEHICLE_BUCKET, path);
}

export function getVehicleAccidentFilePath(accidentId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `accidents/${accidentId}/attachment-${Date.now()}.${extension}`;
}
