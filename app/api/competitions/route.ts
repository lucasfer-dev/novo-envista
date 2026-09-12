import { NextRequest, NextResponse } from "next/server";
import { scanOfficialCompetitions } from "@/lib/competitions/live-scan";
import type { LiveCompetitionsResponse } from "@/lib/competitions/types";
import { logServerEvent, requestIdFromHeaders, safeErrorName } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";

const ROBOCOMP_FALLBACK = "https://robocomp-finder.vercel.app/api/open-competitions";

type RefreshDecision = {
  fresh: boolean;
  throttled: boolean;
  unauthorized: boolean;
};

async function claimFreshRefresh(requested: boolean): Promise<RefreshDecision> {
  if (!requested) return { fresh: false, throttled: false, unauthorized: false };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) {
    return { fresh: false, throttled: false, unauthorized: true };
  }

  const { data, error } = await supabase.rpc("claim_competition_refresh");
  if (error) {
    // Falhar fechado para a opção cara: a rota continua podendo entregar o
    // resultado em cache, mas nunca força consultas externas sem coordenação.
    return { fresh: false, throttled: true, unauthorized: false };
  }

  return { fresh: data === true, throttled: data !== true, unauthorized: false };
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
  const refresh = await claimFreshRefresh(requestedFresh);
  const requestId = requestIdFromHeaders(request.headers);
  const startedAt = Date.now();

  if (refresh.unauthorized) {
    return NextResponse.json(
      { error: "Autenticação necessária para forçar uma nova consulta." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
        },
      },
    );
  }

  const fresh = refresh.fresh;
  const responseHeaders: Record<string, string> = {
    "X-Request-ID": requestId,
    ...(refresh.throttled ? { "X-Envista-Refresh": "throttled" } : {}),
  };

  try {
    const result = await scanOfficialCompetitions({ fresh });

    if (result.items.length > 0) {
      logServerEvent("info", "competitions_scan_success", {
        requestId,
        route: "/api/competitions",
        fresh,
        refreshThrottled: refresh.throttled,
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
        refreshThrottled: refresh.throttled,
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
      refreshThrottled: refresh.throttled,
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
        refreshThrottled: refresh.throttled,
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
      refreshThrottled: refresh.throttled,
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
