"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getSiteProjectFilePath, getSiteProjectFilePathForExtension, SITE_PROJECT_BUCKET } from "@/lib/site-projects";
import { deletePrivateFile, movePrivateFile, uploadPrivateFile } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

function requireAdmin(profile) {
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

function optionalText(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function normalizeProjectForm(formData) {
  return {
    name: optionalText(formData, "name"),
    order_no: optionalText(formData, "order_no"),
    details: optionalText(formData, "details"),
    is_active: formData.get("is_active") === "on",
  };
}

function redirectWithError(path, message) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function uploadSiteProjectFile(projectId, orderNo, file) {
  const path = getSiteProjectFilePath(projectId, orderNo, file);

  if (!path) {
    return null;
  }

  await uploadPrivateFile(SITE_PROJECT_BUCKET, path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  return {
    project_file_path: path,
    project_file_name: file.name || path.split("/").pop(),
    project_file_type: file.type || null,
    project_file_size: file.size || 0,
  };
}

async function renameSiteProjectFileForOrderNo(projectId, orderNo, oldPath) {
  if (!oldPath) {
    return null;
  }

  const extension = oldPath.includes(".") ? oldPath.split(".").pop().toLowerCase() : "bin";
  const nextPath = getSiteProjectFilePathForExtension(projectId, orderNo, extension);

  if (nextPath === oldPath) {
    return null;
  }

  await movePrivateFile(SITE_PROJECT_BUCKET, oldPath, nextPath);

  return {
    project_file_path: nextPath,
  };
}

export async function createSiteProject(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const payload = normalizeProjectForm(formData);

  if (!payload.name || !payload.order_no) {
    redirectWithError("/dashboard/site-projects/new", "Project name and order number are required.");
  }

  const supabase = await createClient();
  const projectId = crypto.randomUUID();
  const file = formData.get("project_file");
  let filePayload = null;
  let errorMessage = null;

  try {
    filePayload = await uploadSiteProjectFile(projectId, payload.order_no, file);
    const { error } = await supabase.from("site_projects").insert({
      id: projectId,
      ...payload,
      ...(filePayload || {}),
    });

    if (error) {
      if (filePayload?.project_file_path) {
        await deletePrivateFile(SITE_PROJECT_BUCKET, filePayload.project_file_path);
      }
      errorMessage = error.message;
    }
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError("/dashboard/site-projects/new", errorMessage);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}

export async function updateSiteProject(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const payload = normalizeProjectForm(formData);

  if (!payload.name || !payload.order_no) {
    redirectWithError(`/dashboard/site-projects/${id}/edit`, "Project name and order number are required.");
  }

  const supabase = await createClient();
  const file = formData.get("project_file");
  const oldFilePath = String(formData.get("project_file_path") || "");
  const updates = { ...payload, updated_at: new Date().toISOString() };
  let filePayload = null;
  let errorMessage = null;

  try {
    filePayload = await uploadSiteProjectFile(id, payload.order_no, file);

    if (filePayload) {
      Object.assign(updates, filePayload);
    } else {
      const renamePayload = await renameSiteProjectFileForOrderNo(id, payload.order_no, oldFilePath);

      if (renamePayload) {
        Object.assign(updates, renamePayload);
      }
    }

    const { error } = await supabase.from("site_projects").update(updates).eq("id", id);

    if (error) {
      if (filePayload?.project_file_path && filePayload.project_file_path !== oldFilePath) {
        await deletePrivateFile(SITE_PROJECT_BUCKET, filePayload.project_file_path);
      }
      errorMessage = error.message;
    }

    if (!errorMessage && filePayload?.project_file_path && oldFilePath && oldFilePath !== filePayload.project_file_path) {
      await deletePrivateFile(SITE_PROJECT_BUCKET, oldFilePath);
    }
  } catch (error) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    redirectWithError(`/dashboard/site-projects/${id}/edit`, errorMessage);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}

export async function deleteSiteProject(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const id = String(formData.get("id") || "");
  const filePath = String(formData.get("project_file_path") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("site_projects").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/site-projects?error=${encodeURIComponent(error.message)}`);
  }

  if (filePath) {
    await deletePrivateFile(SITE_PROJECT_BUCKET, filePath);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}

export async function deactivateSiteProject(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_projects")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/site-projects?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}
