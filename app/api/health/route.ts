import { NextRequest, NextResponse } from "next/server";
import { logServerEvent, requestIdFromHeaders } from "@/lib/observability/logger";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = requestIdFromHeaders(request.headers);
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";

  let supabaseConfigured = false;
  try {
    getSupabaseConfig();
    supabaseConfigured = true;
  } catch {
    supabaseConfigured = false;
  }

  logServerEvent("info", "health_check", {
    requestId,
    route: "/api/health",
    environment,
    supabaseConfigured,
  });

  // A resposta pública revela apenas o necessário para uptime checks. Release,
  // ambiente e dependências continuam disponíveis somente nos logs do servidor.
  return NextResponse.json(
    { status: supabaseConfigured ? "ok" : "degraded" },
    {
      status: supabaseConfigured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    },
  );
}
