import Link from "next/link";
import { ArrowUpRight, Compass, MapPin, SearchX, Users } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ExploreFiltersClient from "@/components/explore/ExploreFiltersClient";
import { entityRoute } from "@/lib/profiles";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";

export type ExploreSearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 12;

type ExploreProject = {
  key: string;
  title: string;
  slug: string;
  description: string;
  stage: string;
  category: string;
  location: string;
  tags: string[];
  owner: string;
  real: boolean;
};

type ExploreTeam = {
  key: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  institution: string;
  tags: string[];
  real: boolean;
};

type ExploreProfile = {
  id: string;
  username: string;
  name: string;
  role: "participant" | "investor";
  bio: string;
  subtitle: string;
};

type PageKey = "projects_page" | "teams_page" | "people_page";

type PageState = {
  projects_page: number;
  teams_page: number;
  people_page: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(first(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function exploreBase(role: ProductRole) {
  return role === "investor" ? "/investor/explore" : "/explore";
}

function taxonomyHref(base: string, value: string, kind: "q" | "stage" = "q") {
  const params = new URLSearchParams();
  params.set(kind, value);
  return `${base}?${params.toString()}`;
}

function pageHref(base: string, q: string, stage: string, pages: PageState, key: PageKey, nextPage: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (stage !== "Todos") params.set("stage", stage);

  const next = { ...pages, [key]: nextPage };
  for (const [pageKey, value] of Object.entries(next)) {
    if (value > 1) params.set(pageKey, String(value));
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function Pagination({
  base,
  q,
  stage,
  pages,
  pageKey,
  total,
}: {
  base: string;
  q: string;
  stage: string;
  pages: PageState;
  pageKey: PageKey;
  total: number;
}) {
  const current = pages[pageKey];
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pageCount <= 1) return null;

  return (
    <nav className="actions" aria-label="Paginação" style={{ marginTop: 16, alignItems: "center", justifyContent: "flex-end" }}>
      {current > 1 ? <Link className="secondary" href={pageHref(base, q, stage, pages, pageKey, current - 1)}>← Anterior</Link> : null}
      <span style={{ color: "#98a6b8", fontSize: 12 }}>Página {Math.min(current, pageCount)} de {pageCount}</span>
      {current < pageCount ? <Link className="secondary" href={pageHref(base, q, stage, pages, pageKey, current + 1)}>Próxima →</Link> : null}
    </nav>
  );
}

function rpcPayload<T>(data: unknown): { items: T[]; total: number } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { items: [], total: 0 };
  const payload = data as { items?: unknown; total?: unknown };
  return {
    items: Array.isArray(payload.items) ? payload.items as T[] : [],
    total: typeof payload.total === "number" ? payload.total : Number(payload.total ?? 0) || 0,
  };
}

function EmptyExploreState({ label }: { label: string }) {
  return (
    <div className="panel explore-empty">
      <SearchX size={22} aria-hidden="true" />
      <p>Nenhum {label} público encontrado nesta página. Ajuste os filtros ou faça uma nova busca.</p>
    </div>
  );
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
  const context = expectedRole === "investor" ? "investor" : "participant";

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

  const total = projectTotal + teamTotal + profileTotal;

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div>
          <h1>Descubra o que está sendo construído.</h1>
          <p>Projetos, equipes e pessoas do ecossistema Envista.</p>
        </div>
      </div>

      <ExploreFiltersClient key={`${q}::${stage}`} base={base} initialQuery={q} initialStage={stage} />

      {loadError ? <div className="form-error" role="alert" style={{ marginBottom: 18 }}>Parte dos resultados não pôde ser carregada. Tente novamente.</div> : null}

      <div className="meta-row" style={{ marginBottom: 18 }}>
        <span><Compass size={14} /> {total} resultado{total === 1 ? "" : "s"}</span>
        {q && <span>Busca: “{q}”</span>}
        {stage !== "Todos" && <span>Estágio: {stage}</span>}
      </div>

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2>Projetos</h2>
            <p>{projectTotal} projeto{projectTotal === 1 ? "" : "s"} público{projectTotal === 1 ? "" : "s"} relacionado{projectTotal === 1 ? "" : "s"} aos filtros.</p>
          </div>
        </div>

        {projects.length ? (
          <div className="project-grid">
            {projects.map((project) => {
              const href = project.real
                ? `${expectedRole === "investor" ? "/investor" : ""}/projects/${encodeURIComponent(project.slug)}?from=explore`
                : entityRoute({ type: "project", id: project.slug, source: "explore", context });

              return (
                <article className="project-card" key={project.key}>
                  <Link className="card-hit-target" href={href} aria-label={`Abrir projeto ${project.title}`} />
                  <span className="interactive-card-arrow" aria-hidden="true"><ArrowUpRight size={15} /></span>
                  <div className="project-cover">
                    <span className="project-initial">{project.title.slice(0, 1).toUpperCase()}</span>
                    <Link className="stage" href={taxonomyHref(base, project.stage, "stage")}>{project.stage}</Link>
                  </div>
                  <div className="card-body">
                    <div className="card-meta"><span>{project.category || "Projeto"}</span><span>{project.location || project.owner}</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="chips compact">
                      {project.tags.slice(0, 4).map((tag) => <span key={tag}><Link href={taxonomyHref(base, tag)}>{tag}</Link></span>)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <EmptyExploreState label="projeto" />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="projects_page" total={projectTotal} />
      </section>

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2>Equipes</h2>
            <p>{teamTotal} equipe{teamTotal === 1 ? "" : "s"} pública{teamTotal === 1 ? "" : "s"} relacionada{teamTotal === 1 ? "" : "s"} à busca.</p>
          </div>
        </div>

        {teams.length ? (
          <div className="team-row">
            {teams.map((team) => {
              const href = team.real
                ? `${expectedRole === "investor" ? "/investor" : ""}/teams/${encodeURIComponent(team.slug)}?from=explore`
                : entityRoute({ type: "team", id: team.slug, source: "explore", context });

              return (
                <article className="team-card" key={team.key}>
                  <Link className="card-hit-target" href={href} aria-label={`Abrir equipe ${team.name}`} />
                  <span className="interactive-card-arrow" aria-hidden="true"><ArrowUpRight size={15} /></span>
                  <span className="avatar">{team.name.slice(0, 2).toUpperCase()}</span>
                  <h3>{team.name}</h3>
                  <p>{team.description}</p>
                  <div className="chips compact">
                    {team.tags.slice(0, 3).map((tag) => <span key={tag}><Link href={taxonomyHref(base, tag)}>{tag}</Link></span>)}
                  </div>
                  <small>{team.city || team.institution || team.category}</small>
                </article>
              );
            })}
          </div>
        ) : <EmptyExploreState label="equipe" />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="teams_page" total={teamTotal} />
      </section>

      <section className="section-block">
        <div className="section-row">
          <div>
            <h2>Pessoas</h2>
            <p>{profileTotal} perfil{profileTotal === 1 ? "" : "s"} público{profileTotal === 1 ? "" : "s"} relacionado{profileTotal === 1 ? "" : "s"} à busca.</p>
          </div>
        </div>

        {profiles.length ? (
          <div className="team-row">
            {profiles.map((profile) => {
              const href = entityRoute({ type: profile.role, id: profile.username, source: "explore", context });
              return (
                <article className="team-card" key={profile.id}>
                  <Link className="card-hit-target" href={href} aria-label={`Abrir perfil de ${profile.name}`} />
                  <span className="interactive-card-arrow" aria-hidden="true"><ArrowUpRight size={15} /></span>
                  <span className="avatar">{profile.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <div className="meta-row" style={{ marginTop: 12 }}>
                    <span className="stage">{profile.role === "investor" ? "Investidor" : "Participante"}</span>
                  </div>
                  <h3>{profile.name}</h3>
                  <p>{profile.bio}</p>
                  <small><Users size={12} /> {profile.subtitle}</small>
                </article>
              );
            })}
          </div>
        ) : <EmptyExploreState label="perfil" />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="people_page" total={profileTotal} />
      </section>

      <div className="meta-row" style={{ marginTop: 28 }}>
        <span><MapPin size={14} /> Busca e paginação executadas no banco sobre dados reais disponíveis para a sua conta.</span>
      </div>
    </LegacySocialShell>
  );
}
