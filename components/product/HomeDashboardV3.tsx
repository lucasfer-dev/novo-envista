"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight,
  Code2, Compass, FolderKanban, GraduationCap, Layers3, Leaf, Plus,
  Rocket, Sparkles, Star, Trophy, Users, Zap,
} from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import type {
  DashboardProject, DashboardTeam, DashboardAgendaEvent, DashboardProfileStep,
} from "./HomeDashboardRedesign";
import styles from "./HomeDashboardV3.module.css";

type SuggestedPerson = {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  role?: string | null;
  interest_tags?: string[] | null;
};

type Props = {
  name: string;
  projects: DashboardProject[];
  featuredProjects?: DashboardProject[];
  teams: DashboardTeam[];
  notifications: { id: string; title: string; body: string | null; href: string | null; read_at: string | null; created_at: string }[];
  agenda?: DashboardAgendaEvent[];
  profileSteps?: DashboardProfileStep[];
  course: { slug: string; title: string; description: string | null } | null;
  courseProgress: number;
  followerCount?: number;
  suggestedPeople?: SuggestedPerson[];
  learningCount?: number;
  competitionParticipations?: number;
  todayISO?: string;
  nowISO?: string;
};

const HERO_SLIDES = [
  {
    eyebrow: "BEM-VINDO AO ENVISTA",
    first: "Transforme suas ideias em",
    accent: "projetos, equipes e oportunidades.",
    text: "Conecte-se com pessoas, forme equipes, participe de competições e tire suas ideias do papel com o apoio da comunidade Envista.",
    action: "Começar um projeto",
    href: "/app/projects/new",
    secondary: "Explorar o Envista",
    secondaryHref: "/explore",
  },
  {
    eyebrow: "GENTE QUE CONSTRÓI JUNTO",
    first: "Suas conexões podem",
    accent: "mudar tudo.",
    text: "Encontre pessoas com habilidades complementares, participe de equipes e transforme ideias em projetos.",
    action: "Encontrar equipes",
    href: "/teams",
    secondary: "Explorar projetos",
    secondaryHref: "/explore",
  },
  {
    eyebrow: "CONHECIMENTO · DESAFIOS · EVOLUÇÃO",
    first: "Sua próxima conquista",
    accent: "começa aqui.",
    text: "Descubra competições e trilhas de aprendizado para desenvolver suas habilidades e encontrar novas oportunidades.",
    action: "Ver competições",
    href: "/competitions",
    secondary: "Continuar aprendendo",
    secondaryHref: "/learn",
  },
] as const;

function safeLink(value: string | null | undefined, fallback = "/calendar") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find(item => item.type === name)?.value || "";
  return part("year") + "-" + part("month") + "-" + part("day");
}

function eventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "", time: "" };
  const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "short" })
    .format(date).replace(".", "").toUpperCase();
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit",
  }).format(date);
  return { day, month, time };
}

function competitionDate(item: LiveCompetition) {
  const raw = item.registrationEnd || item.eventDate;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Consulte o regulamento";
  const date = new Date(raw + "T12:00:00Z");
  const text = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", day: "2-digit", month: "short",
  }).format(date);
  return (item.registrationEnd ? "Inscrições até " : "Evento em ") + text;
}

function PanelHeading({ icon: Icon, title, href, action = "Ver todos" }: {
  icon: typeof Trophy; title: string; href: string; action?: string;
}) {
  return (
    <div className={styles.panelHeading}>
      <h2><Icon size={19} strokeWidth={2} aria-hidden="true" /> {title}</h2>
      <Link href={href}>{action} <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
  );
}

