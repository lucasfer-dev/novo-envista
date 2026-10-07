import LegacySocialShell from "@/components/social/LegacySocialShell";
import { ExploreView, type ExploreProject, type ExploreTeam, type ExploreProfile, type PageState } from "./ExploreView";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";

export type ExploreSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 12;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(first(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
}

function exploreBase(role: ProductRole) {
  return role === "investor" ? "/investor/explore" : "/explore";
}

function rpcPayload<T>(data: unknown): { items: T[]; total: number } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { items: [], total: 0 };
  const payload = data as { items?: unknown; total?: unknown };
  return {
    items: Array.isArray(payload.items) ? payload.items as T[] : [],
    total: typeof payload.total === "number" ? payload.total : Number(payload.total ?? 0) || 0,
  };
}

export default async function LegacyExploreServerPage({
  expectedRole,
  pathname,
  searchParams,
}: {
  expectedRole: ProductRole;
  pathname: string;
  searchParams: ExploreSearchParams;
}) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 120);
  const stage = first(params.stage).trim().slice(0, 40) || "Todos";
  const pages: PageState = {
    projects_page: pageNumber(params.projects_page),
    teams_page: pageNumber(params.teams_page),
    people_page: pageNumber(params.people_page),
  };
  const base = exploreBase(expectedRole);

  let appUser: User;
  let projects: ExploreProject[] = [];
  let teams: ExploreTeam[] = [];
  let profiles: ExploreProfile[] = [];
  let projectTotal = 0;
  let teamTotal = 0;
  let profileTotal = 0;
  let loadError = false;

  const auth = await requireProductUser(expectedRole);
  appUser = auth.appUser;

  const [projectsResult, teamsResult, profilesResult] = await Promise.all([
    auth.supabase.rpc("search_explore_projects", {
      search_query: q,
      stage_filter: stage === "Todos" ? null : stage,
      result_offset: (pages.projects_page - 1) * PAGE_SIZE,
      result_limit: PAGE_SIZE,
    }),
    auth.supabase.rpc("search_explore_teams", {
      search_query: q,
      result_offset: (pages.teams_page - 1) * PAGE_SIZE,
      result_limit: PAGE_SIZE,
    }),
    auth.supabase.rpc("search_explore_profiles", {
      search_query: q,
      result_offset: (pages.people_page - 1) * PAGE_SIZE,
      result_limit: PAGE_SIZE,
    }),
  ]);

  loadError = Boolean(projectsResult.error || teamsResult.error || profilesResult.error);
  const projectPayload = rpcPayload<any>(projectsResult.data);
  const teamPayload = rpcPayload<any>(teamsResult.data);
  const profilePayload = rpcPayload<any>(profilesResult.data);

  projectTotal = projectPayload.total;
  teamTotal = teamPayload.total;
  profileTotal = profilePayload.total;

  projects = projectPayload.items.map((project: any) => ({
    key: `real:${project.id}`,
    title: project.title,
    slug: project.slug,
    description: project.short_description || "Projeto publicado no Envista.",
    stage: project.stage || "Ideia",
    category: project.category || "Projeto",
    location: project.location || "",
    tags: project.tags ?? [],
    owner: project.owner || "Envista",
    real: true,
  }));

  teams = teamPayload.items.map((team: any) => ({
    key: `real:${team.id}`,
    name: team.name,
    slug: team.slug,
    description: team.description || "Equipe publicada no Envista.",
    category: team.category || "Equipe",
    city: team.city || "",
    institution: team.institution || "",
    tags: team.tags ?? [],
    real: true,
  }));

  profiles = profilePayload.items.map((profile: any) => ({
    id: profile.id,
    username: profile.username,
    name: profile.display_name || profile.username,
    role: profile.role === "investor" ? "investor" : "participant",
    bio: profile.bio || (profile.role === "investor" ? "Investidor no Envista." : "Participante no Envista."),
    subtitle: profile.subtitle || `@${profile.username}`,
  }));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <ExploreView expectedRole={expectedRole} base={base} q={q} stage={stage} pages={pages} projects={projects} teams={teams} profiles={profiles} projectTotal={projectTotal} teamTotal={teamTotal} profileTotal={profileTotal} loadError={loadError} />
    </LegacySocialShell>
  );
}
