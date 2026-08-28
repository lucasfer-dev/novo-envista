import { NextRequest, NextResponse } from "next/server";
import { scanOfficialCompetitions } from "@/lib/competitions/live-scan";
import type { LiveCompetitionsResponse } from "@/lib/competitions/types";

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

  try {
    const result = await scanOfficialCompetitions({ fresh });

    if (result.items.length > 0) {
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": fresh ? "no-store" : "public, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }

    const fallback = await fallbackToRoboComp();
    if (fallback?.items?.length) {
      return NextResponse.json({
        ...fallback,
        errors: [...result.errors, ...(fallback.errors || []), "Scanner nativo sem resultados; usando fallback do RoboComp."],
        mode: "envista-scan-fallback-robocomp",
      } satisfies LiveCompetitionsResponse);
    }

    return NextResponse.json(result, { status: 502 });
  } catch (error) {
    const fallback = await fallbackToRoboComp();
    if (fallback?.items?.length) {
      return NextResponse.json({
        ...fallback,
        errors: [error instanceof Error ? error.message : "Falha no scanner nativo", ...(fallback.errors || [])],
        mode: "envista-scan-fallback-robocomp",
      } satisfies LiveCompetitionsResponse);
    }

    return NextResponse.json(
      {
        items: [],
        checkedAt: new Date().toISOString(),
        sourcesChecked: 0,
        errors: [error instanceof Error ? error.message : "Falha ao consultar as fontes oficiais"],
        mode: "envista-live-official-scan-error",
      } satisfies LiveCompetitionsResponse,
      { status: 502 },
    );
  }
}
