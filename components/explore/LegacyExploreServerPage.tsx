import Link from "next/link";
import { Compass, MapPin, Users } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ExploreFiltersClient from "@/components/explore/ExploreFiltersClient";
import { people, projects as seedProjects, teams as seedTeams } from "@/data/mock";
import { entityRoute } from "@/lib/profiles";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";

export type ExploreSearchParams = Promise<Record<string, string | string[] | undefined>>;

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

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function matches(value: string, query: string) {
  return !query || normalize(value).includes(normalize(query));
}

function exploreBase(role: ProductRole) {
  return role === "investor" ? "/investor/explore" : "/app/explore";
}

function taxonomyHref(base: string, value: string, kind: "q" | "stage" = "q") {
  const params = new URLSearchParams();
  params.set(kind, value);
  return `${base}?${params.toString()}`;
}

export default async function LegacyExploreServerPage({
  expectedRole,
  pathname,
  searchParams,
  demoUser,
}: {
  expectedRole: ProductRole;
  pathname: string;
  searchParams: ExploreSearchParams;
  demoUser?: User;
}) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const stage = first(params.stage).trim() || "Todos";
  const base = exploreBase(expectedRole);
  const context = expectedRole === "investor" ? "investor" : "participant";

  let appUser: User;
  let projects: ExploreProject[] = [];
  let teams: ExploreTeam[] = [];
  let profiles: ExploreProfile[] = [];

  if (demoUser) {
    appUser = demoUser;
    projects = seedProjects.map((project) => {
      const team = project.author.type === "team" ? seedTeams.find((item) => item.id === project.author.id) : null;
      const person = project.author.type === "user" ? people.find((item) => item.id === project.author.id) : null;
      return {
        key: `demo:${project.id}`,
        title: project.title,
        slug: project.slug,
        description: project.shortDescription,
        stage: project.stage,
        category: project.category,
        location: project.location,
        tags: project.tags,
        owner: team?.name || person?.name || "Envista",
        real: false,
      };
    });
    teams = seedTeams.map((team) => ({
      key: `demo:${team.id}`,
      name: team.name,
      slug: team.slug,
      description: team.description,
      category: team.category,
      city: team.city,
      institution: team.institution,
      tags: team.tags,
      real: false,
    }));
    profiles = people.map((person) => ({
      id: person.id,
      username: person.username,
      name: person.name,
      role: "participant" as const,
      bio: person.bio || "Participante no Envista.",
      subtitle: (person.skills || []).slice(0, 3).join(" · ") || `@${person.username}`,
    }));
  } else {
    const auth = await requireProductUser(expectedRole);
    appUser = auth.appUser;
    const [projectsResult, teamsResult, profilesResult] = await Promise.all([
      auth.supabase
        .from("projects")
        .select("id,slug,title,short_description,stage,category,location,tags,owner_user:profiles!projects_owner_user_id_fkey(display_name,username),owner_team:teams!projects_owner_team_id_fkey(name,slug)")
        .eq("visibility", "platform")
        .order("updated_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("teams")
        .select("id,slug,name,description,category,city,institution,tags")
        .eq("visibility", "platform")
        .order("updated_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("profiles")
        .select("id,username,display_name,role,bio,public_city,public_state,public_school,organization,organization_type")
        .eq("profile_visibility", "platform")
        .neq("id", auth.userId)
        .order("display_name")
        .limit(100),
    ]);

    projects = (projectsResult.data ?? []).map((project: any) => {
      const ownerUser = one<any>(project.owner_user);
      const ownerTeam = one<any>(project.owner_team);
      return {
        key: `real:${project.id}`,
        title: project.title,
        slug: project.slug,
        description: project.short_description || "Projeto publicado no Envista.",
        stage: project.stage || "Ideia",
        category: project.category || "Projeto",
        location: project.location || "",
        tags: project.tags ?? [],
        owner: ownerTeam?.name || ownerUser?.display_name || ownerUser?.username || "Envista",
        real: true,
      };
    });
    teams = (teamsResult.data ?? []).map((team: any) => ({
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
    profiles = (profilesResult.data ?? []).map((profile: any) => ({
      id: profile.id,
      username: profile.username,
      name: profile.display_name || profile.username,
      role: profile.role === "investor" ? "investor" : "participant",
      bio: profile.bio || (profile.role === "investor" ? "Investidor no Envista." : "Participante no Envista."),
      subtitle: profile.role === "investor"
        ? [profile.organization, profile.organization_type].filter(Boolean).join(" · ") || `@${profile.username}`
        : [profile.public_school, profile.public_city, profile.public_state].filter(Boolean).join(" · ") || `@${profile.username}`,
    }));
  }

  projects = projects.filter((project) => {
    const haystack = `${project.title} ${project.description} ${project.category} ${project.location} ${project.tags.join(" ")} ${project.owner}`;
    return matches(haystack, q) && (stage === "Todos" || project.stage === stage);
  });
  teams = teams.filter((team) => matches(`${team.name} ${team.description} ${team.category} ${team.city} ${team.institution} ${team.tags.join(" ")}`, q));
  profiles = profiles.filter((profile) => matches(`${profile.name} ${profile.username} ${profile.bio} ${profile.subtitle}`, q));

  const total = projects.length + teams.length + profiles.length;

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head"><div><h1>Descubra o que está sendo construído.</h1><p>Projetos, equipes e pessoas do ecossistema Envista.</p></div></div>
      <ExploreFiltersClient key={`${q}::${stage}`} base={base} initialQuery={q} initialStage={stage} />
      <div className="meta-row" style={{ marginBottom: 18 }}><span><Compass size={14} /> {total} resultado{total === 1 ? "" : "s"}</span>{q && <span>Busca: “{q}”</span>}{stage !== "Todos" && <span>Estágio: {stage}</span>}</div>

      <section className="section-block">
        <div className="section-row"><div><h2>Projetos</h2><p>Projetos públicos relacionados aos filtros.</p></div></div>
        {projects.length ? <div className="project-grid">{projects.map((project) => {
          const href = project.real
            ? `${expectedRole === "investor" ? "/investor" : "/app"}/projects/${encodeURIComponent(project.slug)}?from=explore`
            : entityRoute({ type: "project", id: project.slug, source: "explore", context });
          return <article className="project-card" key={project.key}><div className="project-cover"><span className="project-initial">{project.title.slice(0, 1).toUpperCase()}</span><Link className="stage" href={taxonomyHref(base, project.stage, "stage")}>{project.stage}</Link></div><div className="card-body"><div className="card-meta"><span>{project.category || "Projeto"}</span><span>{project.location || project.owner}</span></div><h3><Link href={href}>{project.title}</Link></h3><p>{project.description}</p><div className="chips compact">{project.tags.slice(0, 4).map((tag) => <span key={tag}><Link href={taxonomyHref(base, tag)}>{tag}</Link></span>)}</div></div></article>;
        })}</div> : <div className="panel" style={{ padding: 18 }}><p style={{ margin: 0 }}>Nenhum projeto público encontrado.</p></div>}
      </section>

      <section className="section-block">
        <div className="section-row"><div><h2>Equipes</h2><p>Equipes públicas relacionadas à busca.</p></div></div>
        {teams.length ? <div className="team-row">{teams.slice(0, 18).map((team) => {
          const href = team.real
            ? `${expectedRole === "investor" ? "/investor" : "/app"}/teams/${encodeURIComponent(team.slug)}?from=explore`
            : entityRoute({ type: "team", id: team.slug, source: "explore", context });
          return <article className="team-card" key={team.key}><span className="avatar">{team.name.slice(0, 2).toUpperCase()}</span><h3><Link href={href}>{team.name}</Link></h3><p>{team.description}</p><div className="chips compact">{team.tags.slice(0, 3).map((tag) => <span key={tag}><Link href={taxonomyHref(base, tag)}>{tag}</Link></span>)}</div><small>{team.city || team.institution || team.category}</small></article>;
        })}</div> : <div className="panel" style={{ padding: 18 }}><p style={{ margin: 0 }}>Nenhuma equipe pública encontrada.</p></div>}
      </section>

      <section className="section-block">
        <div className="section-row"><div><h2>Pessoas</h2><p>Perfis públicos relacionados à busca.</p></div></div>
        {profiles.length ? <div className="team-row">{profiles.slice(0, 18).map((profile) => <article className="team-card" key={profile.id}><span className="avatar">{profile.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><h3><Link href={entityRoute({ type: profile.role, id: profile.username, source: "explore", context })}>{profile.name}</Link></h3><p>{profile.bio}</p><small><Users size={12} /> {profile.subtitle}</small></article>)}</div> : <div className="panel" style={{ padding: 18 }}><p style={{ margin: 0 }}>Nenhum perfil público encontrado.</p></div>}
      </section>

      {!demoUser ? <div className="meta-row" style={{ marginTop: 28 }}><span><MapPin size={14} /> Esta tela exibe somente dados reais disponíveis para a sua conta.</span></div> : null}
    </LegacySocialShell>
  );
}
