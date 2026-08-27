import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição não permitida." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível encerrar a sessão." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
