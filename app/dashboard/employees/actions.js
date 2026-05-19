"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { EMPLOYEE_BUCKET, getEmployeeFilePath } from "@/lib/employees";
import { deletePrivateFile, deletePrivateFilesByPrefix, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

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

function normalizeEmployeeForm(formData) {
  return {
    user_id: optionalText(formData, "user_id"),
    name: optionalText(formData, "name"),
    company_mobile_number: optionalText(formData, "company_mobile_number"),
    personal_mobile_number: optionalText(formData, "personal_mobile_number"),
    email: optionalText(formData, "email"),
    passport_number: optionalText(formData, "passport_number"),
    passport_expiry: optionalDate(formData, "passport_expiry"),
    iqama_number: optionalText(formData, "iqama_number"),
    iqama_expiry: optionalDate(formData, "iqama_expiry"),
    license_expiry: optionalDate(formData, "license_expiry"),
    muqeem_expiry_date: optionalDate(formData, "muqeem_expiry_date"),
    blood_group: optionalText(formData, "blood_group"),
    jcc_card_expiry_date: optionalDate(formData, "jcc_card_expiry_date"),
    bank_account_number: optionalText(formData, "bank_account_number"),
  };
}

function normalizeOtherIds(formData) {
  return [0, 1, 2]
    .map((index) => ({
      issuing_authority: optionalText(formData, `other_ids[${index}][issuing_authority]`),
      id_number: optionalText(formData, `other_ids[${index}][id_number]`),
      expiry_date: optionalDate(formData, `other_ids[${index}][expiry_date]`),
      file: formData.get(`other_ids[${index}][file]`),
    }))
    .filter((item) => item.issuing_authority || item.id_number || item.expiry_date || item.file?.size > 0);
}

async function uploadEmployeeFile(employeeId, label, file) {
  const path = getEmployeeFilePath(employeeId, label, file);

  if (!path) {
    return null;
  }

  await uploadPrivateFile(EMPLOYEE_BUCKET, path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  return path;
}

export async function createEmployee(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeEmployeeForm(formData);

  if (!payload.name) {
    redirect("/dashboard/employees/new?error=Employee name is required.");
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase.from("employees").insert(payload).select("id").single();

  if (error) {
    redirect(`/dashboard/employees/new?error=${encodeURIComponent(error.message)}`);
  }

  try {
    await saveEmployeeFiles(supabase, inserted.id, formData);
    await saveOtherIds(supabase, inserted.id, normalizeOtherIds(formData));
  } catch (uploadError) {
    redirect(`/dashboard/employees/${inserted.id}/edit?error=${encodeURIComponent(uploadError.message)}`);
  }

  revalidatePath("/dashboard/employees");
  redirect("/dashboard/employees");
}

export async function updateEmployee(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeEmployeeForm(formData);

  if (!payload.name) {
    redirect(`/dashboard/employees/${id}/edit?error=Employee name is required.`);
  }

  const supabase = await createClient();
  const existing = await getExistingEmployeeFiles(supabase, id);
  const { error } = await supabase.from("employees").update(payload).eq("id", id);

  if (error) {
    redirect(`/dashboard/employees/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  try {
    const replacedPaths = await saveEmployeeFiles(supabase, id, formData, existing);
    await supabase.from("employee_other_ids").delete().eq("employee_id", id);
    await saveOtherIds(supabase, id, normalizeOtherIds(formData));
    await deleteReplacedEmployeeFiles(replacedPaths, existing.otherIdPaths);
  } catch (uploadError) {
    redirect(`/dashboard/employees/${id}/edit?error=${encodeURIComponent(uploadError.message)}`);
  }

  revalidatePath("/dashboard/employees");
  redirect("/dashboard/employees");
}

export async function deleteEmployee(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/employees?error=${encodeURIComponent(error.message)}`);
  }

  await deletePrivateFilesByPrefix(EMPLOYEE_BUCKET, id);

  revalidatePath("/dashboard/employees");
  redirect("/dashboard/employees");
}

async function saveEmployeeFiles(supabase, employeeId, formData, existing = {}) {
  const fileFields = [
    ["passport_copy", "passport_copy_path"],
    ["iqama_copy", "iqama_copy_path"],
    ["license_upload", "license_upload_path"],
  ];

  const updates = {};
  const uploadedPaths = [];
  const replacedPaths = [];

  for (const [inputName, columnName] of fileFields) {
    const path = await uploadEmployeeFile(employeeId, inputName, formData.get(inputName));

    if (path) {
      updates[columnName] = path;
      uploadedPaths.push(path);

      if (existing[columnName] && existing[columnName] !== path) {
        replacedPaths.push(existing[columnName]);
      }
    }
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase.from("employees").update(updates).eq("id", employeeId);

    if (error) {
      await Promise.all(uploadedPaths.map((path) => deletePrivateFile(EMPLOYEE_BUCKET, path)));
      throw new Error(error.message);
    }
  }

  return replacedPaths;
}

async function saveOtherIds(supabase, employeeId, otherIds) {
  if (!otherIds.length) {
    return;
  }

  const rows = [];

  for (const [index, item] of otherIds.entries()) {
    rows.push({
      employee_id: employeeId,
      issuing_authority: item.issuing_authority || "Other",
      id_number: item.id_number || "Not set",
      expiry_date: item.expiry_date,
      file_path: await uploadEmployeeFile(employeeId, `other-id-${index}`, item.file),
    });
  }

  const { error } = await supabase.from("employee_other_ids").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

async function getExistingEmployeeFiles(supabase, employeeId) {
  const { data, error } = await supabase
    .from("employees")
    .select("passport_copy_path, iqama_copy_path, license_upload_path, employee_other_ids(file_path)")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Employee not found.");
  }

  return {
    passport_copy_path: data.passport_copy_path,
    iqama_copy_path: data.iqama_copy_path,
    license_upload_path: data.license_upload_path,
    otherIdPaths: (data.employee_other_ids || []).map((item) => item.file_path).filter(Boolean),
  };
}

async function deleteReplacedEmployeeFiles(replacedDocumentPaths, replacedOtherIdPaths) {
  const paths = [...new Set([...(replacedDocumentPaths || []), ...(replacedOtherIdPaths || [])].filter(Boolean))];
  await Promise.all(paths.map((path) => deletePrivateFile(EMPLOYEE_BUCKET, path)));
}
