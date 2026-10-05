import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getInstallationToken,
  githubGraphql,
  githubJson,
} from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  repositoryId?: string;
  kind?: "discussion" | "release" | "issue";
  title?: string;
  body?: string;
  tagName?: string;
};

function clean(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null) as PublishBody | null;
  const repositoryId = clean(payload?.repositoryId, 32);
  const kind = payload?.kind;
  const title = clean(payload?.title, 180);
  const body = clean(payload?.body, 10000);
  const tagName = clean(payload?.tagName, 120);

  if (!repositoryId || !kind || !title || !body) {
    return NextResponse.json({ error: "Preencha repositório, tipo, título e conteúdo." }, { status: 400 });
  }

  const [{ data: connection }, { data: repository }] = await Promise.all([
    supabase
      .from("github_connections")
      .select("installation_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("github_repositories")
      .select("github_repo_id,full_name,html_url,private,default_branch")
      .eq("user_id", userId)
      .eq("github_repo_id", repositoryId)
      .maybeSingle(),
  ]);

  if (!connection || !repository) {
    return NextResponse.json({ error: "Conexão ou repositório não encontrado." }, { status: 404 });
  }

  try {
    const token = await getInstallationToken(Number(connection.installation_id));
    let publishedUrl = repository.html_url;

    if (kind === "issue") {
      const result = await githubJson<{ html_url: string }>(
        token,
        `https://api.github.com/repos/${repository.full_name}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body }),
        },
      );
      publishedUrl = result.html_url;
    }

    if (kind === "release") {
      if (!tagName) {
        return NextResponse.json({ error: "Informe a tag/versão da release." }, { status: 400 });
      }
      const result = await githubJson<{ html_url: string }>(
        token,
        `https://api.github.com/repos/${repository.full_name}/releases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tag_name: tagName,
            target_commitish: repository.default_branch || "main",
            name: title,
            body,
            draft: false,
            prerelease: false,
          }),
        },
      );
      publishedUrl = result.html_url;
    }

    if (kind === "discussion") {
      const [owner, name] = repository.full_name.split("/");
      const query = `
        query EnvistaDiscussionTarget($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            id
            discussionCategories(first: 20) {
              nodes { id name }
            }
          }
        }
      `;
      const target = await githubGraphql<{
        repository: { id: string; discussionCategories: { nodes: Array<{ id: string; name: string }> } } | null;
      }>(token, query, { owner, name });

      const category = target.repository?.discussionCategories.nodes[0];
      if (!target.repository || !category) {
        return NextResponse.json(
          { error: "Este repositório não possui GitHub Discussions habilitado." },
          { status: 400 },
        );
      }

      const mutation = `
        mutation EnvistaCreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
          createDiscussion(input: {
            repositoryId: $repositoryId,
            categoryId: $categoryId,
            title: $title,
            body: $body
          }) {
            discussion { url }
          }
        }
      `;
      const created = await githubGraphql<{
        createDiscussion: { discussion: { url: string } };
      }>(token, mutation, {
        repositoryId: target.repository.id,
        categoryId: category.id,
        title,
        body,
      });
      publishedUrl = created.createDiscussion.discussion.url;
    }

    await supabase.from("github_events").insert({
      user_id: userId,
      event_type: "envista_publish",
      event_action: kind,
      title,
      summary: body.slice(0, 240),
      repository_full_name: repository.full_name,
      repository_html_url: repository.html_url,
      event_html_url: publishedUrl,
      is_public: !repository.private,
      occurred_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, url: publishedUrl });
  } catch (error) {
    console.error("github.publish.failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível publicar no GitHub." },
      { status: 502 },
    );
  }
}
