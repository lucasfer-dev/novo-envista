import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BookOpen, BrainCircuit, BriefcaseBusiness,
  Code2, Compass, FolderKanban, GraduationCap, HeartHandshake, HeartPulse,
  Leaf, Search, SearchX, Sparkles, Star, UserRound, Users,
} from "lucide-react";
import ProjectArtwork from "@/components/product/ProjectArtwork";
import { entityRoute } from "@/lib/profiles";
import type { ProductRole } from "@/lib/auth/require-product-user";
import ExploreFiltersClient from "./ExploreFiltersClient";
import ExploreCompetitionSpotlight from "./ExploreCompetitionSpotlight";
import styles from "./Explore.module.css";

const PAGE_SIZE = 12;

export type ExploreProject = {
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
export type ExploreTeam = {
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
export type ExploreProfile = {
  id: string;
  username: string;
  name: string;
  role: "participant" | "investor";
  bio: string;
  subtitle: string;
};

type PageKey = "projects_page" | "teams_page" | "people_page";
export type ExploreKind = "all" | "projects" | "teams" | "people";
export type PageState = {
  projects_page: number;
  teams_page: number;
  people_page: number;
};

const topics = [
  { label: "Games", term: "games", Icon: Sparkles, color: "purple" },
  { label: "Apps", term: "aplicativo", Icon: Code2, color: "violet" },
  { label: "IA", term: "Inteligência Artificial", Icon: BrainCircuit, color: "cyan" },
  { label: "Educação", term: "Educação", Icon: GraduationCap, color: "blue" },
  { label: "Sustentabilidade", term: "Sustentabilidade", Icon: Leaf, color: "green" },
  { label: "Negócios", term: "Negócios", Icon: BriefcaseBusiness, color: "steel" },
] as const;

const quickFilters = [
  { label: "Tudo", term: "", Icon: null },
  { label: "Tecnologia", term: "Tecnologia", Icon: Code2 },
  { label: "Impacto Social", term: "Impacto Social", Icon: Leaf },
  { label: "Educação", term: "Educação", Icon: GraduationCap },
  { label: "IA", term: "Inteligência Artificial", Icon: BrainCircuit },
  { label: "Saúde", term: "Saúde", Icon: HeartPulse },
  { label: "Igreja", term: "Igreja", Icon: HeartHandshake },
] as const;

function exploreUrl(base: string, query: string, stage: string, type: ExploreKind) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (stage !== "Todos" && type !== "teams" && type !== "people") params.set("stage", stage);
  if (type !== "all") params.set("type", type);
  const suffix = params.toString();
  return suffix ? base + "?" + suffix : base;
}

function pageUrl(base: string, query: string, stage: string, type: ExploreKind, pages: PageState, key: PageKey, next: number) {
  const [pathname, queryString] = exploreUrl(base, query, stage, type).split("?");
  const params = new URLSearchParams(queryString || "");
  const newer = { ...pages, [key]: next };
  for (const [pageKey, value] of Object.entries(newer)) {
    if (value > 1) params.set(pageKey, String(value));
  }
  const suffix = params.toString();
  return suffix ? pathname + "?" + suffix : pathname;
}

function Pagination({ base, q, stage, type, pages, pageKey, total }: {
  base: string; q: string; stage: string; type: ExploreKind; pages: PageState; pageKey: PageKey; total: number;
}) {
  const current = pages[pageKey];
  const pagesTotal = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pagesTotal <= 1) return null;
  return <nav aria-label="Paginação dos resultados" className={styles.pagination}>
    {current > 1
      ? <Link href={pageUrl(base, q, stage, type, pages, pageKey, current - 1)}>← Anterior</Link>
      : <span />}
    <span>Página {Math.min(current, pagesTotal)} de {pagesTotal}</span>
    {current < pagesTotal
      ? <Link href={pageUrl(base, q, stage, type, pages, pageKey, current + 1)}>Próxima <ArrowRight size={14} aria-hidden="true" /></Link>
      : <span />}
  </nav>;
}

