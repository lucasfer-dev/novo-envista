import { NextRequest, NextResponse } from "next/server";
import { logServerEvent, requestIdFromHeaders } from "@/lib/observability/logger";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = requestIdFromHeaders(request.headers);
  const release = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.npm_package_version || "unknown";
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

  return NextResponse.json(
    {
      status: supabaseConfigured ? "ok" : "degraded",
      service: "envista-web",
      release,
      environment,
      dependencies: {
        supabaseConfigured,
      },
      checkedAt: new Date().toISOString(),
      requestId,
    },
    {
      status: supabaseConfigured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    },
  );
}
