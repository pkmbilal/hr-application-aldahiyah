import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  const routeParams = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: notification } = await supabase
    .from("notifications")
    .select("id, href, read_at")
    .eq("id", routeParams.id)
    .maybeSingle();

  if (!notification) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!notification.read_at) {
    const now = new Date().toISOString();
    await supabase
      .from("notifications")
      .update({ read_at: now, updated_at: now })
      .eq("id", notification.id);
  }

  return NextResponse.redirect(new URL(notification.href || "/dashboard", request.url));
}
