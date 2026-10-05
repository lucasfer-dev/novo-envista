import { createHmac, createSign, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const API_VERSION = "2022-11-28";
const GITHUB_API = "https://api.github.com";

export type GitHubAppConfig = {
  appId: string;
  slug: string;
  privateKey: string;
  webhookSecret?: string;
};

type InstallationAccount = {
  id: number;
  login: string;
  avatar_url?: string | null;
  html_url?: string | null;
  type?: string | null;
};

type Installation = {
  id: number;
  account: InstallationAccount;
};

type InstallationRepositoriesResponse = {
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    homepage?: string | null;
    description?: string | null;
    language?: string | null;
    stargazers_count?: number | null;
    forks_count?: number | null;
    open_issues_count?: number | null;
    default_branch?: string | null;
    updated_at?: string | null;
    topics?: string[] | null;
    owner?: { login?: string | null };
  }>;
};

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const slug = process.env.GITHUB_APP_SLUG?.trim();
  const encodedPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY_BASE64?.trim();

  if (!appId || !slug || !encodedPrivateKey) return null;

  try {
    const privateKey = Buffer.from(encodedPrivateKey, "base64").toString("utf8").trim();
    if (!privateKey) return null;
    return {
      appId,
      slug,
      privateKey,
      webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export function createGitHubAppJwt(config: GitHubAppConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: config.appId }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("base64url");
  return `${unsigned}.${signature}`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "Envista-GitHub-Integration",
  };
}

async function readGitHubError(response: Response) {
  try {
    const data = await response.json();
    if (data && typeof data.message === "string") return data.message;
  } catch {
    // Keep the generic status message below.
  }
  return `GitHub respondeu com status ${response.status}.`;
}

