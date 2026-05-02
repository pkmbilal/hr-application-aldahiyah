"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginErrorUrl(message) {
  const params = new URLSearchParams({
    error: message,
  });

  return `/login?${params.toString()}`;
}

export async function login(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectedFrom = String(formData.get("redirectedFrom") || "/dashboard");

  if (!email || !password) {
    redirect(loginErrorUrl("Enter your email and password."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(loginErrorUrl("Invalid email or password."));
  }

  redirect(redirectedFrom.startsWith("/dashboard") ? redirectedFrom : "/dashboard");
}
