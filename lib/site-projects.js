import { createClient } from "@/lib/supabase/server";

export async function listSiteProjects({ activeOnly = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("site_projects")
    .select("id, name, order_no, details, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getSiteProject(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_projects")
    .select("id, name, order_no, details, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}
