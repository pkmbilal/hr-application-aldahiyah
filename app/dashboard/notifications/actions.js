"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(formData) {
  await requireCurrentUserProfile();
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead() {
  await requireCurrentUserProfile();

  const now = new Date().toISOString();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: now, updated_at: now })
    .is("read_at", null);

  revalidatePath("/dashboard");
}
