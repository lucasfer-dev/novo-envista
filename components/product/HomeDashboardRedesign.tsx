import Link from "next/link";
import type { CSSProperties } from "react";
import CompetitionCount from "./HomeCompetitionCount";
import {
  ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronRight, Compass,
  FolderKanban, Layers3, Plus, Sparkles, Star, Trophy, UserRound, Users, Zap,
} from "lucide-react";
import ProjectArtwork from "./ProjectArtwork";
import HomeOpportunitiesRedesign from "./HomeOpportunitiesRedesign";
import styles from "./HomeDashboardRedesign.module.css";

export type DashboardProject = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  stage: string;
  category: string;
  location: string;
  tags: string[];
};
export type DashboardTeam = {
  id: string; slug: string; name: string; description: string;
  city: string; tags: string[];
};
export type DashboardNotification = {
  id: string; title: string; body: string | null; href: string | null;
  read_at: string | null; created_at: string;
};
export type DashboardAgendaEvent = {
  id: string; title: string; starts_at: string; href: string | null;
};
export type DashboardProfileStep = { label: string; done: boolean };

type Props = {
  name: string;
  projects: DashboardProject[];
  featuredProjects?: DashboardProject[];
  teams: DashboardTeam[];
  notifications: DashboardNotification[];
  agenda?: DashboardAgendaEvent[];
  profileSteps?: DashboardProfileStep[];
  course: { slug: string; title: string; description: string | null } | null;
  courseProgress: number;
  followerCount?: number;
};

