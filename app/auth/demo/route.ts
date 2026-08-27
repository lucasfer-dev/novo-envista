import { NextResponse, type NextRequest } from "next/server";

const DEMO_COOKIE = "envista_demo";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  response.cookies.set(DEMO_COOKIE, "participant", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