function ProjectImage({ project }: { project: ExploreProject }) {
  const title = project.title.trim().toLocaleLowerCase("pt-BR");
  const image = title === "elas+" ? "/brand/envista-cover-elas.webp"
    : title === "elovia" ? "/brand/envista-cover-elovia.webp"
    : title === "nova" ? "/brand/envista-cover-nova.webp" : null;
  return image
    ? <img className={styles.projectImage} src={image} alt="" loading="lazy" />
    : <ProjectArtwork title={project.title} category={project.category} />;
}

function ProjectCard({ project, expectedRole }: {
  project: ExploreProject; expectedRole: ProductRole;
}) {
  const href = project.real
    ? (expectedRole === "investor" ? "/investor" : "") + "/projects/" + encodeURIComponent(project.slug) + "?from=explore"
    : entityRoute({ type: "project", id: project.slug, source: "explore", context: expectedRole === "investor" ? "investor" : "participant" });

  return <article className={styles.projectCard}>
    <Link href={href} className={styles.cardHit} aria-label={"Abrir projeto " + project.title} />
    <div className={styles.cardCover}>
      <ProjectImage project={project} />
      <span className={styles.cardCategory}>{project.category || "Projeto"}</span>
    </div>
    <div className={styles.cardContent}>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className={styles.cardBottom}>
        <span>{project.stage || "Em desenvolvimento"}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
    </div>
  </article>;
}

function EmptyExploreState({ kind, filtered, base, role }: {
  kind: "projects" | "teams" | "people"; filtered: boolean; base: string; role: ProductRole;
}) {
  const titles = { projects: "Nenhum projeto por aqui ainda", teams: "Nenhuma equipe por aqui ainda", people: "Nenhum perfil encontrado" };
  const Icon = kind === "projects" ? FolderKanban : kind === "teams" ? Users : UserRound;
  const href = filtered ? base : kind === "projects"
    ? (role === "investor" ? "/investor/projects/new" : "/projects/new")
    : kind === "teams" ? (role === "investor" ? "/investor/teams/new" : "/teams/new") : null;
  return <div className={styles.empty}>
    <span className={styles.emptyIcon}>{filtered ? <SearchX size={22} /> : <Icon size={22} />}</span>
    <div><h3>{filtered ? "Nenhum resultado com esses filtros" : titles[kind]}</h3>
      <p>{filtered ? "Experimente outro termo ou remova os filtros." : kind === "projects" ? "Compartilhe seu projeto e inspire outras pessoas." : kind === "teams" ? "Uma boa ideia pode começar com uma equipe." : "Perfis públicos aparecerão aqui."}</p>
    </div>
    {href && <Link className={styles.secondaryAction} href={href}>{filtered ? "Limpar filtros" : kind === "projects" ? "Criar projeto" : "Criar equipe"} <ArrowRight size={14} /></Link>}
  </div>;
}