function iconForNotification(title: string) {
  if (/equipe|convite|integrante|seguidor/i.test(title)) return Users;
  if (/competição|desafio|oportunidade/i.test(title)) return Trophy;
  if (/projeto|tarefa/i.test(title)) return FolderKanban;
  return Bell;
}
function when(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
function eventDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "" };
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).format(date).replace(".", "").toUpperCase(),
  };
}
function timeOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(date);
}
function panelHeading(id: string, label: string, Icon: typeof Star, href: string, action: string) {
  return <div className={styles.panelHeading}>
    <h2 id={id}><Icon size={19} aria-hidden="true" />{label}</h2>
    <Link href={href} className={styles.viewAll}>{action} <ArrowRight size={15} aria-hidden="true" /></Link>
  </div>;
}
export default function HomeDashboard({
  projects, featuredProjects = [], teams, notifications, agenda = [], followerCount = 0,
  profileSteps = [], course, courseProgress,
}: Props) {
  const progress = Math.max(0, Math.min(100, courseProgress));
  const stepsDone = profileSteps.filter(item => item.done).length;
  const profilePercentage = profileSteps.length
    ? Math.round(stepsDone * 100 / profileSteps.length) : null;
  // O projeto principal ocupa o cartão editorial; os demais seguem em Explorar.
  const displayProjects = (featuredProjects.length ? featuredProjects : projects).slice(0, 1);
  const profileDone = profilePercentage === 100;
  return (
    <div className={styles.home} data-envista-home-redesign>
      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <header className={styles.hero}>
            <span className={styles.heroPattern} aria-hidden="true" />
            <span className={styles.heroAngle} aria-hidden="true" />
            <span className={styles.heroHorizon} aria-hidden="true" />
            <img className={styles.heroSymbol} src="/brand/envista-symbol-gradient.svg" width="340" height="340" alt="" aria-hidden="true" />
            <img className={styles.heroPortrait} src="/brand/envista-hero-reference.webp" width="390" height="276" alt="" aria-hidden="true" />
            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}>IDEIAS · PESSOAS · PROJETOS · IMPACTO</span>
              <h1>Boas ideias merecem<br /><span>sair do papel.</span></h1>
              <p>Crie projetos, forme equipes, participe de competições e conecte-se com pessoas e investidores para transformar suas ideias em impacto.</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href="/app/projects/new"><Plus size={20} aria-hidden="true" /> Criar novo projeto</Link>
                <Link className={styles.outlineAction} href="/explore"><Compass size={19} aria-hidden="true" /> Explorar oportunidades</Link>
              </div>
            </div>
          </header>

          <section className={styles.stats} aria-label="Resumo da sua conta">
            <Link className={styles.statCard} href="/projects" aria-label={projects.length + " projetos recentes"}>
              <span className={styles.statIcon}><FolderKanban size={24} aria-hidden="true" /></span>
              <span className={styles.statCopy}><strong>{projects.length}</strong><small>Projetos recentes</small></span>
              <ArrowRight className={styles.statTrend} size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.statCard} href="/teams">
              <span className={styles.statIcon}><Users size={24} aria-hidden="true" /></span>
              <span className={styles.statCopy}><strong>{teams.length}</strong><small>{teams.length === 1 ? "Equipe" : "Equipes"}</small></span>
              <ArrowRight className={styles.statTrend} size={18} aria-hidden="true" />
            </Link>
            <CompetitionCount />
            <Link className={styles.statCard} href="/account/profile">
              <span className={styles.statIcon}><UserRound size={24} aria-hidden="true" /></span>
              <span className={styles.statCopy}><strong>{followerCount}</strong><small>{followerCount === 1 ? "Seguidor" : "Seguidores"}</small></span>
              <ArrowRight className={styles.statTrend} size={18} aria-hidden="true" />
            </Link>
          </section>

          <div className={styles.showcaseGrid}>
            <section className={styles.featuredSection} aria-labelledby="featured-projects-heading">
              {panelHeading("featured-projects-heading", "Projetos em destaque", Star, "/explore", "Ver todos")}
              {displayProjects.length ? <div className={styles.projectGrid}>
                {displayProjects.map((project,index) => {
                  const name = project.title.trim().toLocaleLowerCase("pt-BR");
                  const referenceCover = name === "elas+" ? "/brand/envista-cover-elas.webp" :
                    name === "elovia" ? "/brand/envista-cover-elovia.webp" :
                    name === "nova" ? "/brand/envista-cover-nova.webp" : null;
                  return <Link key={project.id} className={styles.projectCard} href={"/projects/" + encodeURIComponent(project.slug)} aria-label={"Abrir projeto " + project.title}>
                    <div className={styles.projectCover} data-tone={index}>
                      {referenceCover ? <img className={styles.projectImage} src={referenceCover} alt="" loading="lazy" /> :
                        <ProjectArtwork title={project.title} category={project.category} />}
                    </div>
                    <div className={styles.projectInfo}>
                      <span className={styles.projectBadge}>{project.category || "Projeto"}</span>
                      <h3>{project.title}</h3>
                      <p>{project.short_description || "Conheça este projeto da comunidade Envista."}</p>
                      <div className={styles.projectMeta}><span><FolderKanban size={14} aria-hidden="true" /> {project.stage || "Em desenvolvimento"}</span><span className={styles.projectVisit}><ArrowRight size={18} aria-hidden="true" /></span></div>
                    </div>
                  </Link>;
                })}
              </div> : <div className={styles.featuredEmpty}>
                <FolderKanban size={26} aria-hidden="true" />
                <div><h3>Seus projetos começam aqui.</h3><p>Publique sua primeira ideia ou descubra os projetos da comunidade.</p></div>
                <Link className={styles.viewAll} href="/explore">Explorar <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>}
            </section>
            <HomeOpportunitiesRedesign />
          </div>

          <section className={styles.learningBanner} aria-labelledby="learning-heading">
            <span className={styles.learningVisual}><img src="/brand/learning-books.svg" width="88" height="77" alt="" loading="lazy" /></span>
            <div className={styles.learningCopy}>
              <h2 id="learning-heading">Continue aprendendo</h2>
              <p>{course?.description || "Trilhas, aulas e conteúdos práticos para evoluir suas ideias e projetos."}</p>
            </div>
            {course && <div className={styles.learningProgress}>
              <span>Seu progresso nas trilhas</span>
              <div className={styles.progressInline}><span className={styles.track}><i style={{ width: progress + "%" }} /></span><strong>{progress}%</strong></div>
            </div>}
            <Link className={styles.outlineAction} href={course ? "/learn/" + encodeURIComponent(course.slug) : "/learn"}>{course ? "Continuar trilha" : "Explorar trilhas"} <ArrowRight size={16} aria-hidden="true" /></Link>
          </section>
        </div>

        <aside className={styles.rail} aria-label="Seu progresso e novidades">
          <section className={styles.progressPanel} aria-labelledby="progress-heading">
            <h2 id="progress-heading"><Zap size={19} aria-hidden="true" /> Seu progresso</h2>
            <div className={styles.progressContent}>
              <div className={styles.progressRing} style={{ "--home-progress": (profilePercentage ?? 0) + "%" } as CSSProperties}>
                <span>{profilePercentage === null ? "—" : profilePercentage + "%"}</span>
              </div>
              <div className={styles.progressCopy}>
                <h3>{profileDone ? "Perfil completo!" : "Complete seu perfil"}</h3>
                <p>{profileDone ? "Seu perfil está pronto para novas conexões." : profileSteps.length ? "Faltam " + (profileSteps.length - stepsDone) + " etapas para concluir seu perfil." : "Adicione suas informações e aumente suas conexões."}</p>
                <Link className={styles.outlineAction} href="/account/profile">{profileDone ? "Ver perfil" : "Continuar"} <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </div>
          </section>

          <section className={styles.railPanel} aria-labelledby="activity-heading">
            <h2 id="activity-heading" className={styles.railTitle}><Zap size={19} aria-hidden="true" /> Acontecendo agora</h2>
            {notifications.length ? <div className={styles.activityList}>{notifications.slice(0,3).map(item => {
              const Icon = iconForNotification(item.title);
              return <Link className={styles.activityItem} href={item.href || "/notifications"} key={item.id}>
                <span className={styles.activityIcon}><Icon size={18} aria-hidden="true" /></span>
                <span className={styles.activityCopy}><strong>{item.title}</strong><small>{item.body || "Confira a atualização na sua conta."}</small><time dateTime={item.created_at}>{when(item.created_at)}</time></span>
              </Link>;
            })}</div> : <div className={styles.railEmpty}><Bell size={21} aria-hidden="true" /><p>Você está em dia. Novas atividades vão aparecer aqui.</p></div>}
            <Link className={styles.railFooterLink} href="/activity">Ver mais atividades <ArrowRight size={14} aria-hidden="true" /></Link>
          </section>

          <section className={styles.railPanel} aria-labelledby="agenda-heading">
            <div className={styles.panelHeading}><h2 id="agenda-heading"><CalendarDays size={18} aria-hidden="true" /> Seu calendário</h2>
              <Link className={styles.viewAll} href="/calendar">Ver agenda <ArrowRight size={14} aria-hidden="true" /></Link></div>
            {agenda.length ? <div className={styles.agendaList}>{agenda.slice(0,3).map(event=>{
              const date=eventDay(event.starts_at);
              return <Link key={event.id} className={styles.agendaItem} href={event.href && event.href.startsWith("/") ? event.href : "/calendar"}>
                <span className={styles.calendarDate}><strong>{date.day}</strong><small>{date.month}</small></span>
                <span><strong>{event.title}</strong><small>{timeOnly(event.starts_at)}</small></span>
              </Link>;
            })}</div> : <div className={styles.railEmpty}><CalendarDays size={21} aria-hidden="true" /><p>Nenhum evento próximo no calendário.</p></div>}
          </section>
        </aside>
      </div>
    </div>
  );
}
