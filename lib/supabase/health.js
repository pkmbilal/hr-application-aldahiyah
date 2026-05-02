import { getSupabaseConfig } from "@/lib/supabase/config";

export async function checkSupabaseHealth() {
  const { url, publishableKey } = getSupabaseConfig();
  const healthUrl = new URL("/auth/v1/health", url);

  const response = await fetch(healthUrl, {
    headers: {
      apikey: publishableKey,
    },
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
  };
}
