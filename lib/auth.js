import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return {
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", claims.sub)
    .maybeSingle();

  if (profile) {
    return {
      user: claims,
      profile,
    };
  }

  const fallbackProfile = {
    id: claims.sub,
    role: "employee",
    full_name: claims.user_metadata?.full_name || claims.user_metadata?.name || null,
    email: claims.email || null,
  };

  const { data: createdProfile } = await supabase
    .from("profiles")
    .insert(fallbackProfile)
    .select("id, role, full_name, email")
    .single();

  return {
    user: claims,
    profile: createdProfile || fallbackProfile,
  };
}

export async function requireCurrentUserProfile() {
  const auth = await getCurrentUserProfile();

  if (!auth.user) {
    redirect("/login");
  }

  return auth;
}
