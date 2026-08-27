import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEMO_COOKIE = "envista_demo";

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

function clearDemoCookie(response: NextResponse) {
  response.cookies.set(DEMO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição não permitida." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (request.cookies.get(DEMO_COOKIE)?.value) {
    return clearDemoCookie(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return clearDemoCookie(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
}

export async function GET(request: NextRequest) {
  return clearDemoCookie(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
}
