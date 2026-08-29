import { NextResponse, type NextRequest } from "next/server";

const DEMO_COOKIE = "envista_demo";

type DemoRole = "participant" | "investor";

function parseDemoRole(value: FormDataEntryValue | null): DemoRole {
  return value === "investor" ? "investor" : "participant";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const role = parseDemoRole(formData.get("role"));
  const destination = role === "investor" ? "/investor" : "/app";
  const response = NextResponse.redirect(new URL(destination, request.url), { status: 303 });

  response.cookies.set(DEMO_COOKIE, role, {
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
