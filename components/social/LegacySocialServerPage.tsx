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

  const [followsResult, membershipsResult, postsResult, projectsResult, profilesResult, teamsResult] = await Promise.all([
    supabase
      .from("follows")
      .select("target_profile_id,target_team_id,target_project_id,created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("team_id,access_level,teams(id,slug,name)")
      .eq("user_id", userId),
    supabase
      .from("posts")
      .select("id,body,visibility,created_at,created_by,author_user_id,author_team_id,project_id,author_user:profiles!posts_author_user_id_fkey(id,username,display_name,role),author_team:teams!posts_author_team_id_fkey(id,slug,name),project:projects!posts_project_id_fkey(id,slug,title)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("projects")
      .select("id,slug,title,short_description,stage,visibility,owner_user_id,owner_team_id,created_at,updated_at,owner_user:profiles!projects_owner_user_id_fkey(id,username,display_name,role),owner_team:teams!projects_owner_team_id_fkey(id,slug,name)")
      .order("updated_at", { ascending: false })
      .limit(100),
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
  ]);

  const follows = followsResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const allPosts = postsResult.data ?? [];
  const allProjects = projectsResult.data ?? [];

  const followedProfiles = new Set(follows.map((item: any) => item.target_profile_id).filter(Boolean));
  const followedTeams = new Set(follows.map((item: any) => item.target_team_id).filter(Boolean));
  const followedProjects = new Set(follows.map((item: any) => item.target_project_id).filter(Boolean));
  const memberTeams = new Set(memberships.map((item: any) => item.team_id));
  const managerTeams = new Set(
    memberships
      .filter((item: any) => item.access_level === "owner" || item.access_level === "admin")
      .map((item: any) => item.team_id),
  );

  const filteredPosts = allPosts.filter((post: any) => {
    const own = post.author_user_id === userId || post.created_by === userId || (post.author_team_id && memberTeams.has(post.author_team_id));
    const followed =
      (post.author_user_id && followedProfiles.has(post.author_user_id)) ||
      (post.author_team_id && followedTeams.has(post.author_team_id)) ||
      (post.project_id && followedProjects.has(post.project_id));
    return own || followed;
  });

  const postIds = filteredPosts.map((post: any) => post.id);
  let likes: any[] = [];
  let comments: any[] = [];
  if (postIds.length) {
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
      supabase
        .from("post_comments")
        .select("id,post_id,user_id,body,created_at,author:profiles!post_comments_user_id_fkey(username,display_name)")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
    ]);
    likes = likesResult.data ?? [];
    comments = commentsResult.data ?? [];
  }

  const postItems: SocialPostFeedItem[] = filteredPosts.map((post: any) => {
    const authorUser = one<any>(post.author_user);
    const authorTeam = one<any>(post.author_team);
    const project = one<any>(post.project);
    const postLikes = likes.filter((like: any) => like.post_id === post.id);
    const postComments = comments
      .filter((comment: any) => comment.post_id === post.id)
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

    return {
      kind: "post",
      id: post.id,
      body: post.body,
      visibility: post.visibility === "private" ? "private" : "platform",
      createdAt: post.created_at,
      authorLabel,
      authorHandle,
      authorHref: authorId
        ? entityRoute({ type: authorType, id: authorId, source: "social", context })
        : path,
      canDelete:
        post.author_user_id === userId ||
        post.created_by === userId ||
        Boolean(post.author_team_id && managerTeams.has(post.author_team_id)),
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
    };
  });

  const relatedProjects = allProjects.filter((project: any) => {
    if (project.visibility !== "platform" && project.owner_user_id !== userId && !memberTeams.has(project.owner_team_id)) return false;
    return (
      project.owner_user_id === userId ||
      (project.owner_team_id && memberTeams.has(project.owner_team_id)) ||
      (project.owner_user_id && followedProfiles.has(project.owner_user_id)) ||
      (project.owner_team_id && followedTeams.has(project.owner_team_id)) ||
      followedProjects.has(project.id)
    );
  });

  const projectUpdateItems: SocialProjectUpdateFeedItem[] = relatedProjects.map((project: any) => {
    const ownerUser = one<any>(project.owner_user);
    const ownerTeam = one<any>(project.owner_team);
    const createdAt = asTime(project.created_at);
    const updatedAt = asTime(project.updated_at);
    return {
      kind: "project-update",
      id: `project-update:${project.id}:${project.updated_at}`,
      createdAt: project.updated_at || project.created_at,
      title: project.title,
      description: project.short_description || "O projeto recebeu uma nova atualização.",
      stage: project.stage,
      href: entityRoute({ type: "project", id: project.slug, source: "social", context }),
      ownerLabel: ownerTeam?.name || ownerUser?.display_name || ownerUser?.username || "Projeto Envista",
      isNew: Math.abs(updatedAt - createdAt) < 90_000,
    };
  });

  const items: SocialFeedItem[] = [...postItems, ...projectUpdateItems]
    .sort((a, b) => asTime(b.createdAt) - asTime(a.createdAt))
    .slice(0, 60);

  const teamOptions = memberships
    .map((membership: any) => one<any>(membership.teams))
    .filter(Boolean)
    .map((team: any) => ({ id: team.id, name: team.name }));

  const projectOptions = allProjects
    .filter(
      (project: any) =>
        project.owner_user_id === userId || (project.owner_team_id && memberTeams.has(project.owner_team_id)),
    )
    .map((project: any) => ({ id: project.id, title: project.title, slug: project.slug }))
    .slice(0, 30);

  const suggestions: SocialSuggestion[] = [];
  for (const profile of profilesResult.data ?? []) {
    if (followedProfiles.has((profile as any).id)) continue;
    const profileRole = (profile as any).role === "investor" ? "investor" : "participant";
    suggestions.push({
      targetType: "profile",
      targetId: (profile as any).id,
      label: (profile as any).display_name || (profile as any).username || "Pessoa",
      subtitle: `@${(profile as any).username || "usuario"} · ${profileRole === "investor" ? "Investidor" : "Participante"}`,
      href: entityRoute({ type: profileRole, id: (profile as any).username, source: "social", context }),
    });
    if (suggestions.length >= 4) break;
  }

  for (const team of teamsResult.data ?? []) {
    if (followedTeams.has((team as any).id)) continue;
    suggestions.push({
      targetType: "team",
      targetId: (team as any).id,
      label: (team as any).name,
      subtitle: `Equipe${(team as any).category ? ` · ${(team as any).category}` : ""}`,
      href: entityRoute({ type: "team", id: (team as any).slug, source: "social", context }),
    });
    if (suggestions.length >= 7) break;
  }

  for (const project of allProjects) {
    if ((project as any).visibility !== "platform" || followedProjects.has((project as any).id)) continue;
    suggestions.push({
      targetType: "project",
      targetId: (project as any).id,
      label: (project as any).title,
      subtitle: `Projeto · ${(project as any).stage}`,
      href: entityRoute({ type: "project", id: (project as any).slug, source: "social", context }),
    });
    if (suggestions.length >= 10) break;
  }

  return (
    <LegacySocialShell user={appUser} role={expectedRole}>
      <LegacySocialFeed
        userId={userId}
        userName={appUser.name}
        path={path}
        teams={teamOptions}
        projects={projectOptions}
        items={items}
        suggestions={suggestions}
        followingCount={follows.length}
        status={first(query.status)}
        error={first(query.error)}
      />
    </LegacySocialShell>
  );
}
