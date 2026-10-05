import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import { getGitHubAppConfig } from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (error || !userId) {
    return NextResponse.redirect(new URL("/login", resolveSiteUrl()));
  }

  const config = getGitHubAppConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/integrations/github?error=not_configured", resolveSiteUrl()),
    );
  }

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("envista_github_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/github",
  });

  const target = new URL(`https://github.com/apps/${config.slug}/installations/new`);
  target.searchParams.set("state", state);
  return NextResponse.redirect(target);
}
