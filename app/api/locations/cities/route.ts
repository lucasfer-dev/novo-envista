import { NextRequest, NextResponse } from "next/server";
import { isBrazilStateCode } from "@/lib/brazil-locations";

type IbgeCity = { id: number; nome: string };

export async function GET(request: NextRequest) {
  const state = (request.nextUrl.searchParams.get("state") || "").toUpperCase();
  if (!isBrazilStateCode(state)) {
    return NextResponse.json({ cities: [] }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`,
      { next: { revalidate: 86400 }, headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error(`IBGE ${response.status}`);
    const rows = (await response.json()) as IbgeCity[];
    const cities = rows
      .map((row) => row.nome)
      .filter((name) => typeof name === "string" && name.length > 0)
      .slice(0, 1000);
    return NextResponse.json(
      { cities },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json({ cities: [] }, { status: 502 });
  }
}
