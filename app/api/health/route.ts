import { NextRequest, NextResponse } from "next/server";
import { logServerEvent, requestIdFromHeaders } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = requestIdFromHeaders(request.headers);
  const release = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.npm_package_version || "unknown";
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  logServerEvent("info", "health_check", {
    requestId,
    route: "/api/health",
    environment,
    supabaseConfigured,
  });

  return NextResponse.json(
    {
      status: "ok",
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
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    },
  );
}
