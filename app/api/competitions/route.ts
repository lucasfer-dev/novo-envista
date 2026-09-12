import { NextRequest, NextResponse } from "next/server";
import { scanOfficialCompetitions } from "@/lib/competitions/live-scan";
import type { LiveCompetitionsResponse } from "@/lib/competitions/types";
import { logServerEvent, requestIdFromHeaders, safeErrorName } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";

const ROBOCOMP_FALLBACK = "https://robocomp-finder.vercel.app/api/open-competitions";

async function canForceFreshScan(requested: boolean) {
  if (!requested) return false;

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const aal = claims?.claims?.aal;
  if (claimsError || !userId || aal !== "aal2") return false;

  const { data: adminMembership } = await supabase
    .from("admin_memberships")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(adminMembership?.user_id);
}

async function fallbackToRoboComp(fresh: boolean): Promise<LiveCompetitionsResponse | null> {
  try {
    const response = await fetch(ROBOCOMP_FALLBACK, {
      headers: { Accept: "application/json" },
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
    });
    if (!response.ok) return null;
    return (await response.json()) as LiveCompetitionsResponse;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestedFresh = request.nextUrl.searchParams.get("fresh") === "1";
  const fresh = await canForceFreshScan(requestedFresh);
  const requestId = requestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  const responseHeaders: Record<string, string> = {
    "X-Request-ID": requestId,
    ...(requestedFresh && !fresh ? { "X-Envista-Refresh": "cached" } : {}),
  };

  try {
    const result = await scanOfficialCompetitions({ fresh });

    if (result.items.length > 0) {
      logServerEvent("info", "competitions_scan_success", {
        requestId,
        route: "/api/competitions",
        fresh,
        requestedFresh,
        itemCount: result.items.length,
        sourcesChecked: result.sourcesChecked,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(result, {
        headers: {
          ...responseHeaders,
          "Cache-Control": fresh ? "no-store" : "public, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }

    const fallback = await fallbackToRoboComp(fresh);
    if (fallback?.items?.length) {
      logServerEvent("warn", "competitions_scan_fallback", {
        requestId,
        route: "/api/competitions",
        fresh,
        requestedFresh,
        itemCount: fallback.items.length,
        sourcesChecked: result.sourcesChecked,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ...fallback,
          errors: [
            ...result.errors,
            ...(fallback.errors || []),
            "Scanner nativo sem resultados; usando fallback do RoboComp.",
          ],
          mode: "envista-scan-fallback-robocomp",
        } satisfies LiveCompetitionsResponse,
        {
          headers: {
            ...responseHeaders,
            "Cache-Control": fresh ? "no-store" : "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    logServerEvent("error", "competitions_scan_empty", {
      requestId,
      route: "/api/competitions",
      fresh,
      requestedFresh,
      sourcesChecked: result.sourcesChecked,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(result, { status: 502, headers: responseHeaders });
  } catch (error) {
    const fallback = await fallbackToRoboComp(fresh);
    if (fallback?.items?.length) {
      logServerEvent("warn", "competitions_scan_exception_fallback", {
        requestId,
        route: "/api/competitions",
        fresh,
        requestedFresh,
        errorName: safeErrorName(error),
        itemCount: fallback.items.length,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ...fallback,
          errors: ["Scanner nativo indisponível; usando fallback do RoboComp.", ...(fallback.errors || [])],
          mode: "envista-scan-fallback-robocomp",
        } satisfies LiveCompetitionsResponse,
        {
          headers: {
            ...responseHeaders,
            "Cache-Control": fresh ? "no-store" : "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    logServerEvent("error", "competitions_scan_failure", {
      requestId,
      route: "/api/competitions",
      fresh,
      requestedFresh,
      errorName: safeErrorName(error),
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        items: [],
        checkedAt: new Date().toISOString(),
        sourcesChecked: 0,
        errors: ["Falha temporária ao consultar as fontes oficiais."],
        mode: "envista-live-official-scan-error",
      } satisfies LiveCompetitionsResponse,
      { status: 502, headers: responseHeaders },
    );
  }
}
