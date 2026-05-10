import { createClient } from "@/lib/supabase/server";

export const COMPANY_DOCUMENT_BUCKET = "company-documents";

export const COMPANY_DOCUMENT_CATEGORIES = [
  "Commercial Registration",
  "VAT Certificate",
  "National Address",
  "Bank Details",
  "Company Profile",
  "Other",
];

export async function listCompanyDocumentFolders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_document_folders")
    .select("id, name, description, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    if (isCompanyDocumentsSetupError(error)) {
      return {
        folders: [],
        setupRequired: true,
        setupMessage: error.message,
      };
    }

    throw new Error(error.message);
  }

  return {
    folders: data || [],
    setupRequired: false,
    setupMessage: null,
  };
}

export async function listCompanyDocuments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_documents")
    .select(
      "id, title, category, description, folder_id, storage_path, file_name, file_type, file_size, share_token, is_active, created_at, updated_at, folder:company_document_folders(id, name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isCompanyDocumentsSetupError(error)) {
      return {
        documents: [],
        setupRequired: true,
        setupMessage: error.message,
      };
    }

    throw new Error(error.message);
  }

  return {
    documents: await Promise.all((data || []).map(withSignedCompanyDocumentUrl)),
    setupRequired: false,
    setupMessage: null,
  };
}

export async function getCompanyDocument(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_documents")
    .select(
      "id, title, category, description, folder_id, storage_path, file_name, file_type, file_size, share_token, is_active, created_at, updated_at, folder:company_document_folders(id, name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedCompanyDocumentUrl(data);
}

export async function getSharedCompanyDocument(token) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_company_document_by_share_token", {
      p_share_token: token,
    })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedCompanyDocumentUrl(data);
}

export async function withSignedCompanyDocumentUrl(document) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(COMPANY_DOCUMENT_BUCKET)
    .createSignedUrl(document.storage_path, 60 * 10);

  return {
    ...document,
    file_url: data?.signedUrl || null,
    view_path: `/dashboard/file-manager/files/${document.id}`,
    download_path: `/dashboard/file-manager/files/${document.id}?download=1`,
    share_path: `/share/company-documents/${document.share_token || ""}`,
  };
}

export function getCompanyDocumentFilePath(documentId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${documentId}/document-${Date.now()}.${extension}`;
}

export function formatFileSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isCompanyDocumentsSetupError(error) {
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    error?.message?.includes("company_documents") ||
    error?.message?.includes("company_document_folders") ||
    error?.message?.includes("folder_id")
  );
}
