import { createClient } from "@/lib/supabase/server";
import { createPrivateFileUrl } from "@/lib/storage/r2";

export const EMPLOYEE_BUCKET = process.env.R2_EMPLOYEE_DOCUMENTS_BUCKET || "employee-documents";

export async function listEmployees() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, user_id, name, company_mobile_number, personal_mobile_number, email, passport_number, passport_expiry, iqama_number, iqama_expiry, license_expiry, muqeem_expiry_date, blood_group, jcc_card_expiry_date, bank_account_number"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getEmployee(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, user_id, name, company_mobile_number, personal_mobile_number, email, passport_number, passport_expiry, passport_copy_path, iqama_number, iqama_expiry, iqama_copy_path, license_expiry, license_upload_path, muqeem_expiry_date, blood_group, jcc_card_expiry_date, bank_account_number, employee_other_ids(id, issuing_authority, id_number, expiry_date, file_path)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedEmployeeUrls(data);
}

export async function listLoginProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function withSignedEmployeeUrls(employee) {
  const signed = { ...employee };

  for (const key of ["passport_copy_path", "iqama_copy_path", "license_upload_path"]) {
    signed[`${key.replace("_path", "")}_url`] = await createSignedUrl(employee[key]);
  }

  signed.employee_other_ids = await Promise.all(
    (employee.employee_other_ids || []).map(async (item) => ({
      ...item,
      file_url: await createSignedUrl(item.file_path),
    }))
  );

  return signed;
}

async function createSignedUrl(path) {
  if (!path) {
    return null;
  }

  return createPrivateFileUrl(EMPLOYEE_BUCKET, path);
}

export function getEmployeeFilePath(employeeId, label, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${employeeId}/${label}-${Date.now()}.${extension}`;
}

export function getExpiryStatus(dateValue) {
  if (!dateValue) {
    return "Missing";
  }

  const today = new Date();
  const expiry = new Date(`${dateValue}T00:00:00`);
  const diffMs = expiry.getTime() - new Date(today.toDateString()).getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Expired";
  }

  if (diffDays <= 30) {
    return "Expiring Soon";
  }

  return "Valid";
}
