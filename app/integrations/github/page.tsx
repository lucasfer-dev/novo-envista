import LegacySocialShell from "@/components/social/LegacySocialShell";
import GitHubIntegrationClient from "@/components/github/GitHubIntegrationClient";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { getGitHubAppConfig } from "@/lib/github/app";

export const dynamic = "force-dynamic";

export default async function GitHubIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, userId, role, appUser } = await requireProductUser();
  const params = await searchParams;

  const [connectionResult, repositoriesResult, eventsResult] = await Promise.all([
    supabase
      .from("github_connections")
      .select("installation_id,github_account_id,github_login,github_avatar_url,github_html_url,github_account_type,connected_at,updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("github_repositories")
      .select("github_repo_id,name,full_name,owner_login,description,html_url,homepage,private,language,stargazers_count,forks_count,open_issues_count,default_branch,topics,display_on_profile,github_updated_at,synced_at")
      .eq("user_id", userId)
      .order("github_updated_at", { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from("github_events")
      .select("id,event_type,event_action,title,summary,repository_full_name,repository_html_url,event_html_url,is_public,occurred_at")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(40),
  ]);

  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <LegacySocialShell user={appUser} role={role} pathname="/integrations/github">
      <GitHubIntegrationClient
        configured={Boolean(getGitHubAppConfig())}
        connection={connectionResult.data ?? null}
        repositories={repositoriesResult.data ?? []}
        events={eventsResult.data ?? []}
        initialStatus={status || null}
        initialError={error || null}
      />
    </LegacySocialShell>
  );
}
