import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import {
  getGitHubAppConfig,
  getInstallationDetails,
  syncGitHubRepositories,
} from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function integrationUrl(params: Record<string, string>) {
  const url = new URL("/integrations/github", resolveSiteUrl());
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get("state");
  const installationIdRaw = requestUrl.searchParams.get("installation_id");
  const setupAction = requestUrl.searchParams.get("setup_action");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("envista_github_state")?.value;
  cookieStore.delete("envista_github_state");

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(integrationUrl({ error: "invalid_state" }));
  }

  const installationId = Number(installationIdRaw);
  if (!Number.isSafeInteger(installationId) || installationId <= 0) {
    return NextResponse.redirect(integrationUrl({ error: "invalid_installation" }));
  }

  if (!getGitHubAppConfig()) {
    return NextResponse.redirect(integrationUrl({ error: "not_configured" }));
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return NextResponse.redirect(new URL("/login?next=/integrations/github", resolveSiteUrl()));
  }

  try {
    const installation = await getInstallationDetails(installationId);
    const account = installation.account;
    if (!account?.id || !account?.login) throw new Error("Conta do GitHub inválida.");

    const githubUrl = account.html_url || `https://github.com/${account.login}`;
    const now = new Date().toISOString();

    const { error: connectionError } = await supabase
      .from("github_connections")
      .upsert(
        {
          user_id: userId,
          installation_id: String(installationId),
          github_account_id: String(account.id),
          github_login: account.login,
          github_avatar_url: account.avatar_url || null,
          github_html_url: githubUrl,
          github_account_type: account.type || null,
          connected_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );

    if (connectionError) throw connectionError;

    await supabase
      .from("profiles")
      .update({ github_url: githubUrl })
      .eq("id", userId);

    await syncGitHubRepositories(supabase, userId, installationId);

    return NextResponse.redirect(
      integrationUrl({ status: setupAction === "update" ? "updated" : "connected" }),
    );
  } catch (error) {
    console.error("github.callback.failed", error);
    return NextResponse.redirect(integrationUrl({ error: "connection_failed" }));
  }
}
