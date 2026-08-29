import LegacySocialFeed, {
  type SocialFeedItem,
  type SocialPostFeedItem,
  type SocialProjectUpdateFeedItem,
  type SocialSuggestion,
} from "@/components/social/LegacySocialFeed";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import { entityRoute } from "@/lib/profiles";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type FeedMode = "for-you" | "following";
type FeedRef = { kind: "post" | "project-update"; id: string; activity_at: string; followed: boolean };

const PAGE_SIZE = 12;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asTime(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(first(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
}

function socialHref(path: string, mode: FeedMode, query: string, page: number) {
  const params = new URLSearchParams();
  if (mode === "following") params.set("mode", "following");
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function feedPayload(data: unknown): { refs: FeedRef[]; total: number } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { refs: [], total: 0 };
  const payload = data as { refs?: unknown; total?: unknown };
  const refs = Array.isArray(payload.refs)
    ? payload.refs.filter((item): item is FeedRef => {
        if (!item || typeof item !== "object") return false;
        const ref = item as Partial<FeedRef>;
        return (ref.kind === "post" || ref.kind === "project-update") && typeof ref.id === "string";
      })
    : [];
  return { refs, total: Number(payload.total ?? 0) || 0 };
}

export default async function LegacySocialServerPage({
  expectedRole,
  searchParams,
}: {
  expectedRole: ProductRole;
  searchParams: SearchParams;
}) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const context = expectedRole === "investor" ? "investor" : "participant";
  const path = expectedRole === "investor" ? "/investor/social" : "/app/social";
  const feedMode: FeedMode = first(query.mode) === "following" ? "following" : "for-you";
  const searchQuery = (first(query.q) ?? "").trim().slice(0, 120);
  const page = pageNumber(query.page);
  const returnTo = socialHref(path, feedMode, searchQuery, page);

  const [feedResult, followingCountResult, membershipsResult, profilesResult, teamsResult, suggestionProjectsResult] = await Promise.all([
    supabase.rpc("get_social_feed_refs", {
      feed_mode: feedMode,
      search_query: searchQuery,
      result_offset: (page - 1) * PAGE_SIZE,
      result_limit: PAGE_SIZE,
    }),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase
      .from("team_members")
      .select("team_id,access_level,teams(id,slug,name)")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("id,username,display_name,role,bio")
      .eq("profile_visibility", "platform")
      .neq("id", userId)
      .order("display_name")
      .limit(24),
    supabase
      .from("teams")
      .select("id,slug,name,description,category")
      .eq("visibility", "platform")
      .order("updated_at", { ascending: false })
      .limit(24),
    supabase
      .from("projects")
      .select("id,slug,title,stage")
      .eq("visibility", "platform")
      .order("updated_at", { ascending: false })
      .limit(24),
  ]);

  const feed = feedPayload(feedResult.data);
  const refs = feed.refs;
  const pageCount = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
  const postIds = refs.filter((ref) => ref.kind === "post").map((ref) => ref.id);
  const projectIds = refs.filter((ref) => ref.kind === "project-update").map((ref) => ref.id);
  const memberships = membershipsResult.data ?? [];
  const memberTeams = new Set(memberships.map((item: any) => item.team_id));
  const managerTeams = new Set(
    memberships
      .filter((item: any) => item.access_level === "owner" || item.access_level === "admin")
      .map((item: any) => item.team_id),
  );

  const empty = Promise.resolve({ data: [] as any[], error: null });
  const [postsResult, projectsResult, likesResult, commentsResult] = await Promise.all([
    postIds.length
      ? supabase
          .from("posts")
          .select("id,body,visibility,created_at,created_by,author_user_id,author_team_id,project_id,author_user:profiles!posts_author_user_id_fkey(id,username,display_name,role),author_team:teams!posts_author_team_id_fkey(id,slug,name),project:projects!posts_project_id_fkey(id,slug,title)")
          .in("id", postIds)
      : empty,
    projectIds.length
      ? supabase
          .from("projects")
          .select("id,slug,title,short_description,stage,visibility,owner_user_id,owner_team_id,created_at,updated_at,owner_user:profiles!projects_owner_user_id_fkey(id,username,display_name,role),owner_team:teams!projects_owner_team_id_fkey(id,slug,name)")
          .in("id", projectIds)
      : empty,
    postIds.length
      ? supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds)
      : empty,
    postIds.length
      ? supabase
          .from("post_comments")
          .select("id,post_id,user_id,body,created_at,author:profiles!post_comments_user_id_fkey(username,display_name)")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : empty,
  ]);

  const refsByKey = new Map(refs.map((ref) => [`${ref.kind}:${ref.id}`, ref]));
  const likes = likesResult.data ?? [];
  const comments = commentsResult.data ?? [];

  const postItemMap = new Map<string, SocialPostFeedItem>();
  for (const post of postsResult.data ?? []) {
    const authorUser = one<any>((post as any).author_user);
    const authorTeam = one<any>((post as any).author_team);
    const project = one<any>((post as any).project);
    const postLikes = likes.filter((like: any) => like.post_id === (post as any).id);
    const postComments = comments
      .filter((comment: any) => comment.post_id === (post as any).id)
      .map((comment: any) => {
        const author = one<any>(comment.author);
        return {
          id: comment.id,
          body: comment.body,
          userId: comment.user_id,
          authorLabel: author?.display_name || author?.username || "Usuário",
        };
      });

    const authorLabel = authorTeam?.name || authorUser?.display_name || authorUser?.username || "Conta Envista";
    const authorHandle = authorTeam?.slug ? `@${authorTeam.slug}` : authorUser?.username ? `@${authorUser.username}` : "@envista";
    const authorType = authorTeam ? "team" : authorUser?.role === "investor" ? "investor" : "participant";
    const authorId = authorTeam?.slug || authorUser?.username || "";
    const ref = refsByKey.get(`post:${(post as any).id}`);

    postItemMap.set((post as any).id, {
      kind: "post",
      id: (post as any).id,
      body: (post as any).body,
      visibility: (post as any).visibility === "private" ? "private" : "platform",
      createdAt: (post as any).created_at,
      authorLabel,
      authorHandle,
      authorKind: authorType,
      authorHref: authorId
        ? entityRoute({ type: authorType, id: authorId, source: "social", context })
        : path,
      followed: Boolean(ref?.followed),
      canDelete:
        (post as any).author_user_id === userId ||
        (post as any).created_by === userId ||
        Boolean((post as any).author_team_id && managerTeams.has((post as any).author_team_id)),
      liked: postLikes.some((like: any) => like.user_id === userId),
      likeCount: postLikes.length,
      comments: postComments,
      project: project
        ? {
            id: project.id,
            title: project.title,
            href: entityRoute({ type: "project", id: project.slug, source: "social", context }),
          }
        : null,
    });
  }

  const projectItemMap = new Map<string, SocialProjectUpdateFeedItem>();
  for (const project of projectsResult.data ?? []) {
    const row = project as any;
    const ownerUser = one<any>(row.owner_user);
    const ownerTeam = one<any>(row.owner_team);
    const createdAt = asTime(row.created_at);
    const updatedAt = asTime(row.updated_at);
    const ref = refsByKey.get(`project-update:${row.id}`);

    projectItemMap.set(row.id, {
      kind: "project-update",
      id: `project-update:${row.id}:${row.updated_at}`,
      createdAt: row.updated_at || row.created_at,
      title: row.title,
      description: row.short_description || "O projeto recebeu uma nova atualização.",
      stage: row.stage,
      href: entityRoute({ type: "project", id: row.slug, source: "social", context }),
      ownerLabel: ownerTeam?.name || ownerUser?.display_name || ownerUser?.username || "Projeto Envista",
      ownerKind: ownerTeam ? "team" : ownerUser?.role === "investor" ? "investor" : "participant",
      followed: Boolean(ref?.followed),
      isNew: Math.abs(updatedAt - createdAt) < 90_000,
    });
  }

  const items: SocialFeedItem[] = refs
    .map((ref) => ref.kind === "post" ? postItemMap.get(ref.id) : projectItemMap.get(ref.id))
    .filter((item): item is SocialFeedItem => Boolean(item));

  const teamOptions = expectedRole === "participant"
    ? memberships
        .map((membership: any) => one<any>(membership.teams))
        .filter(Boolean)
        .map((team: any) => ({ id: team.id, name: team.name }))
    : [];

  let projectOptions: Array<{ id: string; title: string; slug: string }> = [];
  if (expectedRole === "participant") {
    let ownedQuery = supabase
      .from("projects")
      .select("id,title,slug")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (memberTeams.size) {
      ownedQuery = ownedQuery.or(`owner_user_id.eq.${userId},owner_team_id.in.(${Array.from(memberTeams).join(",")})`);
    } else {
      ownedQuery = ownedQuery.eq("owner_user_id", userId);
    }

    const ownedProjects = await ownedQuery;
    projectOptions = (ownedProjects.data ?? []).map((project: any) => ({ id: project.id, title: project.title, slug: project.slug }));
  }

  const profileCandidates = profilesResult.data ?? [];
  const teamCandidates = teamsResult.data ?? [];
  const projectCandidates = suggestionProjectsResult.data ?? [];
  const profileIds = profileCandidates.map((profile: any) => profile.id);
  const teamIds = teamCandidates.map((team: any) => team.id);
  const suggestionProjectIds = projectCandidates.map((project: any) => project.id);

  const [followedProfilesResult, followedTeamsResult, followedProjectsResult] = await Promise.all([
    profileIds.length
      ? supabase.from("follows").select("target_profile_id").eq("follower_id", userId).in("target_profile_id", profileIds)
      : empty,
    teamIds.length
      ? supabase.from("follows").select("target_team_id").eq("follower_id", userId).in("target_team_id", teamIds)
      : empty,
    suggestionProjectIds.length
      ? supabase.from("follows").select("target_project_id").eq("follower_id", userId).in("target_project_id", suggestionProjectIds)
      : empty,
  ]);

  const followedProfiles = new Set((followedProfilesResult.data ?? []).map((item: any) => item.target_profile_id));
  const followedTeams = new Set((followedTeamsResult.data ?? []).map((item: any) => item.target_team_id));
  const followedProjects = new Set((followedProjectsResult.data ?? []).map((item: any) => item.target_project_id));

  const suggestions: SocialSuggestion[] = [];
  for (const profile of profileCandidates) {
    if (followedProfiles.has((profile as any).id)) continue;
    const profileRole = (profile as any).role === "investor" ? "investor" : "participant";
    suggestions.push({
      targetType: "profile",
      targetId: (profile as any).id,
      label: (profile as any).display_name || (profile as any).username || "Pessoa",
      subtitle: `@${(profile as any).username || "usuario"} · ${profileRole === "investor" ? "Investidor" : "Participante"}`,
      href: entityRoute({ type: profileRole, id: (profile as any).username, source: "social", context }),
    });
    if (suggestions.length >= 5) break;
  }

  for (const team of teamCandidates) {
    if (followedTeams.has((team as any).id)) continue;
    suggestions.push({
      targetType: "team",
      targetId: (team as any).id,
      label: (team as any).name,
      subtitle: `Equipe${(team as any).category ? ` · ${(team as any).category}` : ""}`,
      href: entityRoute({ type: "team", id: (team as any).slug, source: "social", context }),
    });
    if (suggestions.length >= 8) break;
  }

  for (const project of projectCandidates) {
    if (followedProjects.has((project as any).id)) continue;
    suggestions.push({
      targetType: "project",
      targetId: (project as any).id,
      label: (project as any).title,
      subtitle: `Projeto · ${(project as any).stage}`,
      href: entityRoute({ type: "project", id: (project as any).slug, source: "social", context }),
    });
    if (suggestions.length >= 12) break;
  }

  return (
    <LegacySocialShell user={appUser} role={expectedRole}>
      <LegacySocialFeed
        userId={userId}
        userName={appUser.name}
        path={path}
        returnTo={returnTo}
        teams={teamOptions}
        projects={projectOptions}
        items={items}
        suggestions={suggestions}
        followingCount={followingCountResult.count ?? 0}
        feedMode={feedMode}
        initialQuery={searchQuery}
        page={page}
        pageCount={pageCount}
        totalItems={feed.total}
        status={first(query.status)}
        error={feedResult.error ? "feed" : first(query.error)}
      />
    </LegacySocialShell>
  );
}
