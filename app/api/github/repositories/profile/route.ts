import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { repositoryId?: string; displayOnProfile?: boolean } | null;
  if (!body?.repositoryId || typeof body.displayOnProfile !== "boolean") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: repository, error: repositoryError } = await supabase
    .from("github_repositories")
    .select("github_repo_id,private")
    .eq("user_id", userId)
    .eq("github_repo_id", body.repositoryId)
    .maybeSingle();

  if (repositoryError || !repository) {
    return NextResponse.json({ error: "repository_not_found" }, { status: 404 });
  }

  if (repository.private && body.displayOnProfile) {
    return NextResponse.json(
      { error: "Repositórios privados não podem ser exibidos no perfil." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("github_repositories")
    .update({ display_on_profile: body.displayOnProfile })
    .eq("user_id", userId)
    .eq("github_repo_id", body.repositoryId);

  if (error) return NextResponse.json({ error: "Não foi possível salvar a preferência." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
