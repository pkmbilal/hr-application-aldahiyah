import { checkSupabaseHealth } from "@/lib/supabase/health";

export async function GET() {
  try {
    const health = await checkSupabaseHealth();

    return Response.json({
      service: "supabase",
      ok: health.ok,
      status: health.status,
    });
  } catch (error) {
    return Response.json(
      {
        service: "supabase",
        ok: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
