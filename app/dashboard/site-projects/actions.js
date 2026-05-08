"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUserProfile } from "@/lib/auth";
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

export async function createSiteProject(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const payload = normalizeProjectForm(formData);

  if (!payload.name || !payload.order_no) {
    redirect("/dashboard/site-projects/new?error=Project name and order number are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_projects").insert(payload);

  if (error) {
    redirect(`/dashboard/site-projects/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}

export async function updateSiteProject(id, formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const payload = normalizeProjectForm(formData);

  if (!payload.name || !payload.order_no) {
    redirect(`/dashboard/site-projects/${id}/edit?error=Project name and order number are required.`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_projects")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/site-projects/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/site-projects");
  redirect("/dashboard/site-projects");
}

export async function deleteSiteProject(formData) {
  const { profile } = await requireCurrentUserProfile();
  requireAdmin(profile);
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("site_projects").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard/site-projects?error=${encodeURIComponent(error.message)}`);
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
