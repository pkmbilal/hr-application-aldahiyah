import { createClient } from "@/lib/supabase/server";

const RECENT_NOTIFICATION_LIMIT = 8;

export async function getNotificationSummary(profile) {
  if (!profile?.id) {
    return {
      notifications: [],
      unreadCount: 0,
    };
  }

  const supabase = await createClient();
  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, body, href, read_at, created_at, entity_type")
      .order("created_at", { ascending: false })
      .limit(RECENT_NOTIFICATION_LIMIT),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  if (notificationsResult.error) {
    throw new Error(notificationsResult.error.message);
  }

  if (unreadResult.error) {
    throw new Error(unreadResult.error.message);
  }

  return {
    notifications: notificationsResult.data || [],
    unreadCount: unreadResult.count || 0,
  };
}

export async function createAdminSubmissionNotification({ profile, entityType, entityId, title, body, href }) {
  if (profile?.role === "admin") {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_admin_notification", {
    p_actor_user_id: profile.id,
    p_event_type: "created",
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_title: title,
    p_body: body,
    p_href: href,
  });

  if (error) {
    console.error("Failed to create admin notification:", error.message);
  }
}

export async function createEmployeeFineNotification({ profile, employeeId, fineId, title, body, href }) {
  if (profile?.role !== "admin") {
    return;
  }

  const supabase = await createClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("user_id")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee?.user_id) {
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    recipient_admin_id: employee.user_id,
    actor_user_id: profile.id,
    event_type: "created",
    entity_type: "vehicle_fine",
    entity_id: fineId,
    title,
    body,
    href,
  });

  if (error) {
    console.error("Failed to create employee fine notification:", error.message);
  }
}
