import Link from "next/link";
import ProjectArtwork from "./ProjectArtwork";
import HomeOpportunities from "./HomeOpportunities";
import {
  ArrowRight,
  FolderKanban,
  MessageCircle,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

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
type DashboardTeam = {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  tags: string[];
};
type DashboardNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};
type Props = {
  name: string;
  projects: DashboardProject[];
  teams: DashboardTeam[];
  notifications: DashboardNotification[];
  course: { slug: string; title: string; description: string | null } | null;
  courseProgress: number;
};

function activityIcon(title: string) {
  if (/equipe|convite|integrante/i.test(title)) return Users;
  if (/competição|oportunidade/i.test(title)) return Trophy;
  if (/projeto|tarefa/i.test(title)) return FolderKanban;
  return MessageCircle;
}

function notificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function HomeDashboard({
  name,
  projects,
  teams,
  notifications,
  course,
  courseProgress,
}: Props) {
  const featured = projects[0];
  const unread = notifications.filter((item) => !item.read_at).length;
  const progress = Math.max(0, Math.min(100, courseProgress));
  const firstSteps = [
    {
      done: projects.length > 0,
      label: "Criar primeiro projeto",
      href: "/projects/new",
    },
    {
      done: teams.length > 0,
      label: "Entrar ou criar uma equipe",
      href: "/teams",
    },
    { done: Boolean(course), label: "Começar uma trilha", href: "/learn" },
  ];
  const completedSteps = firstSteps.filter((step) => step.done).length;
  return (
    <div className="dashboard-home">
      <div className="page-head dashboard-welcome">
        <div>
          <h1>
            Olá, <span>{name.split(" ")[0]}.</span>
          </h1>
          <p>Suas ideias em movimento. Veja o que acontece no seu Envista.</p>
        </div>
        <Link className="primary" href="/projects/new">
          <Plus size={18} aria-hidden="true" />
          Novo projeto
        </Link>
      </div>
      <div className="dashboard-summary" aria-label="Resumo da sua conta">
        <Link href="/projects">
          <FolderKanban size={17} aria-hidden="true" />
          <b>{projects.length}</b> projetos recentes
        </Link>
        <Link href="/teams">
          <Users size={17} aria-hidden="true" />
          <b>{teams.length}</b> {teams.length === 1 ? "equipe" : "equipes"}
        </Link>
        <Link href="/notifications">
          <MessageCircle size={17} aria-hidden="true" />
          <b>{unread}</b> {unread === 1 ? "notificação não lida" : "notificações não lidas"}
        </Link>
      </div>
      {completedSteps < firstSteps.length ? (
        <details className="dashboard-first-steps">
          <summary>
            Primeiros passos{" "}
            <span>
              {completedSteps}/{firstSteps.length} concluídos
            </span>
          </summary>
          <div>
            {firstSteps.map((step) => (
              <Link href={step.href} key={step.href}>
                <span aria-hidden="true">{step.done ? "✓" : "○"}</span>
                {step.label}
                <small>{step.done ? "Concluído" : "Começar"}</small>
              </Link>
            ))}
          </div>
        </details>
      ) : null}
      <div className="dashboard-focus-grid">
        <section
          className="panel dashboard-featured"
          aria-labelledby="featured-title"
        >
          <div className="panel-title">
            <h2 id="featured-title">
              <Sparkles size={19} aria-hidden="true" />
              {featured
                ? "Seu projeto em destaque"
                : "Sua próxima ideia começa aqui"}
            </h2>
          </div>
          {featured ? (
            <>
              <div className="dashboard-featured-body">
                <ProjectArtwork title={featured.title} category={featured.category} large />
                <div className="grow">
                  <div className="dashboard-featured-title">
                    <h3>{featured.title}</h3>
                    <span className="stage">{featured.stage}</span>
                  </div>
                  <p>
                    {featured.short_description ||
                      "Dê o próximo passo e compartilhe a evolução da sua ideia."}
                  </p>
                  <div className="chips compact">
                    <span>{featured.category || "Projeto"}</span>
                    {(featured.tags || []).slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="actions">
                <Link
                  className="primary"
                  href={`/projects/${encodeURIComponent(featured.slug)}`}
                >
                  Abrir projeto
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="secondary" href="/workspace">
                  <Users size={17} aria-hidden="true" />
                  Ver workspace
                </Link>
              </div>
            </>
          ) : (
            <div className="dashboard-featured-empty">
              <img src="/brand/envista-symbol-gradient.svg" alt="" />
              <div>
                <h3>Transforme uma ideia em projeto.</h3>
                <p>
                  Organize o que está construindo, reúna sua equipe e mostre sua
                  evolução.
                </p>
                <Link className="primary" href="/projects/new">
                  Criar meu primeiro projeto
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </section>
        <section
          className="panel dashboard-activity"
          aria-labelledby="activity-title"
        >
          <div className="panel-title">
            <h2 id="activity-title">
              <Zap size={19} aria-hidden="true" />
              Acontecendo agora
            </h2>
            <Link className="text-btn" href="/activity">
              Ver tudo
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {notifications.length ? (
            notifications.map((item) => {
              const Icon = activityIcon(item.title);
              const timestamp = notificationDate(item.created_at);
              return (
              <Link
                className="activity-item"
                href={item.href || "/notifications"}
                key={item.id}
              >
                <i aria-hidden="true">
                  <Icon size={18} />
                </i>
                <div>
                  <b>{item.title}</b>
                  <small>
                    {item.body || "Confira essa atualização na sua conta."}
                  </small>
                  {timestamp && <time dateTime={item.created_at}>{timestamp}</time>}
                </div>
              </Link>
            );})
          ) : (
            <div className="dashboard-activity-empty">
              <MessageCircle size={27} aria-hidden="true" />
              <h3>Tudo em dia por aqui.</h3>
              <p>Novos convites e atualizações aparecerão neste espaço.</p>
              <Link className="text-btn" href="/social">
                Conhecer a comunidade
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>
      <section className="section-block" aria-labelledby="projects-title">
        <div className="section-row">
          <h2 id="projects-title">
            <FolderKanban size={22} aria-hidden="true" />
            Seus projetos
          </h2>
          <Link className="text-btn" href="/projects">
            Ver todos
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {projects.length ? (
          <div className="dashboard-project-grid">
            {projects.slice(0, 6).map((project) => (
              <article className="panel dashboard-project" key={project.id}>
                <ProjectArtwork title={project.title} category={project.category} />
                <div className="grow">
                  <div className="dashboard-project-title">
                    <h3>
                      <Link
                        href={`/projects/${encodeURIComponent(project.slug)}`}
                      >
                        {project.title}
                      </Link>
                    </h3>
                    <span className="stage">{project.stage}</span>
                  </div>
                  <p>
                    {project.short_description ||
                      "Continue desenvolvendo sua ideia."}
                  </p>
                  <small>
                    {project.category || "Projeto"}
                    {project.location ? ` · ${project.location}` : ""}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <FolderKanban size={28} aria-hidden="true" />
            <h3>Seu portfólio começa com um projeto.</h3>
            <p>
              Vale um trabalho da faculdade, um experimento ou uma ideia que
              você quer tirar do papel.
            </p>
            <Link className="secondary" href="/projects/new">
              Adicionar projeto
            </Link>
          </div>
        )}
      </section>
      <HomeOpportunities />
      <section className="section-block" aria-labelledby="teams-title">
        <div className="section-row">
          <h2 id="teams-title">
            <Users size={22} aria-hidden="true" />
            Suas equipes
          </h2>
          <Link className="text-btn" href="/teams">
            Gerenciar equipes
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {teams.length ? (
          <div className="dashboard-team-grid">
            {teams.slice(0, 6).map((team) => (
              <Link
                className="panel dashboard-team"
                href={`/teams/${encodeURIComponent(team.slug)}`}
                key={team.id}
              >
                <span className="avatar" aria-hidden="true">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="grow">
                  <h3>{team.name}</h3>
                  <p>{team.description || "Construindo juntos no Envista."}</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Users size={28} aria-hidden="true" />
            <h3>Boas ideias crescem em equipe.</h3>
            <p>
              Crie sua equipe ou explore a comunidade para conhecer outros
              participantes.
            </p>
            <div className="actions">
              <Link className="secondary" href="/teams/new">
                Criar equipe
              </Link>
              <Link className="text-btn" href="/explore">
                Explorar a comunidade
              </Link>
            </div>
          </div>
        )}
      </section>
      <section
        className="panel dashboard-learning"
        aria-labelledby="learning-title"
      >
        <img className="dashboard-learning-art" src="/brand/learning-books.svg" alt="" width="320" height="200" loading="lazy" />
        <div className="grow">
          <span className="dashboard-learning-label">
            {course ? "Continue aprendendo" : "Aprenda e coloque em prática"}
          </span>
          <h2 id="learning-title">
            {course?.title || "Encontre sua próxima trilha."}
          </h2>
          <p>
            {course?.description ||
              "Conhecimento para dar o próximo passo no seu projeto."}
          </p>
          {course ? (
            <div className="dashboard-learning-progress">
              <div
                className="progress"
                role="progressbar"
                aria-label="Progresso do curso"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${progress}%` }} />
              </div>
              <small>{progress}% concluído</small>
            </div>
          ) : null}
        </div>
        <Link
          className="primary"
          href={course ? `/learn/${encodeURIComponent(course.slug)}` : "/learn"}
        >
          {course ? "Continuar curso" : "Ver cursos"}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
