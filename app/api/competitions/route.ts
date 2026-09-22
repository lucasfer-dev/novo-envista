import { NextRequest, NextResponse } from "next/server";
import { scanOfficialCompetitions } from "@/lib/competitions/live-scan";
import { scanExtraOfficialCompetitions } from "@/lib/competitions/extra-live-sources";
import { scanCatalogOfficialCompetitions } from "@/lib/competitions/catalog-live-scan";
import type { CompetitionStatus, LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import { VERIFIED_COMPETITION_CATALOG_2026 } from "@/lib/competitions/catalog-2026";
import { logServerEvent, requestIdFromHeaders, safeErrorName } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";

const ROBOCOMP_FALLBACK = "https://robocomp-finder.vercel.app/api/open-competitions";

async function canForceFreshScan(requested: boolean) {
  if (!requested) return false;

  // Any authenticated product user may request an immediate refresh. The normal
  // page load still uses the shared 5-minute cache to avoid hammering official
  // competition websites.
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  return Boolean(!error && claims?.claims?.sub);
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

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function mergeItems(items: LiveCompetition[]) {
  const map = new Map<string, LiveCompetition>();
  for (const competition of items) {
    const key = competition.id || normalize(`${competition.name}|${competition.city}|${competition.eventDate || ""}`);
    const current = map.get(key);
    if (!current || competition.confidence > current.confidence) map.set(key, competition);
  }
  const order: Record<CompetitionStatus, number> = { OPEN: 0, UPCOMING: 1, UNKNOWN: 2, CLOSED: 3 };
  return Array.from(map.values()).sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    const aDate = a.registrationEnd || a.eventDate || "9999-12-31";
    const bDate = b.registrationEnd || b.eventDate || "9999-12-31";
    return aDate.localeCompare(bDate);
  });
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
    const [primary, extra, curated] = await Promise.all([
      scanOfficialCompetitions({ fresh }),
      scanExtraOfficialCompetitions({ fresh }),
      scanCatalogOfficialCompetitions({ fresh }),
    ]);
    const result: LiveCompetitionsResponse = {
      items: mergeItems([...primary.items, ...extra.items, ...curated.items, ...VERIFIED_COMPETITION_CATALOG_2026]),
      checkedAt: new Date().toISOString(),
      sourcesChecked: primary.sourcesChecked + extra.sourcesChecked + curated.sourcesChecked,
      errors: [...primary.errors, ...extra.errors, ...curated.errors],
      mode: fresh ? "envista-all-sources-live-fresh-v4" : "envista-all-sources-live-v4",
    };

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
          "Cache-Control": fresh ? "no-store" : "public, s-maxage=300, stale-while-revalidate=600",
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
