import { createClient } from "@/lib/supabase/server";

export const SITE_PROJECT_BUCKET = "site-project-documents";

const SITE_PROJECT_COLUMNS =
  "id, name, order_no, details, is_active, project_file_path, project_file_name, project_file_type, project_file_size, created_at, updated_at";

export async function listSiteProjects({ activeOnly = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("site_projects")
    .select(SITE_PROJECT_COLUMNS)
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(withSiteProjectFilePaths);
}

export async function getSiteProject(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_projects")
    .select(SITE_PROJECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withSiteProjectFilePaths(data) : null;
}

export async function getSiteProjectFile(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_projects")
    .select("id, name, order_no, is_active, project_file_path, project_file_name, project_file_type")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.project_file_path) {
    return null;
  }

  const { data: signed } = await supabase.storage
    .from(SITE_PROJECT_BUCKET)
    .createSignedUrl(data.project_file_path, 60 * 10);

  return {
    ...data,
    file_url: signed?.signedUrl || null,
  };
}

export function getSiteProjectFilePath(projectId, orderNo, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return getSiteProjectFilePathForExtension(projectId, orderNo, extension);
}

export function getSiteProjectFilePathForExtension(projectId, orderNo, extension) {
  const normalizedExtension = String(extension || "bin").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  return `${projectId}/${sanitizePurchaseOrderFileName(orderNo)}.${normalizedExtension}`;
}

export function getSiteProjectDownloadFileName(project) {
  const extension = project?.project_file_name?.includes(".")
    ? project.project_file_name.split(".").pop().toLowerCase()
    : "bin";
  const companyName = sanitizePurchaseOrderFileName(project?.name || "company");
  const orderNo = sanitizePurchaseOrderFileName(project?.order_no || "purchase-order");
  return `${companyName}_${orderNo}.${extension}`;
}

function withSiteProjectFilePaths(project) {
  return {
    ...project,
    view_path: project.project_file_path ? `/dashboard/site-projects/files/${project.id}` : null,
    download_path: project.project_file_path ? `/dashboard/site-projects/files/${project.id}?download=1` : null,
  };
}

function sanitizePurchaseOrderFileName(orderNo) {
  const sanitized = String(orderNo || "purchase-order")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return sanitized || "purchase-order";
}
