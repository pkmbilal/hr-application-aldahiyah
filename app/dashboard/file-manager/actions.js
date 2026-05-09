"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import {
  COMPANY_DOCUMENT_BUCKET,
  COMPANY_DOCUMENT_CATEGORIES,
  getCompanyDocumentFilePath,
} from "@/lib/company-documents";
import { createClient } from "@/lib/supabase/server";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
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
    is_active: formData.get("is_active") === "on",
  };
}

function redirectWithError(path, message) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function uploadCompanyDocumentFile(supabase, documentId, file) {
  const path = getCompanyDocumentFilePath(documentId, file);

  if (!path) {
    return null;
  }

  const { error } = await supabase.storage.from(COMPANY_DOCUMENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    storage_path: path,
    file_name: file.name || "document",
    file_type: file.type || null,
    file_size: file.size || 0,
  };
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
    const filePayload = await uploadCompanyDocumentFile(supabase, documentId, file);
    const { error } = await supabase.from("company_documents").insert({
      id: documentId,
      ...payload,
      ...filePayload,
      uploaded_by: profile.id,
    });

    if (error) {
      await supabase.storage.from(COMPANY_DOCUMENT_BUCKET).remove([filePayload.storage_path]);
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
    const filePayload = await uploadCompanyDocumentFile(supabase, id, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    }

    const { error } = await supabase.from("company_documents").update(updates).eq("id", id);

    if (error) {
      if (filePayload?.storage_path) {
        await supabase.storage.from(COMPANY_DOCUMENT_BUCKET).remove([filePayload.storage_path]);
      }
      errorMessage = error.message;
    }

    if (!errorMessage && filePayload?.storage_path && oldStoragePath && oldStoragePath !== filePayload.storage_path) {
      await supabase.storage.from(COMPANY_DOCUMENT_BUCKET).remove([oldStoragePath]);
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
  const supabase = await createClient();
  const { error } = await supabase.from("company_documents").delete().eq("id", id);

  if (error) {
    redirectWithError("/dashboard/file-manager", error.message);
  }

  if (storagePath) {
    await supabase.storage.from(COMPANY_DOCUMENT_BUCKET).remove([storagePath]);
  }

  revalidatePath("/dashboard/file-manager");
  redirect("/dashboard/file-manager");
}