export function ExploreView({ expectedRole, base, q, stage, type = "all", pages, projects, teams, profiles, projectTotal, teamTotal, profileTotal, loadError }: {
  expectedRole: ProductRole;
  base: string; q: string; stage: string; type?: ExploreKind; pages: PageState;
  projects: ExploreProject[]; teams: ExploreTeam[]; profiles: ExploreProfile[];
  projectTotal: number; teamTotal: number; profileTotal: number; loadError: boolean;
}) {
  const filtered = Boolean(q) || stage !== "Todos";
  const context = expectedRole === "investor" ? "investor" : "participant";
  const showProjects = type === "all" || type === "projects";
  const showTeams = type === "all" || type === "teams";
  const showPeople = type === "all" || type === "people";
  const filteredTotal = (showProjects ? projectTotal : 0) + (showTeams ? teamTotal : 0) + (showPeople ? profileTotal : 0);
  const visibleProjects = type === "all" ? projects.slice(0, 5) : projects;
  const visibleTeams = type === "all" ? teams.slice(0, 4) : teams;
  const visibleProfiles = type === "all" ? profiles.slice(0, 4) : profiles;
  const sections = [
    { kind: "all", label: "Descobrir", count: null },
    { kind: "projects", label: "Projetos", count: projectTotal },
    { kind: "teams", label: "Equipes", count: teamTotal },
    { kind: "people", label: "Pessoas", count: profileTotal },
  ] as const;

  return <div className={styles.page} data-envista-explore-redesign>
    <div className={styles.columns}>
      <div className={styles.content}>
        <header className={styles.exploreHeader}>
          <div className={styles.pageHeading}>
            <span className={styles.eyebrow}>O ECOSSISTEMA ESTÁ AQUI</span>
            <h1>Explorar<span aria-hidden="true">.</span></h1>
            <p>Descubra projetos, pessoas e equipes para construir algo novo.</p>
          </div>
          <form className={styles.searchForm} action={base} method="get" role="search">
            <Search size={20} aria-hidden="true" />
            <label className={styles.srOnly} htmlFor="envista-explore-search">Buscar na comunidade do Envista</label>
            <input
              id="envista-explore-search"
              key={q}
              type="search"
              name="q"
              defaultValue={q}
              maxLength={120}
              placeholder="Busque projetos, pessoas, equipes ou ideias..."
            />
            {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
            {stage !== "Todos" && (type === "all" || type === "projects") ? <input type="hidden" name="stage" value={stage} /> : null}
            <button type="submit" aria-label="Buscar no Envista">Buscar <ArrowRight size={16} aria-hidden="true" /></button>
          </form>
        </header>

        <nav className={styles.typeTabs} aria-label="Categorias de resultados">
          {sections.map(item =>
            <Link
              key={item.kind}
              href={exploreUrl(base, q, stage, item.kind)}
              className={styles.typeTab}
              aria-current={type === item.kind ? "page" : undefined}
            >
              {item.label}
              {item.count !== null ? <span>{item.count}</span> : null}
            </Link>
          )}
        </nav>

        <nav className={styles.quickFilters} aria-label="Explorar por área">
          <span className={styles.quickLabel}>Assuntos:</span>
          {quickFilters.map(({ label, term, Icon }) =>
            <Link key={label} href={exploreUrl(base, term, "Todos", "all")} className={styles.filterChip} aria-current={q.toLocaleLowerCase("pt-BR") === term.toLocaleLowerCase("pt-BR") && type === "all" && stage === "Todos" ? "true" : undefined}>
              {Icon && <Icon size={15} aria-hidden="true" />}{label}
            </Link>)}
          <a className={styles.filterChip} href="#explore-categories">Mais áreas <ArrowRight size={14} aria-hidden="true" /></a>
        </nav>

        {loadError && <div className={styles.loadError} role="alert">Parte dos resultados não pôde ser carregada. Tente novamente.</div>}
        {(q || stage !== "Todos" || type !== "all") && <div className={styles.resultSummary} role="status">
          <span>{filteredTotal} resultado{filteredTotal === 1 ? "" : "s"}{q ? " para “" + q + "”" : ""}</span>
          <Link href={base}>Limpar filtros</Link>
        </div>}

        {showProjects && <section className={styles.section} id="explore-projects" aria-labelledby="explore-projects-heading">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionEyebrow}>PROJETOS DA COMUNIDADE</span>
              <h2 id="explore-projects-heading">Ideias que estão ganhando forma</h2>
            </div>
            {type === "all"
              ? <Link href={exploreUrl(base, q, stage, "projects")}>Ver projetos <ArrowRight size={16} aria-hidden="true" /></Link>
              : <span>{projectTotal} {projectTotal === 1 ? "projeto" : "projetos"}</span>}
          </div>
          {visibleProjects.length ? (
            <div className={styles.projectsGrid}>
              {visibleProjects.map(project => <ProjectCard key={project.key} project={project} expectedRole={expectedRole} />)}
            </div>
          ) : <EmptyExploreState kind="projects" filtered={filtered} base={base} role={expectedRole} />}
          {type === "all" && projectTotal > visibleProjects.length
            ? <Link className={styles.seeMore} href={exploreUrl(base, q, stage, "projects")}>Ver todos os projetos <ArrowRight size={16} aria-hidden="true" /></Link>
            : null}
          {type === "projects"
            ? <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="projects_page" total={projectTotal} />
            : null}
        </section>}

        {showTeams && <section className={styles.section} id="explore-teams" aria-labelledby="explore-teams-heading">
          <div className={styles.sectionHeading}>
            <h2 id="explore-teams-heading"><Users size={20} aria-hidden="true" /> Equipes para conhecer</h2>
            <span>{teamTotal} {teamTotal === 1 ? "equipe" : "equipes"}</span>
          </div>
          {visibleTeams.length ? <div className={styles.communityGrid}>{visibleTeams.map(team => {
            const href = team.real
              ? (expectedRole === "investor" ? "/investor" : "") + "/teams/" + encodeURIComponent(team.slug) + "?from=explore"
              : entityRoute({ type: "team", id: team.slug, source: "explore", context });
            return <article className={styles.communityCard} key={team.key}>
              <Link href={href} className={styles.cardHit} aria-label={"Abrir equipe " + team.name} />
              <span className={styles.avatar}><Users size={24} aria-hidden="true" /></span>
              <h3>{team.name}</h3><p>{team.description}</p>
              <small>{team.city || team.institution || team.category}</small>
              <ArrowUpRight size={16} className={styles.communityArrow} aria-hidden="true" />
            </article>;
          })}</div> : <EmptyExploreState kind="teams" filtered={filtered} base={base} role={expectedRole} />}
          {type === "teams" ? <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="teams_page" total={teamTotal} /> : teamTotal > visibleTeams.length ? <Link className={styles.seeMore} href={exploreUrl(base, q, "Todos", "teams")}>Ver todas as equipes <ArrowRight size={15} /></Link> : null}
        </section>}

        {showPeople && <section className={styles.section} id="explore-people" aria-labelledby="explore-people-heading">
          <div className={styles.sectionHeading}>
            <h2 id="explore-people-heading"><UserRound size={20} aria-hidden="true" /> Pessoas da comunidade</h2>
            <span>{profileTotal} {profileTotal === 1 ? "pessoa" : "pessoas"}</span>
          </div>
          {visibleProfiles.length ? <div className={styles.communityGrid}>{visibleProfiles.map(profile => {
            const href = entityRoute({ type: profile.role, id: profile.username, source: "explore", context });
            return <article className={styles.communityCard} key={profile.id}>
              <Link href={href} className={styles.cardHit} aria-label={"Abrir perfil de " + profile.name} />
              <span className={styles.avatar}>{profile.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>
              <span className={styles.roleChip}>{profile.role === "investor" ? "Investidor" : "Participante"}</span>
              <h3>{profile.name}</h3><p>{profile.bio}</p><small>{profile.subtitle}</small>
              <ArrowUpRight size={16} className={styles.communityArrow} aria-hidden="true" />
            </article>;
          })}</div> : <EmptyExploreState kind="people" filtered={filtered} base={base} role={expectedRole} />}
          {type === "people" ? <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="people_page" total={profileTotal} /> : profileTotal > visibleProfiles.length ? <Link className={styles.seeMore} href={exploreUrl(base, q, "Todos", "people")}>Ver todas as pessoas <ArrowRight size={15} /></Link> : null}
        </section>}
      </div>

      <aside className={styles.rail} aria-label="Filtros, desafios e áreas de interesse">
        <ExploreFiltersClient key={q + "|" + stage + "|" + type} base={base} initialQuery={q} initialStage={stage} initialType={type} />
        <ExploreCompetitionSpotlight />
        <section className={styles.topics} id="explore-categories" aria-labelledby="explore-categories-heading">
          <div className={styles.panelHeading}>
            <h2 id="explore-categories-heading"><Sparkles size={19} aria-hidden="true" /> Explore por área</h2>
          </div>
          <div className={styles.topicList}>
            {topics.map(({ label, term, Icon }) =>
              <Link key={label} href={exploreUrl(base, term, "Todos", "all")} className={styles.topicCard}>
                <span className={styles.topicIcon}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
                <span><strong>{label}</strong><small>Ver projetos e conexões</small></span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