function MonthCalendar({ todayISO, agenda }: { todayISO: string; agenda: DashboardAgendaEvent[] }) {
  const [offset, setOffset] = useState(0);
  const year = Number(todayISO.slice(0, 4)) || 2026;
  const month = (Number(todayISO.slice(5, 7)) || 1) - 1;
  const shown = new Date(Date.UTC(year, month + offset, 1));
  const shownYear = shown.getUTCFullYear();
  const shownMonth = shown.getUTCMonth();
  const leading = new Date(Date.UTC(shownYear, shownMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(shownYear, shownMonth + 1, 0)).getUTCDate();
  const monthName = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", month: "long", year: "numeric",
  }).format(shown);
  const eventDates = useMemo(() => {
    const map = new Map<string, DashboardAgendaEvent[]>();
    for (const event of agenda) {
      const key = dateKey(event.starts_at);
      if (key) map.set(key, [...(map.get(key) || []), event]);
    }
    return map;
  }, [agenda]);

  const slots = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const visibleSlots = slots.slice(0, leading + daysInMonth <= 35 ? 35 : 42);
  const today = todayISO.slice(0, 10);

  return (
    <section className={styles.calendarPanel} aria-label="Calendário do Envista">
      <div className={styles.railHeading}>
        <h2><CalendarDays size={22} /> Calendário</h2>
        <div className={styles.monthNav}>
          <span aria-live="polite">{monthName}</span>
          <button type="button" onClick={() => setOffset(value => value - 1)} aria-label="Mês anterior"><ChevronLeft size={17} /></button>
          <button type="button" onClick={() => setOffset(value => value + 1)} aria-label="Próximo mês"><ChevronRight size={17} /></button>
        </div>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map(day => <span key={day}>{day}</span>)}
      </div>
      <div className={styles.daysGrid}>
        {visibleSlots.map((day, index) => {
          if (day === null) return <span className={styles.blankDay} key={"blank-" + index} />;
          const key = shownYear + "-" + String(shownMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
          const entries = eventDates.get(key) || [];
          return (
            <Link
              href={entries.length === 1 ? safeLink(entries[0].href) : "/calendar"}
              className={styles.day + (key === today ? " " + styles.today : "") + (entries.length ? " " + styles.hasEvent : "")}
              aria-label={day + " de " + monthName + (entries.length ? ", " + entries.length + " evento(s)" : "")}
              title={entries.map(item => item.title).join(" · ") || undefined}
              key={key}
            >
              <span>{String(day).padStart(2, "0")}</span>
              {entries.length > 0 ? <span className={styles.dayDot} aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function EventRow({ event, small = false }: { event: DashboardAgendaEvent; small?: boolean }) {
  const date = eventDate(event.starts_at);
  return (
    <Link className={styles.eventRow + (small ? " " + styles.compactEvent : "")} href={safeLink(event.href)}>
      <span className={styles.eventDate}><strong>{date.day}</strong><small>{date.month}</small></span>
      <span className={styles.eventCopy}><strong>{event.title}</strong><small>{date.time} · No calendário</small></span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}

export default function HomeDashboardV3({
  projects, teams, agenda = [], profileSteps = [], course, suggestedPeople = [],
  courseProgress, learningCount = 0, competitionParticipations = 0,
  todayISO = "2026-11-10", nowISO,
}: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [competitions, setCompetitions] = useState<LiveCompetition[] | null>(null);
  const [competitionFailed, setCompetitionFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { credentials: "same-origin", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Falha na consulta de competições");
        const result = await response.json() as LiveCompetitionsResponse;
        setCompetitions((result.items || []).filter(item => item.status === "OPEN" || item.status === "UPCOMING"));
      })
      .catch(() => { if (!controller.signal.aborted) { setCompetitions([]); setCompetitionFailed(true); } });
    return () => controller.abort();
  }, []);

  const profileComplete = profileSteps.length > 0 && profileSteps.every(step => step.done);
  const journey = [
    { label: "Perfil completo", detail: "Seu perfil pronto para conexões", done: profileComplete, href: "/account/profile" },
    { label: "Criar um projeto", detail: "Sua ideia no Envista", done: projects.length > 0, href: "/app/projects/new" },
    { label: "Entrar em uma equipe", detail: "Construa com outras pessoas", done: teams.length > 0, href: "/teams" },
    { label: "Participar de uma competição", detail: "Coloque sua ideia à prova", done: competitionParticipations > 0, href: "/competitions" },
  ];
  const doneCount = journey.filter(step => step.done).length;
  const journeyPercent = Math.round(doneCount / journey.length * 100);
  const firstPending = journey.findIndex(step => !step.done);
  const currentStep = firstPending === -1 ? null : journey[firstPending];
  const slide = HERO_SLIDES[slideIndex];
  const upcoming = agenda
    .filter(event => new Date(event.starts_at).getTime() >= (nowISO ? new Date(nowISO).getTime() : new Date(todayISO + "T00:00:00-03:00").getTime()))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const nearestEvent = upcoming[0];
  const featuredCompetition = competitions?.[0];
  const openCount = competitions ? competitions.filter(item => item.status === "OPEN").length : null;
  const topProjects = projects.slice(0, 2);
  const courseLink = course ? "/learn/" + encodeURIComponent(course.slug) : "/learn";

  return (
    <div className={styles.dashboard} data-envista-home-v3>
      <div className={styles.layout}>
        <div className={styles.primaryColumn}>
          <section className={styles.hero} aria-label="Comece sua jornada no Envista">
            <span className={styles.heroPattern} aria-hidden="true" />
            <span className={styles.heroGlobe} aria-hidden="true" />
            <div className={styles.heroShowcase} aria-hidden="true">
              <span className={styles.heroOrbit} />
              <img className={styles.heroLaptop} src="/brand/envista-dashboard-laptop.svg" alt="" width="1400" height="900" />
              <div className={styles.heroPhone}>
                <span className={styles.phoneCamera} />
                <img src="/brand/envista-symbol-gradient.svg" alt="" width="66" height="66" />
              </div>
            </div>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>{slide.eyebrow}</span>
              <h2>{slide.first}<br /><span>{slide.accent}</span></h2>
              <p>{slide.text}</p>
              <div className={styles.heroActions}>
                <Link className={styles.btnPrimary} href={slide.href}><Plus size={18} /> {slide.action}</Link>
                <Link className={styles.btnSecondary} href={slide.secondaryHref}><Compass size={17} /> {slide.secondary}</Link>
              </div>
            </div>
            <div className={styles.heroPagination} role="group" aria-label="Banners de destaque">
              {HERO_SLIDES.map((item, index) => (
                <button
                  type="button" key={item.eyebrow} onClick={() => setSlideIndex(index)}
                  className={index === slideIndex ? styles.selectedDot : ""}
                  aria-label={"Mostrar destaque " + (index + 1)}
                  aria-pressed={index === slideIndex}
                />
              ))}
            </div>
          </section>

          <div className={styles.metrics} aria-label="Resumo do seu espaço">
            <Link href="/app/projects" className={styles.metric}>
              <span className={styles.metricIcon}><Layers3 size={27} /></span>
              <span><strong>{projects.length}</strong><small>{projects.length === 1 ? "Projeto" : "Projetos"}</small></span>
            </Link>
            <Link href="/teams" className={styles.metric}>
              <span className={styles.metricIcon}><Users size={27} /></span>
              <span><strong>{teams.length}</strong><small>{teams.length === 1 ? "Equipe" : "Equipes"}</small></span>
            </Link>
            <Link href="/competitions" className={styles.metric + " " + styles.metricPurple}>
              <span className={styles.metricIcon}><Trophy size={26} /></span>
              <span><strong>{openCount === null ? "—" : openCount}</strong><small>Competições abertas</small></span>
            </Link>
            <Link href="/learn" className={styles.metric}>
              <span className={styles.metricIcon}><BookOpen size={27} /></span>
              <span><strong>{learningCount}</strong><small>Trilhas iniciadas</small></span>
            </Link>
          </div>

          {doneCount < 4 ? <section className={styles.journeyPanel} aria-labelledby="journey-title">
            <div className={styles.journeyTop}>
              <div className={styles.journeyIntro}>
                <span className={styles.journeyIcon}><Layers3 size={28} /></span>
                <span><h2 id="journey-title">Sua jornada no Envista</h2><p>Acompanhe suas conquistas e descubra seu próximo passo.</p></span>
              </div>
              <div className={styles.journeySummary}>
                <span>{currentStep ? <>Etapa atual: <strong>{currentStep.label}</strong></> : <strong>Jornada concluída!</strong>}</span>
                <div><span className={styles.progressTrack}><i style={{ width: journeyPercent + "%" }} /></span><small>{doneCount} de 4 etapas</small></div>
              </div>
            </div>
            <div className={styles.journeySteps}>
              <div className={styles.journeyLine} aria-hidden="true"><span style={{ width: journeyPercent + "%" }} /></div>
              {journey.map((step, index) => (
                <Link
                  href={step.href}
                  key={step.label}
                  className={styles.journeyStep + (step.done ? " " + styles.stepDone : "") + (index === firstPending ? " " + styles.stepActive : "")}
                >
                  <span className={styles.stepBubble}>{step.done ? <Check size={23} strokeWidth={2.7} /> : index + 1}</span>
                  <strong>{step.label}</strong>
                  <small>{step.done ? "Concluído" : step.detail}</small>
                </Link>
              ))}
            </div>
          </section> : null}

          <div className={styles.contentGrid}>
            <section className={styles.panel} aria-label="Meus projetos">
              <PanelHeading icon={FolderKanban} title="Meus projetos" href="/app/projects" />
              {topProjects.length ? (
                <div className={styles.projectList}>
                  {topProjects.map((project, index) => (
                    <Link className={styles.projectRow} key={project.id} href={"/projects/" + encodeURIComponent(project.slug)}>
                      <span className={styles.projectIcon}>{index === 0 ? <Code2 size={24} /> : <Leaf size={24} />}</span>
                      <span className={styles.projectInfo}>
                         <span className={styles.projectCategory}>{project.category || "Projeto"}</span>
                         <strong>{project.title}</strong>
                         <small className={styles.projectDescription}>{project.short_description || "Acompanhe a evolução e os próximos passos deste projeto."}</small>
                         <small className={styles.projectStage}><span className={styles.statusDot} />{project.stage || "Em desenvolvimento"}</small>
                       </span>
                      <span className={styles.projectArrow}><ArrowRight size={17} /></span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.projectEmpty}><span><Rocket size={30} /></span><strong>Seu primeiro projeto começa aqui</strong><p>Crie uma ideia e acompanhe sua evolução neste espaço.</p></div>
              )}
              <Link className={styles.createOutline} href="/app/projects/new"><Plus size={17} /> Criar novo projeto</Link>
            </section>

            <section className={styles.panel} aria-label="Competições em destaque">
              <PanelHeading icon={Trophy} title="Competições em destaque" href="/competitions" />
              {featuredCompetition ? (
                <Link href={"/competitions/" + encodeURIComponent(featuredCompetition.slug)} className={styles.competitionCard}>
                  <div className={styles.competitionMain}>
                    <span className={styles.competitionIcon}><Trophy size={27} /></span>
                    <span><strong>{featuredCompetition.name}</strong><small>{featuredCompetition.description || "Descubra os detalhes e participe deste desafio."}</small></span>
                  </div>
                  <span className={styles.competitionBadge}>{featuredCompetition.status === "OPEN" ? "Inscrições abertas" : "Em breve"}</span>
                  <div className={styles.competitionMeta}>
                    <span><CalendarDays size={16} /> {competitionDate(featuredCompetition)}</span>
                    {featuredCompetition.participation ? <span><Users size={16} /> {featuredCompetition.participation}</span> : null}
                    {featuredCompetition.prize ? <span><Star size={16} /> Prêmios</span> : null}
                  </div>
                </Link>
              ) : (
                <div className={styles.competitionEmpty}><Trophy size={28} /><strong>{competitionFailed ? "Não foi possível carregar as competições" : competitions ? "Nenhuma competição aberta no momento" : "Buscando competições..."}</strong><Link href="/competitions">Explorar desafios <ArrowRight size={15} /></Link></div>
              )}
            </section>

            <section className={styles.learnPanel}>
              <div className={styles.learnCopy}>
                <h2>Continue aprendendo</h2>
                <p>{course ? course.title + (courseProgress > 0 ? " · " + courseProgress + "% concluído" : "") : "Tutoriais, guias e conteúdos práticos para desenvolver seus projetos e habilidades."}</p>
                <Link className={styles.learnAction} href={courseLink}>{course ? "Continuar trilha" : "Explorar conteúdos"} <ArrowRight size={16} /></Link>
              </div>
              <img src="/brand/envista-dashboard-laptop.svg" alt="" width="1400" height="900" aria-hidden="true" />
            </section>
          </div>

          <section className={styles.connectionsPanel} aria-labelledby="connections-title">
            <div className={styles.connectionsHead}>
              <div>
                <h2 id="connections-title"><Users size={22} aria-hidden="true" /> Pessoas para se conectar</h2>
                <p>Amplie sua rede com pessoas e competências complementares às suas.</p>
              </div>
              <Link href="/explore" className={styles.connectionsMore}>Explorar pessoas <ArrowRight size={15} /></Link>
            </div>
            {suggestedPeople.length ? <div className={styles.peopleGrid}>
              {suggestedPeople.map(person => <Link key={person.id} className={styles.personCard}
                href={"/" + (person.role === "investor" ? "investors" : "participants") + "/" + encodeURIComponent(person.username)}>
                <span className={styles.personAvatar} aria-hidden="true">{person.display_name.trim().slice(0, 1).toUpperCase()}</span>
                <span className={styles.personInfo}>
                  <strong>{person.display_name}</strong>
                  <small>{person.interest_tags?.slice(0, 2).join(" · ") || person.bio || "Conheça este perfil"}</small>
                </span>
                <span className={styles.personAction}><Plus size={14} /> Ver perfil</span>
              </Link>)}
            </div> : <div className={styles.peopleEmpty}>
              <span className={styles.peopleEmptyIcon}><Users size={24} aria-hidden="true" /></span>
              <span><strong>Novas conexões começam por aqui.</strong><small>Descubra pessoas e equipes que compartilham seus interesses.</small></span>
              <Link href="/explore">Explorar comunidade <ArrowRight size={16} /></Link>
            </div>}
          </section>
        </div>

        <aside className={styles.rail} aria-label="Agenda, calendário e próximos eventos">
          <section className={styles.nextEventPanel}>
            <div className={styles.railHeading}><h2><CalendarDays size={21} /> Próximo evento</h2><Link href="/calendar">Ver agenda <ArrowRight size={14} /></Link></div>
            {nearestEvent ? <EventRow event={nearestEvent} /> :
              <div className={styles.eventEmpty}><CalendarDays size={21} /><span>Sem eventos próximos no calendário.</span><Link href="/calendar">Abrir agenda</Link></div>}
          </section>

          <MonthCalendar todayISO={todayISO} agenda={agenda} />

          <section className={styles.eventListPanel}>
            <div className={styles.railHeading}><h2>Próximos eventos ({upcoming.length})</h2><Link href="/calendar" aria-label="Ver todos os eventos"><ArrowRight size={17} /></Link></div>
            {upcoming.length ? upcoming.slice(0, 3).map(event => <EventRow key={event.id} event={event} small />) :
              <div className={styles.eventsEmpty}><CalendarDays size={23} /><p>Assim que houver eventos cadastrados, eles aparecerão aqui.</p></div>}
          </section>
            <section className={styles.railOpportunitiesPanel} aria-label="Oportunidades para você">
              <PanelHeading icon={Sparkles} title="Oportunidades para você" href="/explore" action="Ver todas" />
              <div className={styles.opportunityTiles}>
                <Link href="/competitions" className={styles.tile}><Trophy size={30} /><span>Competições</span></Link>
                <Link href="/teams" className={styles.tile + " " + styles.tileBlue}><Users size={30} /><span>Equipes</span></Link>
                <Link href="/learn" className={styles.tile + " " + styles.tileViolet}><BookOpen size={30} /><span>Conteúdos</span></Link>
                <Link href="/explore" className={styles.tile + " " + styles.tileGold}><Star size={30} /><span>Descobrir</span></Link>
              </div>
            </section>
        </aside>
      </div>
    </div>
  );
}
