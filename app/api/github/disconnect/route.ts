import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: connection } = await supabase
    .from("github_connections")
    .select("github_html_url")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Não foi possível desconectar o GitHub." }, { status: 500 });
  }

  if (connection?.github_html_url) {
    const { data: profile } = await supabase.from("profiles").select("github_url").eq("id", userId).maybeSingle();
    if (profile?.github_url === connection.github_html_url) {
      await supabase.from("profiles").update({ github_url: null }).eq("id", userId);
    }
  }

  return NextResponse.json({ ok: true });
}
