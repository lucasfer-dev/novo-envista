import { NextResponse } from "next/server";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";

const ROBOCOMP_URL = "https://robocomp-finder.vercel.app/api/open-competitions";

function slugFromId(id: string) {
  return Buffer.from(id, "utf8").toString("base64url");
}

export async function GET() {
  try {
    const response = await fetch(ROBOCOMP_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { items: [], checkedAt: new Date().toISOString(), sourcesChecked: 0, errors: [`RoboComp HTTP ${response.status}`], mode: "robocomp-proxy" },
        { status: 502 },
      );
    }

    const source = (await response.json()) as Omit<LiveCompetitionsResponse, "items"> & { items?: Omit<LiveCompetition, "slug">[] };
    const items = (source.items || []).map((item) => ({ ...item, slug: slugFromId(item.id) }));

    return NextResponse.json({
      items,
      checkedAt: source.checkedAt || new Date().toISOString(),
      sourcesChecked: source.sourcesChecked || 0,
      errors: source.errors || [],
      mode: source.mode || "robocomp-proxy",
    } satisfies LiveCompetitionsResponse);
  } catch (error) {
    return NextResponse.json(
      {
        items: [],
        checkedAt: new Date().toISOString(),
        sourcesChecked: 0,
        errors: [error instanceof Error ? error.message : "Falha ao consultar o RoboComp"],
        mode: "robocomp-proxy",
      } satisfies LiveCompetitionsResponse,
      { status: 502 },
    );
  }
}
