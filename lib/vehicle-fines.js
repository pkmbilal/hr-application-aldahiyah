import { createClient } from "@/lib/supabase/server";
import { createPrivateFileUrl } from "@/lib/storage/r2";
import { VEHICLE_BUCKET } from "@/lib/vehicles";

const FINE_SELECT =
  "id, vehicle_id, employee_id, fine_date, amount, reason, authority, reference_number, location, notes, attachment_path, attachment_file_name, attachment_file_type, attachment_file_size, created_at, vehicles(id, vehicle_name, vehicle_number), employees(id, name, email, user_id)";

export async function listVehicleFines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_fines")
    .select(FINE_SELECT)
    .order("fine_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all((data || []).map(withSignedFineUrl));
}

export async function getVehicleFine(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_fines")
    .select(FINE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedFineUrl(data);
}

async function withSignedFineUrl(fine) {
  return {
    ...fine,
    attachment_url: await createSignedUrl(fine.attachment_path),
  };
}

async function createSignedUrl(path) {
  if (!path) {
    return null;
  }

  return createPrivateFileUrl(VEHICLE_BUCKET, path);
}

export function getVehicleFineFilePath(fineId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `fines/${fineId}/attachment-${Date.now()}.${extension}`;
}
