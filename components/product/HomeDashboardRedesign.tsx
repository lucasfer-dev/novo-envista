import Link from "next/link";
import type { CSSProperties } from "react";
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
  name, projects, featuredProjects = [], teams, notifications, agenda = [],
  profileSteps = [], course, courseProgress,
}: Props) {
  const firstName = name.trim().split(/\s+/)[0] || "criador";
  const unread = notifications.filter(item => !item.read_at).length;
  const progress = Math.max(0, Math.min(100, courseProgress));
  const stepsDone = profileSteps.filter(item => item.done).length;
  const profilePercentage = profileSteps.length
    ? Math.round(stepsDone * 100 / profileSteps.length) : null;
  const showcase = (featuredProjects.length ? featuredProjects : projects).slice(0, 4);
  const ownProject = projects[0];
  const firstSteps = [
    { title: "Crie seu primeiro projeto", description: "Mostre sua ideia e comece seu portfólio.", href: "/projects/new", Icon: FolderKanban, done: projects.length > 0 },
    { title: "Encontre sua equipe", description: "Conheça pessoas e construa em conjunto.", href: "/teams", Icon: Users, done: teams.length > 0 },
    { title: "Comece uma trilha", description: "Aprenda e aplique novas habilidades.", href: "/learn", Icon: BookOpen, done: Boolean(course) },
  ];
  const completedSteps = firstSteps.filter(step => step.done).length;
  const firstIncomplete = firstSteps.find(step => !step.done);

  return (
    <div className={styles.home} data-envista-home-redesign>
      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <header className={styles.hero}>
            <div className={styles.heroPattern} aria-hidden="true" />
            <div className={styles.heroAngle} aria-hidden="true" />
            <img className={styles.heroSymbol} src="/brand/envista-symbol-gradient.svg" alt="" aria-hidden="true" />
            <div className={styles.heroContent}>
              <h1>Olá, {firstName}.<br /><span>Suas ideias em movimento.</span></h1>
              <p>Transforme suas ideias em projetos, forme equipes e encontre oportunidades reais para evoluir com impacto.</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href="/projects/new"><Plus size={19} aria-hidden="true" /> Criar projeto</Link>
                <Link className={styles.outlineAction} href="/explore"><Compass size={19} aria-hidden="true" /> Explorar oportunidades</Link>
              </div>
            </div>
          </header>

          <section className={styles.stats} aria-label="Resumo da sua conta">
            <Link href="/projects" className={styles.statCard}><span className={styles.statIcon}><FolderKanban size={25} aria-hidden="true" /></span><div><strong>{projects.length}</strong><span>{projects.length === 1 ? "Projeto" : "Projetos"}</span></div><ChevronRight className={styles.statArrow} size={16} /></Link>
            <Link href="/teams" className={styles.statCard}><span className={styles.statIcon}><Users size={25} aria-hidden="true" /></span><div><strong>{teams.length}</strong><span>{teams.length === 1 ? "Equipe" : "Equipes"}</span></div><ChevronRight className={styles.statArrow} size={16} /></Link>
            <Link href="/notifications" className={styles.statCard}><span className={styles.statIcon}><Bell size={24} aria-hidden="true" /></span><div><strong>{unread}</strong><span>{unread === 1 ? "Notificação não lida" : "Notificações não lidas"}</span></div><ChevronRight className={styles.statArrow} size={16} /></Link>
            <Link href="/competitions" className={styles.statCard}><span className={styles.statIcon}><Zap size={25} aria-hidden="true" /></span><div><strong className={styles.statText}>Explorar</strong><span>Oportunidades</span></div><ChevronRight className={styles.statArrow} size={16} /></Link>
          </section>

          <section className={styles.stepsSection} aria-labelledby="next-steps-heading">
            <div className={styles.sectionHeading}>
              <div><h2 id="next-steps-heading"><Layers3 size={20} aria-hidden="true" /> Próximos passos</h2><p>Ações para você avançar no Envista.</p></div>
              {completedSteps < firstSteps.length && <span className={styles.stepCounter}>{completedSteps}/{firstSteps.length} concluídos</span>}
            </div>
            <div className={styles.nextGrid}>
              <Link href={firstIncomplete?.href || "/workspace"} className={styles.nextCard}>
                <div className={styles.progressRing} style={{ "--home-progress": (completedSteps / firstSteps.length * 100) + "%" } as CSSProperties}><span>{completedSteps}/{firstSteps.length}</span></div>
                <div className={styles.nextCopy}><h3>{firstIncomplete?.title || "Você concluiu os primeiros passos!"}</h3><p>{firstIncomplete?.description || "Acompanhe a evolução dos seus projetos."}</p></div>
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <Link href={ownProject ? "/projects/" + encodeURIComponent(ownProject.slug) : "/explore"} className={styles.nextCard}>
                <span className={styles.nextArtwork}>{ownProject ? <ProjectArtwork title={ownProject.title} category={ownProject.category} /> : <Compass size={29} aria-hidden="true" />}</span>
                <div className={styles.nextCopy}><h3>{ownProject ? "Continue: " + ownProject.title : "Descubra projetos para se inspirar"}</h3><p>{ownProject ? "Retome sua ideia e dê o próximo passo." : "Explore projetos reais da comunidade Envista."}</p></div>
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className={styles.featuredSection} aria-labelledby="featured-projects-heading">
            {panelHeading("featured-projects-heading", "Projetos em destaque", Star, "/explore", "Ver todos")}
            {showcase.length ? <div className={styles.projectGrid}>
              {showcase.map((project, index) => <Link key={project.id} className={styles.projectCard} href={"/projects/" + encodeURIComponent(project.slug)}>
                <div className={styles.projectCover} data-tone={index % 4}>
                  <ProjectArtwork title={project.title} category={project.category} />
                  <span className={styles.projectCategory}>{project.category || "Projeto"}</span>
                </div>
                <div className={styles.projectInfo}>
                  <h3>{project.title}</h3>
                  <p>{project.short_description || "Conheça este projeto da comunidade."}</p>
                  <div className={styles.projectMeta}><span>{project.stage || "Em desenvolvimento"}</span><ArrowRight size={16} aria-hidden="true" /></div>
                </div>
              </Link>)}
            </div> : <div className={styles.featuredEmpty}>
              <span className={styles.emptyArt}><FolderKanban size={28} aria-hidden="true" /></span>
              <div><h3>Seu próximo projeto pode estar aqui.</h3><p>Quando houver projetos publicados, você poderá descobri-los nesta seção. Que tal começar pelo seu?</p></div>
              <Link className={styles.outlineAction} href="/projects/new">Criar projeto <ArrowRight size={16} /></Link>
            </div>}
          </section>

          <div className={styles.bottomGrid}>
            <HomeOpportunitiesRedesign />
            <section className={styles.learningPanel} aria-labelledby="learning-heading">
              {panelHeading("learning-heading", "Aprender", BookOpen, "/learn", "Ver trilhas")}
              <div className={styles.learningBody}>
                <span className={styles.learningIllustration}><img src="/brand/learning-books.svg" alt="" loading="lazy" /></span>
                <div><h3>{course?.title || "Da ideia ao projeto"}</h3><p>{course?.description || "Aprenda no seu ritmo e transforme conhecimento em um projeto real."}</p></div>
              </div>
              {course && <div className={styles.courseProgress}><div className={styles.track}><span style={{ width: progress + "%" }} /></div><small>{progress}% concluído</small></div>}
              <Link className={styles.outlineAction} href={course ? "/learn/" + encodeURIComponent(course.slug) : "/learn"}>{course ? "Continuar trilha" : "Explorar trilhas"} <ArrowRight size={16} /></Link>
            </section>
          </div>
        </div>

        <aside className={styles.rail} aria-label="Atividades, agenda e perfil">
          <section className={styles.railPanel} aria-labelledby="activity-heading">
            {panelHeading("activity-heading", "Acontecendo agora", Zap, "/activity", "Ver tudo")}
            {notifications.length ? <div className={styles.activityList}>{notifications.slice(0, 3).map(item => {
              const Icon = iconForNotification(item.title);
              return <Link className={styles.activityItem} href={item.href || "/notifications"} key={item.id}>
                <span className={styles.activityIcon}><Icon size={20} aria-hidden="true" /></span>
                <span className={styles.activityCopy}><strong>{item.title}</strong><small>{item.body || "Confira a atualização na sua conta."}</small><time dateTime={item.created_at}>{when(item.created_at)}</time></span>
              </Link>;
            })}</div> : <div className={styles.railEmpty}><Bell size={21} aria-hidden="true" /><p>Tudo em dia! Novidades e convites aparecerão aqui.</p></div>}
          </section>

          <section className={styles.railPanel} aria-labelledby="agenda-heading">
            {panelHeading("agenda-heading", "Agenda", CalendarDays, "/calendar", "Ver agenda")}
            {agenda.length ? <div className={styles.agendaList}>{agenda.slice(0, 3).map(event => {
              const date = eventDay(event.starts_at);
              return <Link key={event.id} className={styles.agendaItem} href={event.href && event.href.startsWith("/") ? event.href : "/calendar"}>
                <span className={styles.calendarDate}><strong>{date.day}</strong><small>{date.month}</small></span>
                <span><strong>{event.title}</strong><small>{timeOnly(event.starts_at)}</small></span>
              </Link>;
            })}</div> : <div className={styles.railEmpty}><CalendarDays size={21} aria-hidden="true" /><p>Nenhum evento próximo. Veja as competições disponíveis no calendário.</p></div>}
          </section>

          <section className={styles.railPanel} aria-labelledby="profile-heading">
            <div className={styles.panelHeading}><h2 id="profile-heading"><UserRound size={19} aria-hidden="true" />{profilePercentage === 100 ? "Seu perfil" : "Complete seu perfil"}</h2>{profilePercentage !== null && <b className={styles.profilePercent}>{profilePercentage}%</b>}</div>
            {profilePercentage !== null && <div className={styles.track} role="progressbar" aria-label="Perfil preenchido" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profilePercentage}><span style={{ width: profilePercentage + "%" }} /></div>}
            <p className={styles.profileHelp}>{profilePercentage === 100 ? "Seu perfil está completo. Continue compartilhando sua evolução." : "Um perfil completo facilita conexões com equipes, projetos e oportunidades."}</p>
            {profileSteps.length > 0 && <ul className={styles.profileChecklist}>{profileSteps.map(item => <li key={item.label} data-done={item.done}><span className={styles.checkIcon}>{item.done && <Check size={14} aria-hidden="true" />}</span>{item.label}</li>)}</ul>}
            <Link className={styles.profileButton} href="/account/profile">{profilePercentage === 100 ? "Ver meu perfil" : "Completar perfil"} <ArrowRight size={16} aria-hidden="true" /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
