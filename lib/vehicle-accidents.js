import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  return {
    ...accident,
    attachment_url: await createSignedUrl(supabase, accident.attachment_path),
  };
}

async function createSignedUrl(supabase, path) {
  if (!path) {
    return null;
  }

  const { data } = await supabase.storage.from(VEHICLE_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl || null;
}

export function getVehicleAccidentFilePath(accidentId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `accidents/${accidentId}/attachment-${Date.now()}.${extension}`;
}
