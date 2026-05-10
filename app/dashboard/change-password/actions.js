"use server";

import { redirect } from "next/navigation";
import { getPasswordRuleError } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

function changePasswordUrl(params) {
  const searchParams = new URLSearchParams(params);
  return `/dashboard/change-password?${searchParams.toString()}`;
}

function errorUrl(message) {
  return changePasswordUrl({ error: message });
}

export async function changePassword(formData) {
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(errorUrl("Enter your current password and new password."));
  }

  const passwordRuleError = getPasswordRuleError(newPassword);

  if (passwordRuleError) {
    redirect(errorUrl(passwordRuleError));
  }

  if (newPassword !== confirmPassword) {
    redirect(errorUrl("New password and confirmation do not match."));
  }

  if (currentPassword === newPassword) {
    redirect(errorUrl("New password must be different from your current password."));
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email;

  if (!email) {
    redirect(errorUrl("Unable to verify your account. Sign out and sign in again."));
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verifyError) {
    redirect(errorUrl("Current password is incorrect."));
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(errorUrl("Password could not be changed. Try again."));
  }

  redirect(changePasswordUrl({ success: "Password changed successfully." }));
}