export async function getInstallationDetails(installationId: number) {
  const config = getGitHubAppConfig();
  if (!config) throw new Error("Integração do GitHub não configurada.");
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}`, {
    headers: githubHeaders(createGitHubAppJwt(config)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readGitHubError(response));
  return (await response.json()) as Installation;
}

export async function getInstallationToken(installationId: number) {
  const config = getGitHubAppConfig();
  if (!config) throw new Error("Integração do GitHub não configurada.");
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: githubHeaders(createGitHubAppJwt(config)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readGitHubError(response));
  const data = (await response.json()) as { token?: string };
  if (!data.token) throw new Error("O GitHub não retornou um token de instalação.");
  return data.token;
}

export async function githubJson<T>(token: string, url: string, init: RequestInit = {}) {
  const headers = new Headers(githubHeaders(token));
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readGitHubError(response));
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
) {
  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const data = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (!response.ok || data.errors?.length || !data.data) {
    throw new Error(data.errors?.[0]?.message || `GitHub GraphQL respondeu com status ${response.status}.`);
  }
  return data.data;
}

export async function createGitHubDiscussion(
  token: string,
  repositoryFullName: string,
  title: string,
  body: string,
) {
  const [owner, name] = repositoryFullName.split("/");
  if (!owner || !name) throw new Error("Repositório do GitHub inválido.");

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

  const categories = target.repository?.discussionCategories.nodes ?? [];
  const category =
    categories.find((item) => /announcement|general|anúncio|geral/i.test(item.name)) ??
    categories[0];

  if (!target.repository || !category) {
    throw new Error("Este repositório não possui GitHub Discussions habilitado.");
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

  return created.createDiscussion.discussion.url;
}

export async function syncGitHubRepositories(
  supabase: SupabaseClient,
  userId: string,
  installationId: number,
) {
  const token = await getInstallationToken(installationId);
  const allRepositories: InstallationRepositoriesResponse["repositories"] = [];

  for (let page = 1; page <= 10; page += 1) {
    const data = await githubJson<InstallationRepositoriesResponse>(
      token,
      `${GITHUB_API}/installation/repositories?per_page=100&page=${page}`,
    );
    allRepositories.push(...data.repositories);
    if (data.repositories.length < 100) break;
  }

  const { data: existing } = await supabase
    .from("github_repositories")
    .select("github_repo_id,display_on_profile")
    .eq("user_id", userId);

  const displayPreference = new Map(
    (existing ?? []).map((row: any) => [String(row.github_repo_id), Boolean(row.display_on_profile)]),
  );

  const rows = allRepositories.map((repo) => ({
    user_id: userId,
    github_repo_id: String(repo.id),
    name: repo.name,
    full_name: repo.full_name,
    owner_login: repo.owner?.login || repo.full_name.split("/")[0] || "",
    description: repo.description || null,
    html_url: repo.html_url,
    homepage: repo.homepage || null,
    private: Boolean(repo.private),
    language: repo.language || null,
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    open_issues_count: repo.open_issues_count || 0,
    default_branch: repo.default_branch || "main",
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    github_updated_at: repo.updated_at || null,
    display_on_profile:
      displayPreference.get(String(repo.id)) ?? !repo.private,
    synced_at: new Date().toISOString(),
  }));

  if (rows.length) {
    const { error } = await supabase
      .from("github_repositories")
      .upsert(rows, { onConflict: "user_id,github_repo_id" });
    if (error) throw error;
  }

  await supabase
    .from("github_connections")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return rows;
}

export function verifyGitHubWebhookSignature(body: string, signature: string | null) {
  const secret = getGitHubAppConfig()?.webhookSecret;
  if (!secret || !signature) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export type GitHubEventSummary = {
  eventType: string;
  action: string | null;
  title: string;
  summary: string | null;
  repositoryFullName: string | null;
  repositoryHtmlUrl: string | null;
  eventHtmlUrl: string | null;
  isPublic: boolean;
  occurredAt: string;
};

function trimSummary(value: unknown) {
  if (typeof value !== "string") return null;
  const compact = value.trim().replace(/\s+/g, " ");
  return compact ? compact.slice(0, 240) : null;
}

export function summarizeGitHubEvent(eventName: string, payload: any): GitHubEventSummary | null {
  const repository = payload?.repository;
  const fullName = typeof repository?.full_name === "string" ? repository.full_name : null;
  const repositoryUrl = typeof repository?.html_url === "string" ? repository.html_url : null;
  const isPublic = repository ? !Boolean(repository.private) : false;
  const now = new Date().toISOString();

  if (eventName === "push") {
    const commits = Array.isArray(payload?.commits) ? payload.commits : [];
    const branch = typeof payload?.ref === "string" ? payload.ref.replace("refs/heads/", "") : "branch";
    return {
      eventType: "push",
      action: "pushed",
      title: `${payload?.sender?.login || "Alguém"} enviou ${commits.length} commit${commits.length === 1 ? "" : "s"} para ${repository?.name || "um repositório"}`,
      summary: trimSummary(payload?.head_commit?.message || `Atualização em ${branch}`),
      repositoryFullName: fullName,
      repositoryHtmlUrl: repositoryUrl,
      eventHtmlUrl: typeof payload?.compare === "string" ? payload.compare : repositoryUrl,
      isPublic,
      occurredAt: payload?.head_commit?.timestamp || now,
    };
  }

  if (eventName === "pull_request" && payload?.pull_request) {
    return {
      eventType: "pull_request",
      action: payload?.action || null,
      title: `Pull request #${payload.number}: ${payload.pull_request.title}`,
      summary: trimSummary(payload.pull_request.body || payload.action),
      repositoryFullName: fullName,
      repositoryHtmlUrl: repositoryUrl,
      eventHtmlUrl: payload.pull_request.html_url || repositoryUrl,
      isPublic,
      occurredAt: payload.pull_request.updated_at || now,
    };
  }

  if (eventName === "release" && payload?.release) {
    return {
      eventType: "release",
      action: payload?.action || null,
      title: `Release ${payload.release.tag_name || payload.release.name || "nova"} em ${repository?.name || "GitHub"}`,
      summary: trimSummary(payload.release.body || payload.release.name),
      repositoryFullName: fullName,
      repositoryHtmlUrl: repositoryUrl,
      eventHtmlUrl: payload.release.html_url || repositoryUrl,
      isPublic,
      occurredAt: payload.release.published_at || payload.release.created_at || now,
    };
  }

  if (eventName === "issues" && payload?.issue) {
    return {
      eventType: "issue",
      action: payload?.action || null,
      title: `Issue #${payload.issue.number}: ${payload.issue.title}`,
      summary: trimSummary(payload.issue.body || payload.action),
      repositoryFullName: fullName,
      repositoryHtmlUrl: repositoryUrl,
      eventHtmlUrl: payload.issue.html_url || repositoryUrl,
      isPublic,
      occurredAt: payload.issue.updated_at || now,
    };
  }

  if (eventName === "discussion" && payload?.discussion) {
    return {
      eventType: "discussion",
      action: payload?.action || null,
      title: `Discussão: ${payload.discussion.title}`,
      summary: trimSummary(payload.discussion.body || payload.action),
      repositoryFullName: fullName,
      repositoryHtmlUrl: repositoryUrl,
      eventHtmlUrl: payload.discussion.html_url || repositoryUrl,
      isPublic,
      occurredAt: payload.discussion.updated_at || now,
    };
  }

  return null;
}
