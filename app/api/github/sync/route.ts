import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncGitHubRepositories } from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: connection, error: connectionError } = await supabase
    .from("github_connections")
    .select("installation_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (connectionError || !connection) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  try {
    const rows = await syncGitHubRepositories(supabase, userId, Number(connection.installation_id));
    return NextResponse.json({ ok: true, repositories: rows.length });
  } catch (error) {
    console.error("github.sync.failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível sincronizar o GitHub." },
      { status: 502 },
    );
  }
}
