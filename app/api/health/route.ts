import { NextRequest, NextResponse } from "next/server";
import { logServerEvent, requestIdFromHeaders } from "@/lib/observability/logger";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function probe(url: string, publishableKey: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { apikey: publishableKey, Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
      redirect: "error",
    });
    return response.ok;
  } catch { return false; }
}

export async function GET(request: NextRequest) {
  const requestId = requestIdFromHeaders(request.headers);
  let database = false;
  let auth = false;
  try {
    const { url, publishableKey } = getSupabaseConfig();
    [database, auth] = await Promise.all([
      probe(url + "/rest/v1/projects?select=id&limit=1", publishableKey),
      probe(url + "/auth/v1/health", publishableKey),
    ]);
  } catch { /* Invalid configuration is also degraded. */ }
  const healthy = database && auth;
  logServerEvent(healthy ? "info" : "warn", "health_check", { route: "/api/health", requestId, database, auth });
  return NextResponse.json({ status: healthy ? "ok" : "degraded" }, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
  });
}
