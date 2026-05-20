"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(formData) {
  const { profile } = await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_admin_id", profile.id)
    .is("read_at", null);

  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsAsRead() {
  const { profile } = await requireCurrentUserProfile();

  const now = new Date().toISOString();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: now, updated_at: now })
    .eq("recipient_admin_id", profile.id)
    .is("read_at", null);

  revalidatePath("/dashboard", "layout");
}
