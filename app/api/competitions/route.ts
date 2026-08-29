import { NextRequest, NextResponse } from "next/server";
import { scanOfficialCompetitions } from "@/lib/competitions/live-scan";
import type { LiveCompetitionsResponse } from "@/lib/competitions/types";
import { logServerEvent, requestIdFromHeaders, safeErrorName } from "@/lib/observability/logger";

const ROBOCOMP_FALLBACK = "https://robocomp-finder.vercel.app/api/open-competitions";

async function fallbackToRoboComp(): Promise<LiveCompetitionsResponse | null> {
  try {
    const response = await fetch(ROBOCOMP_FALLBACK, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as LiveCompetitionsResponse;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";
  const requestId = requestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  const responseHeaders = { "X-Request-ID": requestId };

  try {
    const result = await scanOfficialCompetitions({ fresh });

    if (result.items.length > 0) {
      logServerEvent("info", "competitions_scan_success", {
        requestId,
        route: "/api/competitions",
        fresh,
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

    const fallback = await fallbackToRoboComp();
    if (fallback?.items?.length) {
      logServerEvent("warn", "competitions_scan_fallback", {
        requestId,
        route: "/api/competitions",
        fresh,
        itemCount: fallback.items.length,
        sourcesChecked: result.sourcesChecked,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          ...fallback,
          errors: [...result.errors, ...(fallback.errors || []), "Scanner nativo sem resultados; usando fallback do RoboComp."],
          mode: "envista-scan-fallback-robocomp",
        } satisfies LiveCompetitionsResponse,
        { headers: responseHeaders },
      );
    }

    logServerEvent("error", "competitions_scan_empty", {
      requestId,
      route: "/api/competitions",
      fresh,
      sourcesChecked: result.sourcesChecked,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(result, { status: 502, headers: responseHeaders });
  } catch (error) {
    const fallback = await fallbackToRoboComp();
    if (fallback?.items?.length) {
      logServerEvent("warn", "competitions_scan_exception_fallback", {
        requestId,
        route: "/api/competitions",
        fresh,
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
        { headers: responseHeaders },
      );
    }

    logServerEvent("error", "competitions_scan_failure", {
      requestId,
      route: "/api/competitions",
      fresh,
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
