import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BookOpen, BrainCircuit, BriefcaseBusiness,
  Code2, Compass, FolderKanban, GraduationCap, HeartHandshake, HeartPulse,
  Leaf, Search, SearchX, Sparkles, Star, Trophy, UserRound, Users,
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
  { label: "IA", term: "IA", Icon: BrainCircuit, color: "cyan" },
  { label: "Educação", term: "Educação", Icon: GraduationCap, color: "blue" },
  { label: "Sustentabilidade", term: "Sustentabilidade", Icon: Leaf, color: "green" },
  { label: "Negócios", term: "Negócios", Icon: BriefcaseBusiness, color: "steel" },
] as const;

const quickFilters = [
  { label: "Tudo", term: "", Icon: null },
  { label: "Tecnologia", term: "Tecnologia", Icon: Code2 },
  { label: "Impacto Social", term: "Impacto Social", Icon: Leaf },
  { label: "Educação", term: "Educação", Icon: GraduationCap },
  { label: "IA", term: "IA", Icon: BrainCircuit },
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

function ProjectCard({ project, expectedRole, base, stage, type }: {
  project: ExploreProject; expectedRole: ProductRole; base: string; stage: string; type: ExploreKind;
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
  const featured = projects.slice(0, 3);
  const suggestions = projects.slice(3, 6);

  return <div className={styles.page} data-envista-explore-redesign>
    <div className={styles.columns}>
      <main className={styles.content}>
        <header className={styles.pageHeading}>
          <h1>Explorar</h1>
          <p>Descubra projetos, pessoas, equipes e oportunidades.</p>
        </header>

        <section className={styles.hero} aria-labelledby="explore-hero-title">
          <span className={styles.heroPattern} aria-hidden="true" />
          <span className={styles.heroAngle} aria-hidden="true" />
          <img className={styles.heroImage} src="/brand/envista-explore-hero.webp" width="385" height="243" alt="" aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>PROJETOS · EQUIPES · COMPETIÇÕES</span>
            <h2 id="explore-hero-title">Encontre ideias que geram<br /><span>impacto real.</span></h2>
            <p>Navegue por projetos, conecte-se com pessoas e participe de competições que impulsionam a inovação.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="#explore-projects"><Search size={18} aria-hidden="true" /> Explorar projetos</Link>
              <Link className={styles.outlineAction} href="#explore-people"><Users size={17} aria-hidden="true" /> Encontrar pessoas</Link>
            </div>
          </div>
        </section>

        <nav className={styles.quickFilters} aria-label="Explorar por área">
          {quickFilters.map(({ label, term, Icon }) =>
            <Link key={label} href={exploreUrl(base, term, "Todos", "all")} className={styles.filterChip} aria-current={q.toLocaleLowerCase("pt-BR") === term.toLocaleLowerCase("pt-BR") ? "true" : undefined}>
              {Icon && <Icon size={16} aria-hidden="true" />}{label}
            </Link>)}
          <a className={styles.filterChip} href="#explore-categories">Mais <ArrowRight size={14} aria-hidden="true" /></a>
        </nav>

        {loadError && <div className={styles.loadError} role="alert">Parte dos resultados não pôde ser carregada. Tente novamente.</div>}
        {(q || stage !== "Todos" || type !== "all") && <div className={styles.resultSummary} role="status">
          <span>{filteredTotal} resultado{filteredTotal === 1 ? "" : "s"}{q ? " para “" + q + "”" : ""}</span>
          <Link href={base}>Limpar filtros</Link>
        </div>}

        {showProjects && <section className={styles.section} id="explore-projects" aria-labelledby="explore-projects-heading">
          <div className={styles.sectionHeading}>
            <h2 id="explore-projects-heading"><Star size={20} aria-hidden="true" /> Projetos em destaque</h2>
            <Link href="#explore-more-projects">Ver todos <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {featured.length ? <div className={styles.projectsGrid}>
            {featured.map(project => <ProjectCard key={project.key} project={project} expectedRole={expectedRole} base={base} stage={stage} type={type} />)}
          </div> : <EmptyExploreState kind="projects" filtered={filtered} base={base} role={expectedRole} />}
        </section>}

        <section className={styles.topics} id="explore-categories" aria-labelledby="explore-categories-heading">
          <div className={styles.sectionHeading}><h2 id="explore-categories-heading"><BookOpen size={20} aria-hidden="true" /> Mais para explorar</h2></div>
          <div className={styles.topicGrid}>
            {topics.map(({ label, term, Icon, color }) => <Link key={label} href={exploreUrl(base, term, "Todos", "all")} className={styles.topicCard} data-tone={color}>
              <Icon size={42} strokeWidth={1.3} aria-hidden="true" />
              <strong>{label}</strong>
            </Link>)}
          </div>
        </section>

        {showProjects && <section className={styles.section} id="explore-more-projects" aria-labelledby="more-projects-heading">
          <div className={styles.sectionHeading}>
            <h2 id="more-projects-heading"><FolderKanban size={20} aria-hidden="true" /> Outros projetos da comunidade</h2>
            <span>{projectTotal} no total</span>
          </div>
          {projects.length > 3 ? <div className={styles.projectsGrid}>
            {projects.slice(3).map(project => <ProjectCard key={project.key} project={project} expectedRole={expectedRole} base={base} stage={stage} type={type} />)}
          </div> : <div className={styles.sectionNote}>Explore novas áreas ou compartilhe uma ideia para ampliar a comunidade.</div>}
          <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="projects_page" total={projectTotal} />
        </section>}

        {showTeams && <section className={styles.section} id="explore-teams" aria-labelledby="explore-teams-heading">
          <div className={styles.sectionHeading}>
            <h2 id="explore-teams-heading"><Users size={20} aria-hidden="true" /> Equipes para conhecer</h2>
            <span>{teamTotal} {teamTotal === 1 ? "equipe" : "equipes"}</span>
          </div>
          {teams.length ? <div className={styles.communityGrid}>{teams.map(team => {
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
          <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="teams_page" total={teamTotal} />
        </section>}

        {showPeople && <section className={styles.section} id="explore-people" aria-labelledby="explore-people-heading">
          <div className={styles.sectionHeading}>
            <h2 id="explore-people-heading"><UserRound size={20} aria-hidden="true" /> Pessoas da comunidade</h2>
            <span>{profileTotal} {profileTotal === 1 ? "pessoa" : "pessoas"}</span>
          </div>
          {profiles.length ? <div className={styles.communityGrid}>{profiles.map(profile => {
            const href = entityRoute({ type: profile.role, id: profile.username, source: "explore", context });
            return <article className={styles.communityCard} key={profile.id}>
              <Link href={href} className={styles.cardHit} aria-label={"Abrir perfil de " + profile.name} />
              <span className={styles.avatar}>{profile.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>
              <span className={styles.roleChip}>{profile.role === "investor" ? "Investidor" : "Participante"}</span>
              <h3>{profile.name}</h3><p>{profile.bio}</p><small>{profile.subtitle}</small>
              <ArrowUpRight size={16} className={styles.communityArrow} aria-hidden="true" />
            </article>;
          })}</div> : <EmptyExploreState kind="people" filtered={filtered} base={base} role={expectedRole} />}
          <Pagination base={base} q={q} stage={stage} type={type} pages={pages} pageKey="people_page" total={profileTotal} />
        </section>}
      </main>

      <aside className={styles.rail} aria-label="Competições, filtros e recomendações">
        <ExploreCompetitionSpotlight />
        <ExploreFiltersClient key={q + "|" + stage + "|" + type} base={base} initialQuery={q} initialStage={stage} initialType={type} />
        <section className={styles.recommendations} aria-labelledby="explore-recommendations-heading">
          <div className={styles.panelHeading}>
            <h2 id="explore-recommendations-heading"><Sparkles size={19} aria-hidden="true" /> Para você explorar</h2>
            <Link href="#explore-more-projects">Ver mais <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          {suggestions.length ? <div className={styles.suggestionList}>
            {suggestions.map(project => <Link className={styles.suggestion} key={project.key} href={(expectedRole === "investor" ? "/investor" : "") + "/projects/" + encodeURIComponent(project.slug) + "?from=explore"}>
              <span className={styles.suggestionArtwork}><ProjectArtwork title={project.title} category={project.category} /></span>
              <span><strong>{project.title}</strong><small>{project.category || "Projeto"} · {project.stage || "Ideia"}</small></span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>)}
          </div> : <div className={styles.railEmpty}>
            <Compass size={22} aria-hidden="true" />
            <p>Descubra mais projetos conforme a comunidade compartilha suas ideias.</p>
          </div>}
        </section>
      </aside>
    </div>
  </div>;
}
