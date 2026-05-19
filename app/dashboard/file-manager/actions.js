"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import {
  COMPANY_DOCUMENT_BUCKET,
  COMPANY_DOCUMENT_CATEGORIES,
  getCompanyDocumentFilePath,
} from "@/lib/company-documents";
import { deletePrivateFile, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function optionalUuid(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return COMPANY_DOCUMENT_CATEGORIES.includes(category) ? category : "Other";
}

function normalizeCompanyDocumentForm(formData) {
  return {
    title: optionalText(formData, "title"),
    category: normalizeCategory(formData.get("category")),
    description: optionalText(formData, "description"),
    folder_id: optionalUuid(formData, "folder_id"),
    is_active: formData.get("is_active") === "on",
  };
}

function redirectWithError(path, message) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function uploadCompanyDocumentFile(documentId, file) {
  const path = getCompanyDocumentFilePath(documentId, file);

  if (!path) {
    return null;
  }

  await uploadPrivateFile(COMPANY_DOCUMENT_BUCKET, path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  return {
    storage_path: path,
    file_name: file.name || "document",
    file_type: file.type || null,
    file_size: file.size || 0,
  };
}

export async function createCompanyDocumentFolder(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const name = optionalText(formData, "name");
  const description = optionalText(formData, "description");

  if (!name) {
    redirectWithError("/dashboard/file-manager", "Folder name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("company_document_folders").insert({
    name,
    description,
    created_by: profile.id,
  });

  if (error) {
    redirectWithError("/dashboard/file-manager", error.message);
  }

  revalidatePath("/dashboard/file-manager");
  redirect("/dashboard/file-manager");
}

export async function updateCompanyDocumentFolder(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const name = optionalText(formData, "name");
  const description = optionalText(formData, "description");

  if (!id) {
    redirectWithError("/dashboard/file-manager", "Folder is required.");
  }

  if (!name) {
    redirectWithError("/dashboard/file-manager", "Folder name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_document_folders")
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirectWithError("/dashboard/file-manager", error.message);
  }

  revalidatePath("/dashboard/file-manager");
  redirect("/dashboard/file-manager");
}

export async function createCompanyDocument(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeCompanyDocumentForm(formData);
  const file = formData.get("file");

  if (!payload.title) {
    redirectWithError("/dashboard/file-manager/new", "Document title is required.");
  }

  if (!file || file.size === 0) {
    redirectWithError("/dashboard/file-manager/new", "Document file is required.");
  }

  const supabase = await createClient();
  const documentId = crypto.randomUUID();
  let errorMessage = null;

  try {
    const filePayload = await uploadCompanyDocumentFile(documentId, file);
    const { error } = await supabase.from("company_documents").insert({
      id: documentId,
      ...payload,
      ...filePayload,
      uploaded_by: profile.id,
    });

    if (error) {
      await deletePrivateFile(COMPANY_DOCUMENT_BUCKET, filePayload.storage_path);
      errorMessage = error.message;
    }
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError("/dashboard/file-manager/new", errorMessage);
  }

  revalidatePath("/dashboard/file-manager");
  redirect("/dashboard/file-manager");
}

export async function updateCompanyDocument(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const payload = normalizeCompanyDocumentForm(formData);

  if (!payload.title) {
    redirectWithError(`/dashboard/file-manager/${id}/edit`, "Document title is required.");
  }

  const supabase = await createClient();
  const updates = { ...payload };
  const file = formData.get("file");
  const oldStoragePath = String(formData.get("storage_path") || "");
  let errorMessage = null;

  try {
    const filePayload = await uploadCompanyDocumentFile(id, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    }

    const { error } = await supabase.from("company_documents").update(updates).eq("id", id);

    if (error) {
      if (filePayload?.storage_path) {
        await deletePrivateFile(COMPANY_DOCUMENT_BUCKET, filePayload.storage_path);
      }
      errorMessage = error.message;
    }

    if (!errorMessage && filePayload?.storage_path && oldStoragePath && oldStoragePath !== filePayload.storage_path) {
      await deletePrivateFile(COMPANY_DOCUMENT_BUCKET, oldStoragePath);
    }
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError(`/dashboard/file-manager/${id}/edit`, errorMessage);
  }

  revalidatePath("/dashboard/file-manager");
  revalidatePath(`/dashboard/file-manager/${id}/edit`);
  redirect("/dashboard/file-manager");
}

export async function deleteCompanyDocument(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const storagePath = String(formData.get("storage_path") || "");
  const folderId = String(formData.get("folder_id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("company_documents").delete().eq("id", id);

  if (error) {
    redirectWithError(getFileManagerRedirectPath(folderId), error.message);
  }

  if (storagePath) {
    await deletePrivateFile(COMPANY_DOCUMENT_BUCKET, storagePath);
  }

  const redirectPath = getFileManagerRedirectPath(folderId);
  revalidatePath("/dashboard/file-manager");
  redirect(redirectPath);
}

function getFileManagerRedirectPath(folderId) {
  return folderId ? `/dashboard/file-manager?folder=${encodeURIComponent(folderId)}` : "/dashboard/file-manager";
}

export async function deleteCompanyDocumentFolder(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("company_documents")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", id);

  if (countError) {
    redirectWithError("/dashboard/file-manager", countError.message);
  }

  if (count > 0) {
    redirectWithError("/dashboard/file-manager", "Move or delete the documents in this folder before deleting it.");
  }

  const { error } = await supabase.from("company_document_folders").delete().eq("id", id);

  if (error) {
    redirectWithError("/dashboard/file-manager", error.message);
  }

  revalidatePath("/dashboard/file-manager");
  redirect("/dashboard/file-manager");
}
