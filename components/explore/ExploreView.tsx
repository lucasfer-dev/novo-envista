import Link from "next/link";
import { ArrowUpRight, FolderKanban, SearchX, Users, UserRound } from "lucide-react";
import ProjectArtwork from "@/components/product/ProjectArtwork";
import ExploreFiltersClient from "./ExploreFiltersClient";
import { entityRoute } from "@/lib/profiles";
import type { ProductRole } from "@/lib/auth/require-product-user";
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

export type PageState = {
  projects_page: number;
  teams_page: number;
  people_page: number;
};

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


function EmptyExploreState({kind,filtered,base,role}:{kind:"projects"|"teams"|"people";filtered:boolean;base:string;role:ProductRole}) {
 const labels={projects:"Nenhum projeto por aqui ainda",teams:"Nenhuma equipe por aqui ainda",people:"Nenhum perfil encontrado"};
 const Icon=kind==="projects"?FolderKanban:kind==="teams"?Users:UserRound;
 const href=filtered?base:kind==="projects"?(role==="investor"?"/investor/projects/new":"/projects/new"):kind==="teams"?(role==="investor"?"/investor/teams/new":"/teams/new"):null;
 return <div className={styles.empty}><span className={styles.emptyIcon}>{filtered?<SearchX size={22}/>:<Icon size={22}/>}</span><div><h3>{filtered?"Nenhum resultado com esses filtros":labels[kind]}</h3><p>{filtered?"Tente outro termo ou remova os filtros para ampliar a busca.":kind==="projects"?"Compartilhe o que você está construindo com a comunidade.":kind==="teams"?"Uma boa ideia pode começar com a sua equipe.":"Os perfis públicos da comunidade aparecerão aqui."}</p></div>{href?<Link className="secondary" href={href}>{filtered?"Limpar filtros":kind==="projects"?"Criar projeto":"Criar equipe"}</Link>:null}</div>;
}

export function ExploreView({expectedRole,base,q,stage,pages,projects,teams,profiles,projectTotal,teamTotal,profileTotal,loadError}:{expectedRole:ProductRole;base:string;q:string;stage:string;pages:PageState;projects:ExploreProject[];teams:ExploreTeam[];profiles:ExploreProfile[];projectTotal:number;teamTotal:number;profileTotal:number;loadError:boolean}) {
 const total=projectTotal+teamTotal+profileTotal;
 const filtered=Boolean(q)||stage!=="Todos";
 const context=expectedRole==="investor"?"investor":"participant";
 return <div className={styles.page}>
      <div className={`page-head ${styles.heading}`}>
        <div>
          <h1>Explorar</h1>
          <p>Encontre projetos, conheça equipes e conecte-se com quem está construindo.</p>
        </div>
      </div>

      <ExploreFiltersClient key={`${q}::${stage}`} base={base} initialQuery={q} initialStage={stage} />

      {loadError ? <div className="form-error" role="alert" style={{ marginBottom: 18 }}>Parte dos resultados não pôde ser carregada. Tente novamente.</div> : null}

      <nav className={styles.index} aria-label="Resultados por categoria">
        <a href="#explore-projects"><FolderKanban size={17} />Projetos <span>{projectTotal}</span></a>
        <a href="#explore-teams"><Users size={17} />Equipes <span>{teamTotal}</span></a>
        <a href="#explore-people"><UserRound size={17} />Pessoas <span>{profileTotal}</span></a>
        <small>{total} resultado{total === 1 ? "" : "s"}{q ? ` para “${q}”` : ""}</small>
      </nav>

      <section className={styles.section} id="explore-projects">
        <div className={styles.sectionHead}>
          <div>
            <h2>Projetos</h2>
            <p>Ideias e soluções da comunidade.</p>
          </div>
        </div>

        {projects.length ? (
          <div className="project-grid">
            {projects.map((project) => {
              const href = project.real
                ? `${expectedRole === "investor" ? "/investor" : ""}/projects/${encodeURIComponent(project.slug)}?from=explore`
                : entityRoute({ type: "project", id: project.slug, source: "explore", context });

              return (
                <article className={`project-card ${styles.resultCard}`} key={project.key}>
                  <Link className={styles.hitTarget} href={href} aria-label={`Abrir projeto ${project.title}`} />
                  <span className={styles.cardArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
                  <div className="project-cover">
                    <ProjectArtwork title={project.title || "Projeto"} category={project.category || ""} />
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
        ) : <EmptyExploreState kind="projects" filtered={filtered} base={base} role={expectedRole} />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="projects_page" total={projectTotal} />
      </section>

      <section className={styles.section} id="explore-teams">
        <div className={styles.sectionHead}>
          <div>
            <h2>Equipes</h2>
            <p>Encontre pessoas para construir junto.</p>
          </div>
        </div>

        {teams.length ? (
          <div className="team-row">
            {teams.map((team) => {
              const href = team.real
                ? `${expectedRole === "investor" ? "/investor" : ""}/teams/${encodeURIComponent(team.slug)}?from=explore`
                : entityRoute({ type: "team", id: team.slug, source: "explore", context });

              return (
                <article className={`team-card ${styles.resultCard}`} key={team.key}>
                  <Link className={styles.hitTarget} href={href} aria-label={`Abrir equipe ${team.name}`} />
                  <span className={styles.cardArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
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
        ) : <EmptyExploreState kind="teams" filtered={filtered} base={base} role={expectedRole} />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="teams_page" total={teamTotal} />
      </section>

      <section className={styles.section} id="explore-people">
        <div className={styles.sectionHead}>
          <div>
            <h2>Pessoas</h2>
            <p>Participantes e investidores para conhecer.</p>
          </div>
        </div>

        {profiles.length ? (
          <div className="team-row">
            {profiles.map((profile) => {
              const href = entityRoute({ type: profile.role, id: profile.username, source: "explore", context });
              return (
                <article className={`team-card ${styles.resultCard}`} key={profile.id}>
                  <Link className={styles.hitTarget} href={href} aria-label={`Abrir perfil de ${profile.name}`} />
                  <span className={styles.cardArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
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
        ) : <EmptyExploreState kind="people" filtered={filtered} base={base} role={expectedRole} />}

        <Pagination base={base} q={q} stage={stage} pages={pages} pageKey="people_page" total={profileTotal} />
      </section>

    </div>;
}
