"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleUserRound,
  Compass,
  FileText,
  FolderKanban,
  GraduationCap,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
  ExternalLink,
  Upload,
  Bookmark,
  MapPin,
  Building2,
  Clock3,
  Play,
  CheckCircle2,
  UserPlus,
  Share2,
  Filter,
  Lightbulb,
  Rocket,
  School,
  Eye,
} from "lucide-react";
import {
  adminUser,
  competitions,
  courses,
  investor,
  participant,
  people,
  projects as seedProjects,
  teams as seedTeams,
} from "@/data/mock";
import { Competition, Course, Project, Role, Team, User } from "@/types";

type ChatMessage = { from: string; text: string; time: string };
type MessageThreads = Record<string, ChatMessage[]>;
type SocialPost = { id: string; author: string; handle: string; body: string; likes: number; time: string; image?: string; comments?: Array<{id:string;author:string;text:string}> };
import { storage } from "@/lib/storage";
import { canFollowProject, getGreeting, normalizeSearch, toggleSocialPostLike, validateParticipantLocation } from "@/lib/mvp";

const navParticipant = [
  ["/app", Home, "Início"],
  ["/app/social", Activity, "Social"],
  ["/app/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Meus projetos"],
  ["/app/teams", Users, "Minhas equipes"],
  ["/app/competitions", Trophy, "Competições"],
  ["/app/learn", GraduationCap, "Aprender"],
  ["/app/messages", MessageCircle, "Mensagens"],
] as const;
const navInvestor = [
  ["/investor", Home, "Início"],
  ["/investor/social", Activity, "Social"],
  ["/investor/explore", Compass, "Explorar"],
  ["/investor/projects", FolderKanban, "Meus projetos"],
  ["/investor/teams", Users, "Minhas equipes"],
  ["/investor/competitions", Trophy, "Competições"],
  ["/investor/saved", Bookmark, "Projetos salvos"],
  ["/investor/following", Eye, "Seguindo"],
  ["/investor/messages", MessageCircle, "Mensagens"],
  ["/investor/profile", CircleUserRound, "Perfil"],
] as const;
const navAdmin = [
  ["/admin", Home, "Visão geral"],
  ["/admin/courses", GraduationCap, "Aulas"],
  ["/admin/content", FileText, "Conteúdo"],
  ["/admin/analytics", Eye, "Cliques e métricas"],
  ["/admin/moderation", CheckCircle2, "Moderação"],
] as const;

function cx(...v: (string | false | undefined)[]) {
  return v.filter(Boolean).join(" ");
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
}
function trackEvent(name:string) {
  const events = storage.get<Record<string,number>>("analytics-events", {});
  storage.set("analytics-events", {...events, [name]:(events[name] || 0) + 1});
}

export default function EnvistaApp() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>("participant");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  const [accountVersion, setAccountVersion] = useState(0);
  const [projectList, setProjectList] = useState<Project[]>(seedProjects);
  const [teamList, setTeamList] = useState<Team[]>(seedTeams);
  const [progress, setProgress] = useState<Record<string, string[]>>({
    c1: ["l1", "l2", "l3"],
  });
  const [messages, setMessages] = useState<MessageThreads>({
    atlas: [
      {
        from: "Ana Souza",
        text: "Atualizei os testes do Aqua. Depois dá uma olhada?",
        time: "14:20",
      },
      {
        from: "Você",
        text: "Boa. Vou revisar o dashboard também.",
        time: "14:24",
      },
    ],
    marina: [
      {
        from: "Marina Alves",
        text: "Olá! Gostaria de entender melhor como vocês validaram o Aqua.",
        time: "Ontem",
      },
    ],
  });
  const [notifications, setNotifications] = useState(() => storage.get("notifications", [
    {
      id: "n1",
      text: "Equipe Atlas convidou você para revisar uma atualização.",
      read: false,
    },
    {
      id: "n2",
      text: "Seu projeto Aqua recebeu um novo comentário.",
      read: false,
    },
    {
      id: "n3",
      text: "Sua inscrição no Envista Challenge foi confirmada.",
      read: true,
    },
  ]));
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setRole(storage.get<Role>("role", "participant"));
    setSaved(storage.get<string[]>("saved", []));
    setFollowing(storage.get<string[]>("following", []));
    setLikedProjects(storage.get<string[]>("liked-projects", []));
    setProjectList(storage.get<Project[]>("projects", seedProjects));
    setTeamList(storage.get<Team[]>("teams", seedTeams));
    setProgress(storage.get("progress", { c1: ["l1", "l2", "l3"] }));
    setMessages(storage.get("messages", messages));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const refresh=()=>setAccountVersion((value)=>value+1); window.addEventListener("envista-settings",refresh); return()=>window.removeEventListener("envista-settings",refresh)}, []);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "reduced-motion",
      Boolean(storage.get(`settings-${role}`, {reducedMotion:false}).reducedMotion),
    );
  }, [role, accountVersion]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2600);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const persistProjects = (v: Project[]) => {
    const changed = v.find((next) => {const previous=projectList.find((item)=>item.id===next.id);return previous && JSON.stringify(previous)!==JSON.stringify(next) && following.includes(next.id)});
    if (changed) setNotifications((current) => {const next=[{id:`update-${changed.id}-${Date.now()}`,text:`${changed.title} publicou um novo avanço.`,read:false},...current];storage.set("notifications",next);return next});
    setProjectList(v);
    storage.set("projects", v);
  };
  const persistTeams = (v: Team[]) => {
    setTeamList(v);
    storage.set("teams", v);
  };
  const toggleSaved = (id: string) => {
    const v = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(v);
    storage.set("saved", v);
    trackEvent(v.includes(id) ? "project_save" : "project_unsave");
    setToast(
      v.includes(id) ? "Projeto salvo." : "Projeto removido dos salvos.",
    );
  };
  const toggleFollowing = (id: string) => {
    const v = following.includes(id)
      ? following.filter((x) => x !== id)
      : [...following, id];
    setFollowing(v);
    storage.set("following", v);
    trackEvent(v.includes(id) ? "project_follow" : "project_unfollow");
    if (v.includes(id)) {
      const project = projectList.find((item) => item.id === id);
      setNotifications((current) => {const next=[{id:`follow-${id}`, text:`Você agora receberá novidades, arquivos e competições de ${project?.title || "este projeto"}.`, read:false}, ...current.filter((item) => item.id !== `follow-${id}`)];storage.set("notifications",next);return next});
    }
    setToast(
      v.includes(id)
        ? "Agora você segue este projeto e receberá notificações de avanços."
        : "Você deixou de seguir este projeto.",
    );
  };
  const toggleProjectLike = (id:string) => {const next=likedProjects.includes(id)?likedProjects.filter((item)=>item!==id):[...likedProjects,id];setLikedProjects(next);storage.set("liked-projects",next);trackEvent(next.includes(id)?"project_like":"project_unlike")};
  const completeLesson = (courseId: string, lessonId: string) => {
    const v = {
      ...progress,
      [courseId]: Array.from(
        new Set([...(progress[courseId] || []), lessonId]),
      ),
    };
    setProgress(v);
    storage.set("progress", v);
    trackEvent("course_complete");
    setToast("Aula concluída e progresso salvo.");
  };

  if (!ready)
    return (
      <div className="splash">
        <img src="/envista-logo.png" alt="Envista" />
        <span>Envista</span>
      </div>
    );

  const publicRoute =
    pathname === "/admin/login" ||
    !pathname.startsWith("/app") &&
    !pathname.startsWith("/investor") &&
    !pathname.startsWith("/admin");
  if (publicRoute)
    return (
      <PublicArea
        pathname={pathname}
        go={router.push}
        setRole={(r) => {
          setRole(r);
          storage.set("role", r);
        }}
      />
    );

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && role !== "admin") {
    router.replace("/admin/login");
    return <div className="splash"><img src="/envista-logo.png" alt="Envista"/><span>Envista</span></div>;
  }
  const activeRole: Role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/investor")
      ? "investor"
      : "participant";
  if (activeRole !== role) {
    setTimeout(() => {
      setRole(activeRole);
      storage.set("role", activeRole);
    }, 0);
  }
  const baseMe =
    activeRole === "investor"
      ? investor
      : activeRole === "admin"
        ? adminUser
        : participant;
  const accountSettings = storage.get(`settings-${activeRole}`, {name:baseMe.name,username:baseMe.username});
  void accountVersion;
  const me = {...baseMe,name:accountSettings.name || baseMe.name,username:accountSettings.username || baseMe.username};
  const nav =
    activeRole === "investor"
      ? navInvestor
      : activeRole === "admin"
        ? navAdmin
        : navParticipant;

  const logout = () => {
    storage.remove("role");
    router.push("/login");
  };

  return (
    <div className="app-shell">
      <aside className={cx("sidebar", mobileOpen && "mobile-open")}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
        <button
          className="brand"
          onClick={() =>
            router.push(
              activeRole === "admin"
                ? "/admin"
                : activeRole === "investor"
                  ? "/investor"
                  : "/app",
            )
          }
        >
          <img src="/envista-logo.png" alt="" />
          <b>Envista</b>
        </button>
        <nav>
          {nav.map(([href, Icon, label]) => (
            <button
              key={href}
              onClick={() => {
                router.push(href);
                setMobileOpen(false);
              }}
              className={cx(pathname === href && "active")}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {activeRole === "participant" && (
          <div className="side-section">
            <span>Configurações</span>
            <button onClick={() => router.push("/app/profile/lucasfer")}>
              <CircleUserRound size={18} />
              Perfil
            </button>
            <button onClick={() => router.push("/app/settings#preferences")}>
              <Settings size={18} />
              Preferências
            </button>
            <button onClick={() => router.push("/app/settings#notifications")}>
              <Bell size={18} />
              Notificações
            </button>
          </div>
        )}
        <div className="side-bottom">
          {activeRole !== "participant" && <button
            onClick={() =>
              router.push(
                activeRole === "admin"
                  ? "/admin/settings"
                  : activeRole === "investor"
                    ? "/investor/settings"
                    : "/app/settings",
              )
            }
          >
            <Settings size={18} />
            Configurações
          </button>}
          <div className="user-card">
            <button
              className="profile-avatar-btn"
              aria-label="Abrir meu perfil"
              title="Abrir meu perfil"
              onClick={() => router.push(activeRole === "participant" ? "/app/profile/lucasfer" : activeRole === "investor" ? "/investor/profile" : "/admin/settings")}
            >
              <Avatar name={me.name} />
            </button>
            <div>
              <b>{me.name}</b>
              <small>
                @{me.username} ·{" "}
                {activeRole === "admin"
                  ? "Admin"
                  : activeRole === "investor"
                    ? "Investidor"
                    : "Participante"}
              </small>
            </div>
            <button aria-label="Sair" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>
          <button
            className="global-search"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={17} />
            <span>Buscar no Envista</span>
          </button>
          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => setNotifyOpen((v) => !v)}
            >
              <Bell size={19} />
              {notifications.some((n) => !n.read) && <i />}
            </button>
            <button
              className="profile-avatar-btn"
              aria-label="Abrir meu perfil"
              title="Abrir meu perfil"
              onClick={() => router.push(activeRole === "participant" ? "/app/profile/lucasfer" : activeRole === "investor" ? "/investor/profile" : "/admin/settings")}
            >
              <Avatar name={me.name} />
            </button>
          </div>
          {notifyOpen && (
            <div className="popover notifications">
              <div className="popover-head">
                <b>Notificações</b>
                <button
                  onClick={() =>
                    {const next=notifications.map((n) => ({ ...n, read: true }));setNotifications(next);storage.set("notifications",next)}
                  }
                >
                  Marcar como lidas
                </button>
              </div>
              {notifications.map((n) => (
                <div
                  className={cx("notification", !n.read && "unread")}
                  key={n.id}
                >
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="page-wrap">
          <RouteView
            pathname={pathname}
            role={activeRole}
            me={me}
            go={router.push}
            projects={projectList}
            teams={teamList}
            saved={saved}
            following={following}
            likedProjects={likedProjects}
            progress={progress}
            messages={messages}
            toggleSaved={toggleSaved}
            toggleFollowing={toggleFollowing}
            toggleProjectLike={toggleProjectLike}
            completeLesson={completeLesson}
            setMessages={(v: MessageThreads) => {
              setMessages(v);
              storage.set("messages", v);
            }}
            setToast={setToast}
            persistProjects={persistProjects}
            persistTeams={persistTeams}
          />
        </div>
      </main>

      {commandOpen && (
        <CommandPalette
          close={() => setCommandOpen(false)}
          go={(p) => {
            router.push(p);
            setCommandOpen(false);
          }}
          projects={projectList}
          teams={teamList}
        />
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      <nav className="bottom-nav">
        {nav.slice(0, 5).map(([href, Icon, label]) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={cx(pathname === href && "active")}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function PublicArea({
  pathname,
  go,
  setRole,
}: {
  pathname: string;
  go: (p: string) => void;
  setRole: (r: Role) => void;
}) {
  if (pathname === "/login") return <Login go={go} setRole={setRole} />;
  if (pathname === "/admin/login")
    return <AdminLogin go={go} setRole={setRole} />;
  if (pathname === "/register") return <Register go={go} setRole={setRole} />;
  if (pathname === "/about") return <About go={go} />;
  if (pathname === "/schools") return <Schools go={go} />;
  return <Landing go={go} />;
}

function Landing({ go }: { go: (p: string) => void }) {
  return (
    <div className="public-page">
      <PublicHeader go={go} />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ECOSSISTEMA DE INOVAÇÃO</span>
          <h1>Ideias não deveriam terminar depois da competição.</h1>
          <p>
            O Envista conecta aprendizado, equipes, projetos, competições e
            oportunidades em um único ecossistema.
          </p>
          <div className="actions">
            <button className="primary" onClick={() => go("/register")}>
              Começar agora <ArrowRight size={17} />
            </button>
            <button className="secondary" onClick={() => go("/about")}>
              Conhecer o Envista
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit-card big">
            <Rocket />
            <b>Construa algo que continue.</b>
            <small>Aprender → equipe → projeto → oportunidade</small>
          </div>
          <div className="orbit-card">
            <Users />
            <b>Equipes reais</b>
          </div>
          <div className="orbit-card">
            <Trophy />
            <b>Competições</b>
          </div>
        </div>
      </section>
      <section className="public-section">
        <span className="section-kicker">COMO FUNCIONA</span>
        <h2>Um próximo passo para cada boa ideia.</h2>
        <div className="four-grid">
          {[
            [BookOpen, "Aprenda", "Conteúdo aplicado a projetos reais."],
            [Users, "Construa", "Forme equipes e desenvolva em conjunto."],
            [Eye, "Mostre", "Publique projetos como portfólio vivo."],
            [Sparkles, "Evolua", "Encontre competições e oportunidades."],
          ].map(([I, t, d]: any) => (
            <div className="feature" key={t}>
              <I />
              <b>{t}</b>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="public-section">
        <div className="section-row">
          <div>
            <span className="section-kicker">PROJETOS</span>
            <h2>Veja o que está sendo construído.</h2>
          </div>
          <button className="text-btn" onClick={() => go("/login")}>
            Explorar projetos <ArrowRight size={16} />
          </button>
        </div>
        <div className="project-grid">
          {seedProjects.slice(0, 3).map((p) => (
            <ProjectCard key={p.id} p={p} go={() => go("/login")} />
          ))}
        </div>
      </section>
      <section className="split-public">
        <div>
          <School />
          <h2>Para escolas</h2>
          <p>
            Metodologia, equipes, projetos e continuidade para transformar
            aprendizagem em construção.
          </p>
          <button className="secondary" onClick={() => go("/schools")}>
            Conhecer programa
          </button>
        </div>
        <div>
          <BriefcaseBusiness />
          <h2>Para investidores</h2>
          <p>
            Descubra equipes e projetos em evolução sem rankings financeiros
            artificiais.
          </p>
          <button className="secondary" onClick={() => go("/login")}>
            Acessar como investidor
          </button>
        </div>
      </section>
      <section className="final-cta">
        <h2>Existe uma ideia esperando pelo próximo passo.</h2>
        <button className="primary" onClick={() => go("/login")}>
          Entrar no Envista
        </button>
      </section>
    </div>
  );
}
function PublicHeader({ go }: { go: (p: string) => void }) {
  return (
    <header className="public-header">
      <button className="brand" onClick={() => go("/")}>
        <img src="/envista-logo.png" alt="" />
        <b>Envista</b>
      </button>
      <nav>
        <button onClick={() => go("/about")}>Sobre</button>
        <button onClick={() => go("/schools")}>Para escolas</button>
        <button onClick={() => go("/login")}>Entrar</button>
        <button className="primary small" onClick={() => go("/register")}>
          Criar conta
        </button>
      </nav>
    </header>
  );
}

function Login({
  go,
  setRole,
}: {
  go: (p: string) => void;
  setRole: (r: Role) => void;
}) {
  const [r, setR] = useState<Role>("participant");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const enter = (role = r) => {
    setRole(role);
    go(role === "participant" ? "/app" : "/investor");
  };
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <button className="brand" onClick={() => go("/")}>
          <img src="/envista-logo.png" alt="" />
          <b>Envista</b>
        </button>
        <div>
          <span className="eyebrow">ENVISTA</span>
          <h1>Ideias não deveriam terminar depois da competição.</h1>
          <p>
            Aprenda, construa, encontre sua equipe, publique projetos e
            transforme boas ideias em oportunidades reais.
          </p>
        </div>
        <div className="auth-symbol">E</div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h2>Entrar no Envista</h2>
          <p>Como você deseja acessar?</p>
          <div className="role-grid">
            <button
              className={cx(r === "participant" && "selected")}
              onClick={() => setR("participant")}
            >
              <Users />
              <b>Participante</b>
              <small>Para alunos, criadores e integrantes de equipes.</small>
            </button>
            <button
              className={cx(r === "investor" && "selected")}
              onClick={() => setR("investor")}
            >
              <BriefcaseBusiness />
              <b>Investidor</b>
              <small>Para descobrir e acompanhar projetos com potencial.</small>
            </button>
          </div>
          <label>
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </label>
          <label>
            Senha
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </label>
          <button className="primary full" onClick={() => enter()}>
            Entrar
          </button>
          <button className="link-btn" onClick={() => setRecoverySent(true)}>
            Esqueci minha senha
          </button>
          {recoverySent && (
            <p className="form-feedback" role="status">
              Instruções de recuperação simuladas para este MVP.
            </p>
          )}
          <div className="divider">
            <span>ou entre como demonstração</span>
          </div>
          <div className="demo-row">
            <button onClick={() => enter("participant")}>
              Demo Participante
            </button>
            <button onClick={() => enter("investor")}>Demo Investidor</button>
          </div>
          <p className="auth-foot">
            Ainda não tem conta?{" "}
            <button onClick={() => go("/register")}>Criar conta</button>
          </p>
        </div>
      </div>
    </div>
  );
}
function AdminLogin({
  go,
  setRole,
}: {
  go: (p: string) => void;
  setRole: (r: Role) => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const enterAdmin = () => {
    if (!email.trim() || !pass.trim()) return setError("Preencha e-mail e senha para entrar.");
    setError(""); setRole("admin"); go("/admin");
  };
  return (
    <div className="simple-auth">
      <button className="brand" onClick={() => go("/")}>
        <img src="/envista-logo.png" alt="" />
        <b>Envista</b>
      </button>
      <div className="onboard-card">
        <span className="eyebrow">ACESSO ADMINISTRATIVO</span>
        <h1>Painel Envista</h1>
        <p>
          Área reservada para publicação de aulas, moderação, métricas e
          administração da plataforma.
        </p>
        <label>
          E-mail administrativo
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="admin@envista.com"
          />
        </label>
        <label>
          Senha
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            placeholder="••••••••"
          />
        </label>
        <button
          className="primary full"
          onClick={enterAdmin}
        >
          Entrar como administrador
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="security-note">
          Este formulário ainda é visual. O backend Java já está estruturado
          para trocar isso por autenticação real e autorização por role no
          Supabase.
        </p>
      </div>
    </div>
  );
}

function Register({
  go,
  setRole,
}: {
  go: (p: string) => void;
  setRole: (r: Role) => void;
}) {
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Role>("participant");
  const [name, setName] = useState("");
  const [participantCity, setParticipantCity] = useState("");
  const [participantState, setParticipantState] = useState("");
  const [validationError, setValidationError] = useState("");
  const nextStep = () => {
    if (r === "participant" && step === 2 && !validateParticipantLocation(participantCity, participantState)) {
      setValidationError("Preencha Cidade e Estado para continuar.");
      return;
    }
    setValidationError("");
    setStep((current) => current + 1);
  };
  if (step === 0)
    return (
      <div className="simple-auth">
        <button className="brand" onClick={() => go("/")}>
          <img src="/envista-logo.png" alt="" />
          <b>Envista</b>
        </button>
        <div className="onboard-card">
          <span className="eyebrow">CRIAR CONTA</span>
          <h1>Como você fará parte do Envista?</h1>
          <div className="role-grid">
            <button
              className={cx(r === "participant" && "selected")}
              onClick={() => setR("participant")}
            >
              <Users />
              <b>Participante</b>
              <small>Aprender, formar equipes e construir projetos.</small>
            </button>
            <button
              className={cx(r === "investor" && "selected")}
              onClick={() => setR("investor")}
            >
              <BriefcaseBusiness />
              <b>Investidor</b>
              <small>Descobrir, acompanhar e conversar com projetos.</small>
            </button>
          </div>
          <button className="primary full" onClick={() => setStep(1)}>
            Continuar
          </button>
        </div>
      </div>
    );
  return (
    <div className="simple-auth">
      <button className="brand" onClick={() => go("/")}>
        <img src="/envista-logo.png" alt="" />
        <b>Envista</b>
      </button>
      <div className="onboard-card">
        <div className="stepper">
          <i className="done" />
          <i className={cx(step >= 2 && "done")} />
          <i className={cx(step >= 3 && "done")} />
          <i className={cx(step >= 4 && "done")} />
        </div>
        {r === "participant" ? (
          <ParticipantOnboarding step={step} name={name} setName={setName} city={participantCity} state={participantState} setCity={setParticipantCity} setState={setParticipantState} />
        ) : (
          <InvestorOnboarding step={step} name={name} setName={setName} />
        )}
        <div className="onboard-actions">
          <button
            className="secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            Voltar
          </button>
          {validationError && <p className="form-error" role="alert">{validationError}</p>}
          {step < 4 ? (
            <button className="primary" onClick={nextStep}>
              Continuar
            </button>
          ) : (
            <button
              className="primary"
              onClick={() => {
                setRole(r);
                go(r === "participant" ? "/app" : "/investor");
              }}
            >
              Entrar no Envista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function ParticipantOnboarding({
  step,
  name,
  setName,
  city,
  state,
  setCity,
  setState,
}: {
  step: number;
  name: string;
  setName: (s: string) => void;
  city: string;
  state: string;
  setCity: (s: string) => void;
  setState: (s: string) => void;
}) {
  if (step === 1)
    return (
      <>
        <span className="eyebrow">ETAPA 1 DE 4</span>
        <h1>Vamos criar seu perfil.</h1>
        <label>
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </label>
        <label>
          Username
          <input placeholder="@seuusername" />
        </label>
      </>
    );
  if (step === 2)
    return (
      <>
        <span className="eyebrow">ETAPA 2 DE 4</span>
        <h1>Conte um pouco sobre você.</h1>
        <div className="form-grid">
          <label>
            Escola <small className="optional">opcional</small>
            <input placeholder="Sua instituição" />
          </label>
          <label>
            Cidade <b className="required">obrigatório</b>
            <input required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Rio de Janeiro" />
          </label>
          <label>
            Estado <b className="required">obrigatório</b>
            <input required value={state} onChange={(event) => setState(event.target.value)} placeholder="RJ" />
          </label>
          <label>
            Área de interesse <small className="optional">opcional</small>
            <input placeholder="Tecnologia" />
          </label>
        </div>
        <label>
          Bio <small className="optional">opcional</small>
          <textarea placeholder="O que você gosta de construir?" />
        </label>
      </>
    );
  if (step === 3)
    return (
      <>
        <span className="eyebrow">ETAPA 3 DE 4</span>
        <h1>Quais habilidades você traz?</h1>
        <ChipPicker
          values={[
            "Programação",
            "Robótica",
            "Design",
            "Eletrônica",
            "Marketing",
            "Gestão",
            "Pesquisa",
            "IA",
            "Engenharia",
          ]}
        />
      </>
    );
  return (
    <>
      <span className="eyebrow">ETAPA 4 DE 4</span>
      <h1>O que você quer fazer primeiro?</h1>
      <ChipPicker
        values={[
          "Criar projetos",
          "Encontrar equipe",
          "Aprender",
          "Competir",
          "Encontrar oportunidades",
        ]}
      />
    </>
  );
}
function InvestorOnboarding({
  step,
  name,
  setName,
}: {
  step: number;
  name: string;
  setName: (s: string) => void;
}) {
  const [orgType, setOrgType] = useState("Pessoa física");
  if (step === 1)
    return (
      <>
        <span className="eyebrow">ETAPA 1 DE 4</span>
        <h1>Seu perfil profissional.</h1>
        <label>
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </label>
        <label>
          Tipo de organização
          <select
            className="organization-type-select"
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
          >
            <option>Pessoa física</option>
            <option>Empresa</option>
            <option>Startup</option>
            <option>Instituição de ensino</option>
            <option>Fundo de investimento</option>
            <option>ONG / Instituto</option>
            <option>Governo</option>
            <option>Outro</option>
          </select>
        </label>
        {orgType !== "Pessoa física" && (
          <label>
            Nome da organização
            <input placeholder="Nome da organização" />
          </label>
        )}
      </>
    );
  if (step === 2)
    return (
      <>
        <span className="eyebrow">ETAPA 2 DE 4</span>
        <h1>Seu contexto.</h1>
        <div className="form-grid">
          <label>
            Cargo <small className="optional">opcional</small>
            <input placeholder="Cargo" />
          </label>
          <label>
            Localização
            <input placeholder="São Paulo, SP" />
          </label>
        </div>
        <label>
          Descrição
          <textarea placeholder="Conte o que busca no ecossistema." />
        </label>
      </>
    );
  if (step === 3)
    return (
      <>
        <span className="eyebrow">ETAPA 3 DE 4</span>
        <h1>Setores de interesse.</h1>
        <ChipPicker
          values={[
            "Educação",
            "Tecnologia",
            "Sustentabilidade",
            "Saúde",
            "Mobilidade",
            "IA",
            "Robótica",
            "Energia",
          ]}
        />
      </>
    );
  return (
    <>
      <span className="eyebrow">ETAPA 4 DE 4</span>
      <h1>Estágio preferido.</h1>
      <ChipPicker
        values={["Ideia", "Validação", "Protótipo", "MVP", "Projeto ativo"]}
      />
    </>
  );
}
function ChipPicker({ values }: { values: string[] }) {
  const [v, setV] = useState<string[]>([]);
  return (
    <div className="chip-picker">
      {values.map((x) => (
        <button
          key={x}
          onClick={() =>
            setV(v.includes(x) ? v.filter((i) => i !== x) : [...v, x])
          }
          className={cx(v.includes(x) && "selected")}
        >
          {v.includes(x) && <Check size={15} />} {x}
        </button>
      ))}
    </div>
  );
}

function About({ go }: { go: (p: string) => void }) {
  return (
    <div className="public-page">
      <PublicHeader go={go} />
      <section className="text-hero">
        <span className="eyebrow">SOBRE O ENVISTA</span>
        <h1>Boas ideias precisam de um próximo passo.</h1>
        <p>
          O Envista nasceu dentro do ecossistema que quer fortalecer: escola,
          robótica, competições, projetos e aprendizado prático.
        </p>
      </section>
      <section className="story-grid">
        {[
          [
            "De onde viemos",
            "Os fundadores se conheceram no ensino médio, dentro do SESI SENAI e de uma equipe de robótica.",
          ],
          [
            "O problema que encontramos",
            "Projetos bons frequentemente perdiam continuidade quando a competição terminava.",
          ],
          [
            "O que estamos construindo",
            "Um ambiente que conecta aprendizado, equipes, projetos, competições e oportunidades.",
          ],
          [
            "Nossa visão",
            "Dar estrutura para jovens transformarem capacidade em projetos que continuam crescendo.",
          ],
        ].map(([t, d]) => (
          <article key={t}>
            <span>
              0
              {[
                "De onde viemos",
                "O problema que encontramos",
                "O que estamos construindo",
                "Nossa visão",
              ].indexOf(t) + 1}
            </span>
            <h2>{t}</h2>
            <p>{d}</p>
          </article>
        ))}
      </section>
      <section className="quote-section">
        <blockquote>
          “Existem muitos jovens com boas ideias. O que frequentemente falta é
          método, estrutura e oportunidade para transformar essas ideias em
          projetos que continuem crescendo.”
        </blockquote>
        <p>
          Uma percepção consolidada em anos de competições, apresentações e
          construção em equipe.
        </p>
      </section>
    </div>
  );
}
function Schools({ go }: { go: (p: string) => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="public-page">
      <PublicHeader go={go} />
      <section className="text-hero">
        <span className="eyebrow">ENVISTA PARA ESCOLAS</span>
        <h1>Transforme ideias dos seus alunos em projetos reais.</h1>
        <p>
          Uma metodologia para desenvolver criatividade, trabalho em equipe,
          comunicação, resolução de problemas e continuidade.
        </p>
      </section>
      <section className="four-grid public-section">
        {[
          [BookOpen, "Aulas", "Material didático próprio e aplicado."],
          [Users, "Equipes", "Formação de times de projetos inovadores."],
          [Trophy, "Competições", "Preparação para oportunidades e eventos."],
          [
            Rocket,
            "Continuidade",
            "Projetos continuam registrados e evoluindo.",
          ],
        ].map(([I, t, d]: any) => (
          <div className="feature" key={t}>
            <I />
            <b>{t}</b>
            <p>{d}</p>
          </div>
        ))}
      </section>
      <section className="school-form">
        <div>
          <span className="section-kicker">LEVE O ENVISTA</span>
          <h2>Construa essa jornada dentro da sua escola.</h2>
          <p>
            O formulário do MVP é apenas demonstrativo e não envia dados para um
            servidor.
          </p>
        </div>
        {sent ? (
          <div className="success-box">
            <CheckCircle2 />
            <h3>Interesse registrado no MVP.</h3>
            <p>
              Em uma versão com backend, esse contato seguiria para o time
              responsável.
            </p>
          </div>
        ) : (
          <div className="form-card">
            <label>
              Nome
              <input placeholder="Seu nome" />
            </label>
            <label>
              Escola / organização
              <input placeholder="Instituição" />
            </label>
            <label>
              E-mail
              <input placeholder="voce@escola.com" />
            </label>
            <label>
              Mensagem
              <textarea placeholder="Conte um pouco sobre o contexto da escola." />
            </label>
            <button className="primary" onClick={() => setSent(true)}>
              Quero levar o Envista para minha escola
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function RouteView(props: any) {
  const { pathname, role } = props;
  if (role === "admin") {
    if (pathname === "/admin/settings") return <SettingsPage {...props} />;
    return <AdminArea {...props} />;
  }
  if (role === "investor") {
    if (pathname === "/investor") return <InvestorHome {...props} />;
    if (pathname === "/investor/social") return <SocialFeed {...props} />;
    if (pathname === "/investor/explore")
      return <Explore {...props} investorMode />;
    if (pathname === "/investor/projects")
      return <InvestorProjects {...props} />;
    if (pathname === "/investor/teams") return <InvestorTeams {...props} />;
    if (pathname === "/investor/competitions")
      return <InvestorCompetitions {...props} />;
    if (pathname === "/investor/settings") return <SettingsPage {...props} />;
    if (pathname === "/investor/saved") return <SavedProjects {...props} />;
    if (pathname === "/investor/following")
      return <FollowingProjects {...props} />;
    if (pathname === "/investor/messages")
      return <Messages {...props} investorMode />;
    if (pathname === "/investor/profile")
      return <Profile {...props} user={investor} />;
    if (pathname.startsWith("/investor/projects/"))
      return (
        <ProjectDetail
          {...props}
          slug={pathname.split("/").pop()}
          investorMode
        />
      );
    if (pathname.startsWith("/investor/teams/"))
      return <InvestorTeamDetail {...props} slug={pathname.split("/").pop()} />;
    if (pathname.startsWith("/investor/competitions/"))
      return (
        <InvestorCompetitionDetail
          {...props}
          slug={pathname.split("/").pop()}
        />
      );
    return <InvestorHome {...props} />;
  }
  if (pathname === "/app") return <ParticipantHome {...props} />;
  if (pathname === "/app/social") return <SocialFeed {...props} />;
  if (pathname === "/app/settings") return <SettingsPage {...props} />;
  if (pathname === "/app/explore") return <Explore {...props} />;
  if (pathname === "/app/projects") return <Projects {...props} />;
  if (pathname === "/app/projects/new") return <NewProject {...props} />;
  if (pathname.startsWith("/app/projects/"))
    return <ProjectDetail {...props} slug={pathname.split("/").pop()} />;
  if (pathname === "/app/teams") return <Teams {...props} />;
  if (pathname === "/app/teams/new") return <NewTeam {...props} />;
  if (pathname.startsWith("/app/teams/"))
    return <TeamDetail {...props} slug={pathname.split("/").pop()} />;
  if (pathname === "/app/competitions") return <Competitions {...props} />;
  if (pathname.startsWith("/app/competitions/"))
    return <CompetitionDetail {...props} slug={pathname.split("/").pop()} />;
  if (pathname === "/app/learn") return <Learn {...props} />;
  if (pathname.includes("/lesson/")) {
    const s = pathname.split("/");
    return <LessonView {...props} courseSlug={s[3]} lessonId={s[5]} />;
  }
  if (pathname.startsWith("/app/learn/"))
    return <CourseDetail {...props} slug={pathname.split("/").pop()} />;
  if (pathname === "/app/messages") return <Messages {...props} />;
  if (pathname.startsWith("/app/profile/"))
    return <Profile {...props} user={participant} />;
  return <ParticipantHome {...props} />;
}

function PageHead({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  return <span className="avatar">{initials(name)}</span>;
}
function Stage({ value }: { value: string }) {
  return <span className="stage">{value}</span>;
}

function ParticipantHome({
  go,
  projects,
  teams,
  progress,
}: {
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
  progress: Record<string, string[]>;
}) {
  const [greeting, setGreeting] = useState("Olá");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(getGreeting(hour));
  }, []);
  const course = courses[0],
    done = progress[course.id]?.length || 0,
    total = course.modules.flatMap((m) => m.lessons).length,
    pct = Math.round((done / total) * 100);
  return (
    <>
      <PageHead title={`${greeting}, Lucas.`} desc="Continue construindo." />
      <div className="home-grid">
        <section className="panel continue-card">
          <div className="panel-title">
            <span>Continuar aprendendo</span>
            <BookOpen size={18} />
          </div>
          <div className="course-feature">
            <div>
              <span className="eyebrow">CURSO EM ANDAMENTO</span>
              <h2>{course.title}</h2>
              <p>Módulo 3 de 6 · {pct}% concluído</p>
              <Progress value={pct} />
              <button
                className="primary"
                onClick={() => go(`/app/learn/${course.slug}/lesson/l6`)}
              >
                Continuar aula <ArrowRight size={16} />
              </button>
            </div>
            <div className="course-mark">
              <Lightbulb />
            </div>
          </div>
        </section>
        <section className="panel opportunity">
          <div className="panel-title">
            <span>Próxima oportunidade</span>
            <Trophy size={18} />
          </div>
          <b>Envista Challenge 2026</b>
          <p>
            Inscrições abertas para tecnologia, educação, sustentabilidade e
            impacto social.
          </p>
          <button
            className="secondary"
            onClick={() => go("/app/competitions/envista-challenge-2026")}
          >
            Ver competição
          </button>
        </section>
      </div>
      <section className="section-block">
        <div className="section-row">
          <div>
            <h2>Meus Projetos</h2>
            <p>O que você está construindo agora.</p>
          </div>
          <button className="text-btn" onClick={() => go("/app/projects")}>
            Ver todos <ArrowRight size={15} />
          </button>
        </div>
        <div className="project-grid">
          {projects
            .filter((p) => ["p1", "p4"].includes(p.id))
            .map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                go={() => go(`/app/projects/${p.slug}`)}
              />
            ))}
        </div>
      </section>
      <section className="section-block">
        <div className="section-row">
          <div>
            <h2>Minhas equipes</h2>
            <p>Sua função muda conforme o contexto de cada time.</p>
          </div>
          <button className="text-btn" onClick={() => go("/app/teams")}>
            Gerenciar equipes
          </button>
        </div>
        <div className="team-row">
          {teams
            .filter((t) => ["t1", "t2"].includes(t.id))
            .map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                go={() => go(`/app/teams/${t.slug}`)}
              />
            ))}
        </div>
      </section>
      <section className="panel activity">
        <div className="panel-title">
          <span>Atividade recente</span>
        </div>
        {[
          "Ana comentou uma atualização no projeto Aqua.",
          "Equipe Orion adicionou uma nova referência ao EduMatch.",
          "Sua inscrição no Envista Challenge foi confirmada.",
        ].map((x, i) => (
          <div className="activity-item" key={x}>
            <i>
              {i === 0 ? (
                <MessageCircle />
              ) : i === 1 ? (
                <FileText />
              ) : (
                <Trophy />
              )}
            </i>
            <div>
              <b>{x}</b>
              <small>{i + 1}h atrás</small>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function Explore({
  go,
  projects,
  teams,
  investorMode = false,
}: {
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
  investorMode?: boolean;
}) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("Todos");
  const filtered = projects.filter(
    (p) =>
      (!q ||
        `${p.title} ${p.shortDescription} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (stage === "Todos" || p.stage === stage),
  );
  const base = investorMode ? "/investor" : "/app";
  return (
    <>
      <PageHead
        title="Descubra o que está sendo construído."
        desc="Projetos, equipes e pessoas trabalhando em problemas reais."
      />
      <SearchFilters q={q} setQ={setQ} stage={stage} setStage={setStage} />
      <section className="section-block">
        <h2>Projetos em destaque</h2>
        <div className="project-grid">
          {filtered.length ? (
            filtered
              .slice(0, 3)
              .map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  go={() => go(`${base}/projects/${p.slug}`)}
                />
              ))
          ) : (
            <Empty
              title="Nenhum projeto encontrado"
              desc="Tente remover os filtros ou buscar por outro termo."
            />
          )}
        </div>
      </section>
      <section className="section-block">
        <h2>Projetos recentes</h2>
        <div className="list-cards">
          {filtered.map((p) => (
            <ProjectListItem
              key={p.id}
              p={p}
              go={() => go(`${base}/projects/${p.slug}`)}
            />
          ))}
        </div>
      </section>
      <section className="section-block">
        <h2>Equipes que estão construindo</h2>
        <div className="team-row">
          {teams.slice(0, 4).map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              go={() => go(`${base}/teams/${t.slug}`)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
function SearchFilters({
  q,
  setQ,
  stage,
  setStage,
}: {
  q: string;
  setQ: (s: string) => void;
  stage: string;
  setStage: (s: string) => void;
}) {
  return (
    <div className="filters">
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Buscar projetos, pessoas ou equipes"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar projetos, pessoas ou equipes..."
        />
      </label>
      <select
        aria-label="Filtrar por estágio"
        value={stage}
        onChange={(e) => setStage(e.target.value)}
      >
        <option>Todos</option>
        <option>Ideia</option>
        <option>Validação</option>
        <option>Protótipo</option>
        <option>MVP</option>
        <option>Projeto ativo</option>
      </select>
      {(q || stage !== "Todos") && (
        <button
          className="secondary"
          onClick={() => {
            setQ("");
            setStage("Todos");
          }}
        >
          <X size={16} /> Limpar filtros
        </button>
      )}
    </div>
  );
}

function Projects({
  go,
  projects,
  saved,
}: {
  go: (p: string) => void;
  projects: Project[];
  saved: string[];
}) {
  const [tab, setTab] = useState("Meus projetos");
  let list =
    tab === "Salvos"
      ? projects.filter((p) => saved.includes(p.id))
      : tab === "Projetos das equipes"
        ? projects.filter((p) => p.author.type === "team")
        : projects.filter((p) => ["p1", "p4"].includes(p.id));
  return (
    <>
      <PageHead
        title="Meus Projetos"
        desc="Seu portfólio vivo de construção e evolução."
        actions={
          <button className="primary" onClick={() => go("/app/projects/new")}>
            <Plus size={16} /> Novo projeto
          </button>
        }
      />
      <Tabs
        values={["Meus projetos", "Projetos das equipes", "Salvos"]}
        value={tab}
        setValue={setTab}
      />
      <div className="project-grid section-block">
        {list.length ? (
          list.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              go={() => go(`/app/projects/${p.slug}`)}
            />
          ))
        ) : (
          <Empty
            title="Nenhum projeto ainda"
            desc="Seu portfólio começa com uma ideia."
            action="Criar primeiro projeto"
            onClick={() => go("/app/projects/new")}
          />
        )}
      </div>
    </>
  );
}
function NewProject({
  go,
  projects,
  teams,
  persistProjects,
  setToast,
}: {
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
  persistProjects: (v: Project[]) => void;
  setToast: (s: string) => void;
}) {
  const [author, setAuthor] = useState("user:u1");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [stage, setStage] = useState<any>("Ideia");
  const [tags, setTags] = useState("");
  const create = () => {
    if (!title.trim()) return setToast("Dê um nome ao projeto.");
    const [type, id] = author.split(":");
    const p: Project = {
      id: `local-${Date.now()}`,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      title,
      shortDescription: desc,
      problem,
      solution,
      stage,
      tags: tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      category: "Tecnologia",
      location: "Rio de Janeiro, RJ",
      author: { type: type as any, id },
      files: [],
      updates: [],
      readme: `## ${title}\n${desc}`,
    };
    persistProjects([p, ...projects]);
    setToast("Projeto criado no MVP.");
    go(`/app/projects/${p.slug}`);
  };
  return (
    <>
      <PageHead
        title="Novo projeto"
        desc="Publique em seu nome ou represente uma equipe da qual você faz parte."
      />
      <div className="form-page panel">
        <h2>Quem está publicando este projeto?</h2>
        <div className="author-options">
          <button
            className={cx(author === "user:u1" && "selected")}
            onClick={() => setAuthor("user:u1")}
          >
            <Avatar name="Lucas Ferreira" />
            <div>
              <b>Em meu nome</b>
              <small>Lucas Ferreira</small>
            </div>
          </button>
          {teams
            .filter((t) => ["t1", "t2"].includes(t.id))
            .map((t) => (
              <button
                key={t.id}
                className={cx(author === `team:${t.id}` && "selected")}
                onClick={() => setAuthor(`team:${t.id}`)}
              >
                <Avatar name={t.name} />
                <div>
                  <b>{t.name}</b>
                  <small>Publicar como equipe</small>
                </div>
              </button>
            ))}
        </div>
        <div className="form-grid">
          <label>
            Nome do projeto
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Aqua"
            />
          </label>
          <label>
            Estágio
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option>Ideia</option>
              <option>Validação</option>
              <option>Protótipo</option>
              <option>MVP</option>
              <option>Projeto ativo</option>
            </select>
          </label>
        </div>
        <label>
          Descrição curta
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Explique o projeto em uma frase clara."
          />
        </label>
        <label>
          Problema
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Que problema real você observou?"
          />
        </label>
        <label>
          Solução proposta
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Como o projeto responde ao problema?"
          />
        </label>
        <label>
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Arduino, IoT, Educação"
          />
        </label>
        <div className="fake-upload">
          <Upload />
          <div>
            <b>Materiais do projeto</b>
            <p>
              PDF, imagens, vídeos e apresentações — upload apenas visual neste
              MVP.
            </p>
          </div>
          <button className="secondary" onClick={() => setToast("Arquivo demonstrativo selecionado. O envio real depende do Storage.")}>Escolher arquivos</button>
        </div>
        <div className="form-actions">
          <button className="secondary" onClick={() => go("/app/projects")}>
            Cancelar
          </button>
          <button className="primary" onClick={create}>
            Publicar projeto
          </button>
        </div>
      </div>
    </>
  );
}

function ProjectDetail({
  slug,
  go,
  projects,
  teams,
  saved,
  toggleSaved,
  toggleFollowing,
  toggleProjectLike,
  likedProjects,
  following,
  setToast,
  investorMode = false,
  messages,
  setMessages,
  persistProjects,
}: {
  slug: string;
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
  saved: string[];
  toggleSaved: (id: string) => void;
  toggleFollowing: (id: string) => void;
  toggleProjectLike: (id:string) => void;
  likedProjects:string[];
  following: string[];
  setToast: (s: string) => void;
  investorMode?: boolean;
  messages: any;
  setMessages: (v: any) => void;
  persistProjects: (v: Project[]) => void;
}) {
  const p = projects.find((x) => x.slug === slug);
  const [tab, setTab] = useState("Visão geral");
  const [interest, setInterest] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    "Ana Souza: O teste com sensores ficou bem mais estável nesta versão.",
  ]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(p?.title || "");
  const [editDescription, setEditDescription] = useState(p?.shortDescription || "");
  const [editProblem, setEditProblem] = useState(p?.problem || "");
  const [editSolution, setEditSolution] = useState(p?.solution || "");
  if (!p) return <NotFound go={go} />;
  const team =
    p.author.type === "team"
      ? teams.find((t) => t.id === p.author.id)
      : undefined;
  const isMine = !canFollowProject(p.author.type, p.author.id);
  const sendInterest = () => {
    trackEvent("investor_interest");
    setInterest(false);
    setToast("Interesse enviado para a equipe.");
    const v = {
      ...messages,
      marina: [
        ...(messages.marina || []),
        {
          from: "Você",
          text: `Tenho interesse em conhecer melhor o projeto ${p.title}.`,
          time: "Agora",
        },
      ],
    };
    setMessages(v);
  };
  const remove = () => {
    if (
      !confirm(
        `Excluir o projeto ${p.title}? Essa ação será permanente quando conectarmos ao backend.`,
      )
    )
      return;
    persistProjects(projects.filter((x) => x.id !== p.id));
    setToast("Projeto excluído.");
    go("/app/projects");
  };
  const saveProject = () => {
    if (!editTitle.trim()) return setToast("Informe o nome do projeto.");
    const updated:Project={...p,title:editTitle,shortDescription:editDescription,problem:editProblem,solution:editSolution,updates:[{id:`update-${Date.now()}`,text:"Projeto atualizado pelo responsável.",date:"Agora"},...p.updates]};
    persistProjects(projects.map((item)=>item.id===p.id?updated:item));setEditing(false);setToast("Projeto atualizado.");trackEvent("project_update");
  };
  return (
    <>
      <button
        className="back"
        onClick={() => go(investorMode ? "/investor" : "/app/projects")}
      >
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className="project-hero panel">
        <div>
          <div className="project-icon">{p.title[0]}</div>
          <div>
            <div className="meta-row">
              <Stage value={p.stage} />
              <span>{p.category}</span>
              <span>
                <MapPin size={14} />
                {p.location}
              </span>
            </div>
            <h1>{p.title}</h1>
            <p>{p.shortDescription}</p>
            <div className="chips">
              {p.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="actions">
          <button
            className={cx("secondary", likedProjects.includes(p.id) && "selected")}
            onClick={() => toggleProjectLike(p.id)}
          >
            <Heart size={17} fill={likedProjects.includes(p.id) ? "currentColor" : "none"} />
            {(p.likes || 0) + (likedProjects.includes(p.id) ? 1 : 0)}
          </button>
          {!isMine && (
            <button
              className={cx("secondary", saved.includes(p.id) && "selected")}
              onClick={() => toggleSaved(p.id)}
            >
              <Bookmark size={17} />
              {saved.includes(p.id) ? "Salvo" : "Salvar projeto"}
            </button>
          )}
          <button
            className="secondary"
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              setToast("Link copiado.");
            }}
          >
            <Share2 size={17} />
            Compartilhar
          </button>
          {!isMine && (
            <button
              className={cx(
                "secondary",
                following.includes(p.id) && "selected",
              )}
              onClick={() => toggleFollowing(p.id)}
            >
              <Eye size={17} />
              {following.includes(p.id) ? "Seguindo" : "Seguir"}
            </button>
          )}
          {investorMode && !isMine && (
            <button className="primary" onClick={() => setInterest(true)}>
              Tenho interesse
            </button>
          )}
          {isMine && !investorMode && (
            <button className="secondary" onClick={() => setEditing(true)}>Editar projeto</button>
          )}
          {isMine && !investorMode && (
            <button className="danger" onClick={remove}>
              Excluir projeto
            </button>
          )}
        </div>
      </div>
      <Tabs
        values={[
          "Visão geral",
          "Problema",
          "Solução",
          "Desenvolvimento",
          "README",
          "Arquivos",
          "Atualizações",
          "Equipe",
        ]}
        value={tab}
        setValue={setTab}
      />
      <div className="detail-grid">
        <section className="panel prose">
          {tab === "Visão geral" && (
            <>
              <h2>Sobre o projeto</h2>
              <p>{p.shortDescription}</p>
              <h3>Por que isso importa</h3>
              <p>{p.problem}</p>
              <h3>Como estamos respondendo</h3>
              <p>{p.solution}</p>
            </>
          )}
          {tab === "Problema" && (
            <>
              <h2>Problema</h2>
              <p>{p.problem}</p>
            </>
          )}
          {tab === "Solução" && (
            <>
              <h2>Solução proposta</h2>
              <p>{p.solution}</p>
            </>
          )}
          {tab === "Desenvolvimento" && (
            <>
              <h2>Desenvolvimento</h2>
              <p>
                O projeto está no estágio <b>{p.stage}</b>.
              </p>
              <Progress
                value={
                  p.stage === "Ideia"
                    ? 15
                    : p.stage === "Validação"
                      ? 32
                      : p.stage === "Protótipo"
                        ? 58
                        : p.stage === "MVP"
                          ? 78
                          : 90
                }
              />
            </>
          )}
          {tab === "README" && (
            <>
              <h2>README</h2>
              <pre>{p.readme}</pre>
            </>
          )}
          {tab === "Arquivos" && (
            <>
              {p.files.length ? (
                p.files.map((f) => (
                  <div className="file-row" key={f.id}>
                    <FileText />
                    <div>
                      <b>{f.name}</b>
                      <small>{f.type}</small>
                    </div>
                  </div>
                ))
              ) : (
                <Empty
                  title="Nenhum arquivo publicado"
                  desc="Materiais do projeto aparecerão aqui."
                />
              )}
            </>
          )}
          {tab === "Atualizações" && (
            <>
              {p.updates.length ? (
                p.updates.map((u) => (
                  <div className="update" key={u.id}>
                    <b>{u.text}</b>
                    <small>{u.date}</small>
                  </div>
                ))
              ) : (
                <Empty
                  title="Sem atualizações ainda"
                  desc="O histórico de evolução aparecerá aqui."
                />
              )}
            </>
          )}
          {tab === "Equipe" && (
            <>
              {team ? (
                <>
                  <h2>{team.name}</h2>
                  <p>{team.description}</p>
                  {team.members.map((m) => {
                    const u = people.find((x) => x.id === m.userId);
                    return u ? (
                      <div className="member" key={m.userId}>
                        <Avatar name={u.name} />
                        <div>
                          <b>{u.name}</b>
                          <small>{m.role}</small>
                        </div>
                      </div>
                    ) : null;
                  })}
                </>
              ) : (
                <p>Projeto publicado individualmente.</p>
              )}
            </>
          )}
        </section>
        <aside className="panel project-side">
          <h3>Autoria</h3>
          <div className="mini-author">
            <Avatar name={team?.name || participant.name} />
            <div>
              <b>{team?.name || participant.name}</b>
              <small>{team ? "Equipe" : "Projeto pessoal"}</small>
            </div>
          </div>
          <hr />
          <h3>Discussão</h3>
          {comments.map((c) => (
            <p className="comment" key={c}>
              {c}
            </p>
          ))}
          <div className="comment-box">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicionar comentário..."
            />
            <button
              onClick={() => {
                if (comment) {
                  setComments([...comments, `Você: ${comment}`]);
                  setComment("");
                }
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </aside>
      </div>
      {interest && (
        <Modal
          title={`Demonstrar interesse em ${p.title}`}
          close={() => setInterest(false)}
        >
          <label>
            Qual o objetivo do contato?
            <select>
              <option>Conhecer melhor o projeto</option>
              <option>Mentoria</option>
              <option>Parceria</option>
              <option>Possível investimento</option>
              <option>Outro</option>
            </select>
          </label>
          <label>
            Mensagem
            <textarea
              defaultValue={`Olá! Gostaria de conhecer melhor o projeto ${p.title} e entender os próximos passos da equipe.`}
            />
          </label>
          <button className="primary full" onClick={sendInterest}>
            Enviar interesse
          </button>
        </Modal>
      )}
      {editing && <Modal title="Editar projeto" close={() => setEditing(false)}><label>Nome<input value={editTitle} onChange={(event)=>setEditTitle(event.target.value)}/></label><label>Descrição<textarea value={editDescription} onChange={(event)=>setEditDescription(event.target.value)}/></label><label>Problema<textarea value={editProblem} onChange={(event)=>setEditProblem(event.target.value)}/></label><label>Solução<textarea value={editSolution} onChange={(event)=>setEditSolution(event.target.value)}/></label><button className="primary full" onClick={saveProject}>Salvar projeto</button></Modal>}
    </>
  );
}

function Teams({ go, teams }: { go: (p: string) => void; teams: Team[] }) {
  const mine = teams.filter((t) => ["t1", "t2"].includes(t.id));
  return (
    <>
      <PageHead
        title="Minhas equipes"
        desc="Participe de vários contextos sem perder sua função em cada um."
        actions={
          <>
            <button className="secondary" onClick={() => go("/app/explore")}>
              Encontrar equipes
            </button>
            <button className="primary" onClick={() => go("/app/teams/new")}>
              <Plus size={16} /> Criar equipe
            </button>
          </>
        }
      />
      <div className="team-list section-block">
        {mine.map((t) => (
          <TeamWide key={t.id} team={t} go={() => go(`/app/teams/${t.slug}`)} />
        ))}
      </div>
      <section className="section-block">
        <h2>Equipes em destaque</h2>
        <div className="team-row">
          {teams
            .filter((t) => !mine.includes(t))
            .map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                go={() => go(`/app/teams/${t.slug}`)}
              />
            ))}
        </div>
      </section>
    </>
  );
}
function NewTeam({
  go,
  teams,
  persistTeams,
  setToast,
}: {
  go: (p: string) => void;
  teams: Team[];
  persistTeams: (v: Team[]) => void;
  setToast: (s: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const create = () => {
    if (!name) return setToast("Dê um nome à equipe.");
    const t: Team = {
      id: `local-${Date.now()}`,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      description: desc,
      members: [
        {
          userId: "u1",
          role: "Fundador / Líder",
          joinedAt: new Date().toISOString(),
        },
      ],
      category: "Tecnologia",
      city: "Rio de Janeiro",
      institution: "",
      tags: ["Inovação"],
      projects: [],
    };
    persistTeams([t, ...teams]);
    setToast("Equipe criada no MVP.");
    go(`/app/teams/${t.slug}`);
  };
  return (
    <>
      <PageHead
        title="Criar equipe"
        desc="Monte um espaço de trabalho para pessoas, projetos e próximos objetivos."
      />
      <div className="form-page panel">
        <label>
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da equipe"
          />
        </label>
        <label>
          Identificador
          <input placeholder="equipe-atlas" />
        </label>
        <label>
          Descrição
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Que tipo de problema essa equipe quer resolver?"
          />
        </label>
        <div className="form-grid">
          <label>
            Categoria
            <input placeholder="Tecnologia" />
          </label>
          <label>
            Cidade
            <input placeholder="Rio de Janeiro" />
          </label>
          <label>
            Instituição
            <input placeholder="Escola ou organização" />
          </label>
          <label>
            Tags
            <input placeholder="Robótica, IA, Educação" />
          </label>
        </div>
        <button className="primary" onClick={create}>
          Criar equipe
        </button>
      </div>
    </>
  );
}
function TeamDetail({
  slug,
  go,
  teams,
  projects,
  setToast,
  persistTeams,
}: {
  slug: string;
  go: (p: string) => void;
  teams: Team[];
  projects: Project[];
  setToast: (s: string) => void;
  persistTeams: (v: Team[]) => void;
}) {
  const team = teams.find((t) => t.slug === slug);
  const [tab, setTab] = useState("Visão geral");
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteUser, setInviteUser] = useState("");
  const [inviteRole, setInviteRole] = useState("Membro");
  const [editName, setEditName] = useState(team?.name || "");
  const [editDescription, setEditDescription] = useState(team?.description || "");
  if (!team) return <NotFound go={go} />;
  const isMine = team.members.some((m) => m.userId === "u1");
  const remove = () => {
    if (!confirm(`Excluir a equipe ${team.name}?`)) return;
    persistTeams(teams.filter((t) => t.id !== team.id));
    setToast("Equipe excluída.");
    go("/app/teams");
  };
  const updateTeam = (updated:Team) => {persistTeams(teams.map((item)=>item.id===team.id?updated:item));trackEvent("team_update")};
  const saveTeam = () => {if(!editName.trim())return setToast("Informe o nome da equipe.");updateTeam({...team,name:editName,description:editDescription});setEditing(false);setToast("Equipe atualizada.")};
  const invite = () => {if(!inviteUser)return setToast("Selecione uma pessoa.");updateTeam({...team,members:[...team.members,{userId:inviteUser,role:inviteRole,joinedAt:new Date().toISOString().slice(0,10)}]});setInviting(false);setInviteUser("");setToast("Membro adicionado à equipe.")};
  const changeRole = (userId:string, role:string) => {updateTeam({...team,members:team.members.map((member)=>member.userId===userId?{...member,role}:member)});setToast("Função atualizada.")};
  const removeMember = (userId:string) => {if(!confirm("Remover este membro da equipe?"))return;updateTeam({...team,members:team.members.filter((member)=>member.userId!==userId)});setToast("Membro removido.")};
  return (
    <>
      <button className="back" onClick={() => go("/app/teams")}>
        <ArrowLeft size={16} /> Minhas equipes
      </button>
      <div className="team-hero panel">
        <Avatar name={team.name} />
        <div>
          <h1>Equipe {team.name}</h1>
          <p>{team.description}</p>
          <div className="meta-row">
            <span>
              <Building2 size={14} />
              {team.institution || "Instituição independente"}
            </span>
            <span>
              <MapPin size={14} />
              {team.city}
            </span>
          </div>
          <div className="chips">
            {team.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
        <div className="actions">
          {isMine && (
            <button
              className="secondary"
              onClick={() => setInviting(true)}
            >
              <UserPlus size={16} /> Convidar membro
            </button>
          )}
          {isMine && <button className="secondary" onClick={() => setEditing(true)}>Editar equipe</button>}
          {isMine && (
            <button className="danger" onClick={remove}>
              Excluir equipe
            </button>
          )}
        </div>
      </div>
      <Tabs
        values={[
          "Visão geral",
          "Projetos",
          "Membros",
          "Discussões",
          "Arquivos",
        ]}
        value={tab}
        setValue={setTab}
      />
      <section className="panel prose">
        {tab === "Visão geral" && (
          <>
            <h2>Próximos objetivos</h2>
            <div className="objective">
              <CheckCircle2 />
              <div>
                <b>Validar a próxima versão do protótipo</b>
                <p>Reunir evidências e registrar o que mudou.</p>
              </div>
            </div>
            <div className="objective">
              <Clock3 />
              <div>
                <b>Preparar apresentação para competição</b>
                <p>Organizar pitch, demonstração e materiais.</p>
              </div>
            </div>
            <h2>Atividade recente</h2>
            <p>
              A equipe atualizou materiais e registrou uma nova tarefa de
              validação.
            </p>
          </>
        )}
        {tab === "Projetos" && (
          <div className="project-grid">
            {projects
              .filter((p) => team.projects.includes(p.id))
              .map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  go={() => go(`/app/projects/${p.slug}`)}
                />
              ))}
          </div>
        )}
        {tab === "Membros" &&
          team.members.map((m) => {
            const u = people.find((x) => x.id === m.userId) || participant;
            return (
              <div className="member-row" key={m.userId}>
                <div className="member">
                  <Avatar name={u.name} />
                  <div>
                    <b>{u.name}</b>
                    <small>@{u.username}</small>
                  </div>
                </div>
                {isMine ? <select aria-label={`Função de ${u.name}`} value={m.role} onChange={(event)=>changeRole(m.userId,event.target.value)}>{!["Líder de Projeto","Desenvolvedor","Designer","Pesquisa","Comunicação","IA","Eletrônica","Marketing","Membro"].includes(m.role)&&<option>{m.role}</option>}<option>Líder de Projeto</option><option>Desenvolvedor</option><option>Designer</option><option>Pesquisa</option><option>Comunicação</option><option>IA</option><option>Eletrônica</option><option>Marketing</option><option>Membro</option></select> : <span>{m.role}</span>}
                {isMine && m.userId!=="u1" && <button className="danger small" onClick={()=>removeMember(m.userId)}>Remover</button>}
              </div>
            );
          })}
        {tab === "Discussões" && (
          <Empty
            title="Discussões da equipe"
            desc="Tópicos internos poderão organizar decisões sem substituir o chat."
            action="Criar discussão"
            onClick={() =>
              setToast(
                "Discussão criada localmente; API Java já está prevista.",
              )
            }
          />
        )}{" "}
        {tab === "Arquivos" && (
          <Empty
            title="Arquivos compartilhados"
            desc="Arquivos serão persistidos via Supabase Storage na próxima etapa."
            action="Adicionar arquivo"
            onClick={() =>
              setToast("Upload será conectado ao Supabase Storage.")
            }
          />
        )}
      </section>
      {editing && <Modal title="Editar equipe" close={()=>setEditing(false)}><label>Nome<input value={editName} onChange={(event)=>setEditName(event.target.value)}/></label><label>Descrição<textarea value={editDescription} onChange={(event)=>setEditDescription(event.target.value)}/></label><button className="primary full" onClick={saveTeam}>Salvar equipe</button></Modal>}
      {inviting && <Modal title="Adicionar membro" close={()=>setInviting(false)}><label>Pessoa<select value={inviteUser} onChange={(event)=>setInviteUser(event.target.value)}><option value="">Selecione...</option>{people.filter((person)=>!team.members.some((member)=>member.userId===person.id)).map((person)=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Função<input value={inviteRole} onChange={(event)=>setInviteRole(event.target.value)}/></label><button className="primary full" onClick={invite}>Adicionar membro</button></Modal>}
    </>
  );
}

function Competitions({ go }: { go: (p: string) => void }) {
  const [tab, setTab] = useState("Todas");
  const list =
    tab === "Inscrições abertas"
      ? competitions.filter((c) => c.status === "Inscrições abertas")
      : competitions;
  return (
    <>
      <PageHead
        title="Competições"
        desc="Encontre oportunidades para colocar seu projeto à prova."
      />
      <Tabs
        values={[
          "Todas",
          "Inscrições abertas",
          "Próximas",
          "Participando",
          "Finalizadas",
        ]}
        value={tab}
        setValue={setTab}
      />
      <div className="competition-grid section-block">
        {list.map((c) => (
          <CompetitionCard
            key={c.id}
            c={c}
            go={() => go(`/app/competitions/${c.slug}`)}
          />
        ))}
      </div>
    </>
  );
}
function CompetitionDetail({
  slug,
  go,
  projects,
  setToast,
}: {
  slug: string;
  go: (p: string) => void;
  projects: Project[];
  setToast: (s: string) => void;
}) {
  const c = competitions.find((x) => x.slug === slug);
  const [modal, setModal] = useState(false);
  const [registered, setRegistered] = useState(false);
  if (!c) return <NotFound go={go} />;
  return (
    <>
      <button className="back" onClick={() => go("/app/competitions")}>
        <ArrowLeft size={16} /> Competições
      </button>
      <div className="competition-hero panel">
        <div>
          <span className="eyebrow">
            {c.type === "external"
              ? "COMPETIÇÃO EXTERNA"
              : "COMPETIÇÃO ENVISTA"}
          </span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="meta-row">
            <span>{c.organization}</span>
            <span>{c.location}</span>
            <span>{c.format}</span>
          </div>
        </div>
        {c.type === "external" ? (
          <button
            className="primary"
            onClick={() =>
              setToast(
                "No produto real, este botão abriria o site oficial informado pela organização.",
              )
            }
          >
            Ver site oficial <ExternalLink size={16} />
          </button>
        ) : (
          <button
            className="primary"
            disabled={registered}
            onClick={() => setModal(true)}
          >
            {registered ? "Projeto inscrito" : "Inscrever projeto"}
          </button>
        )}
      </div>
      <div className="detail-grid">
        <section className="panel prose">
          <h2>Sobre</h2>
          <p>{c.description}</p>
          <h2>Categorias</h2>
          <div className="chips">
            {c.categories.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <h2>Cronograma</h2>
          <div className="timeline">
            <div>
              <i />
              <b>Inscrições</b>
              <p>
                {c.deadline
                  ? `Até ${c.deadline}`
                  : "Consulte a organização oficial."}
              </p>
            </div>
            <div>
              <i />
              <b>Avaliação</b>
              <p>Etapa de análise e feedback.</p>
            </div>
            <div>
              <i />
              <b>Final</b>
              <p>Apresentação dos projetos selecionados.</p>
            </div>
          </div>
        </section>
        <aside className="panel project-side">
          <h3>Informações</h3>
          <p>
            <b>Status</b>
            <br />
            {c.status}
          </p>
          {c.prize && (
            <p>
              <b>Premiação</b>
              <br />
              {c.prize}
            </p>
          )}
          <p>
            <b>Formato</b>
            <br />
            {c.format}
          </p>
        </aside>
      </div>
      {modal && (
        <Modal title="Inscrever projeto" close={() => setModal(false)}>
          <p>Selecione um projeto elegível do seu portfólio.</p>
          <div className="select-projects">
            {projects
              .filter((p) => ["p1", "p4"].includes(p.id))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setRegistered(true);
                    setModal(false);
                    setToast("Inscrição simulada confirmada.");
                  }}
                >
                  <div className="project-icon">{p.title[0]}</div>
                  <div>
                    <b>{p.title}</b>
                    <small>
                      {p.stage} · {p.category}
                    </small>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function Learn({
  go,
  progress,
}: {
  go: (p: string) => void;
  progress: Record<string, string[]>;
}) {
  const c = courses[0];
  const total = c.modules.flatMap((m) => m.lessons).length,
    done = progress[c.id]?.length || 0;
  return (
    <>
      <PageHead
        title="Aprender"
        desc="Conhecimento para transformar ideias em projetos reais."
      />
      <section className="panel learn-continue">
        <div>
          <span className="eyebrow">CONTINUE APRENDENDO</span>
          <h2>{c.title}</h2>
          <p>{c.description}</p>
          <Progress value={Math.round((done / total) * 100)} />
          <small>
            {done} de {total} aulas concluídas
          </small>
        </div>
        <button
          className="primary"
          onClick={() => go(`/app/learn/${c.slug}/lesson/l6`)}
        >
          <Play size={16} /> Continuar aula
        </button>
      </section>
      <section className="section-block">
        <h2>Trilhas Envista</h2>
        <div className="trail">
          <div>
            <Sparkles />
            <b>Construindo seu primeiro projeto</b>
            <span>3 cursos · fundamentos → validação → apresentação</span>
          </div>
          <Progress value={36} />
        </div>
      </section>
      <section className="section-block">
        <h2>Cursos disponíveis</h2>
        <div className="course-grid">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              go={() => go(`/app/learn/${c.slug}`)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
function CourseDetail({
  slug,
  go,
  progress,
}: {
  slug: string;
  go: (p: string) => void;
  progress: Record<string, string[]>;
}) {
  const c = courses.find((x) => x.slug === slug);
  if (!c) return <NotFound go={go} />;
  const all = c.modules.flatMap((m) => m.lessons),
    done = progress[c.id]?.length || 0;
  return (
    <>
      <button className="back" onClick={() => go("/app/learn")}>
        <ArrowLeft size={16} /> Aprender
      </button>
      <div className="course-hero panel">
        <div className="course-mark">
          <BookOpen />
        </div>
        <div>
          <span className="eyebrow">CURSO ENVISTA</span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="meta-row">
            <span>{c.instructor}</span>
            <span>{c.level}</span>
            <span>{c.duration}</span>
          </div>
          <Progress value={Math.round((done / all.length) * 100)} />
        </div>
        <button
          className="primary"
          onClick={() =>
            go(
              `/app/learn/${c.slug}/lesson/${all.find((l) => !progress[c.id]?.includes(l.id))?.id || all[0].id}`,
            )
          }
        >
          Continuar curso
        </button>
      </div>
      <section className="panel modules">
        <h2>Conteúdo do curso</h2>
        {c.modules.map((m, i) => (
          <div className="module" key={m.id}>
            <div className="module-title">
              <span>0{i + 1}</span>
              <b>
                Módulo {i + 1} — {m.title}
              </b>
              <small>{m.lessons.length} aulas</small>
            </div>
            {m.lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => go(`/app/learn/${c.slug}/lesson/${l.id}`)}
              >
                <span
                  className={cx(
                    "lesson-check",
                    progress[c.id]?.includes(l.id) && "done",
                  )}
                >
                  {progress[c.id]?.includes(l.id) ? (
                    <Check size={14} />
                  ) : (
                    <Play size={13} />
                  )}
                </span>
                <div>
                  <b>{l.title}</b>
                  <small>{l.description}</small>
                </div>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
function LessonView({
  courseSlug,
  lessonId,
  go,
  progress,
  completeLesson,
  persistProjects,
  projects,
  setToast,
}: {
  courseSlug: string;
  lessonId: string;
  go: (p: string) => void;
  progress: Record<string, string[]>;
  completeLesson: (c: string, l: string) => void;
  persistProjects: (p: Project[]) => void;
  projects: Project[];
  setToast: (s: string) => void;
}) {
  const c = courses.find((x) => x.slug === courseSlug);
  if (!c) return <NotFound go={go} />;
  const all = c.modules.flatMap((m) => m.lessons),
    idx = all.findIndex((l) => l.id === lessonId),
    lesson = all[idx] || all[0],
    isFinal = idx === all.length - 1;
  const addFinal = () => {
    const exists = projects.some((p) => p.slug === "meu-projeto-final");
    if (!exists) {
      persistProjects([
        {
          ...seedProjects[0],
          id: `final-${Date.now()}`,
          slug: "meu-projeto-final",
          title: "Meu projeto final",
          shortDescription:
            "Projeto criado a partir do curso Da ideia ao projeto.",
          author: { type: "user", id: "u1" },
          stage: "Ideia",
        },
        ...projects,
      ]);
    }
    setToast("Projeto final adicionado ao seu portfólio.");
    go("/app/projects");
  };
  return (
    <div className="lesson-layout">
      <section>
        <button className="back" onClick={() => go(`/app/learn/${c.slug}`)}>
          <ArrowLeft size={16} /> {c.title}
        </button>
        <div className="video-mock">
          <div>
            <Play />
            <b>Aula demonstrativa</b>
            <small>Player de vídeo mockado — sem mídia externa.</small>
          </div>
        </div>
        <div className="lesson-copy">
          <span className="eyebrow">{isFinal ? "PROJETO FINAL" : "AULA"}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
          {isFinal ? (
            <div className="final-project-box">
              <h2>Transforme aprendizado em portfólio.</h2>
              <p>
                Estruture problema, solução e próximos passos. No MVP, o botão
                abaixo cria uma entrada local no seu portfólio.
              </p>
              <button className="primary" onClick={addFinal}>
                Adicionar ao meu portfólio
              </button>
            </div>
          ) : (
            <>
              <h2>Material da aula</h2>
              <div className="file-row">
                <FileText />
                <div>
                  <b>Resumo da aula.pdf</b>
                  <small>Material demonstrativo</small>
                </div>
              </div>
            </>
          )}
          <div className="lesson-actions">
            <button
              className="secondary"
              disabled={idx <= 0}
              onClick={() =>
                go(`/app/learn/${c.slug}/lesson/${all[idx - 1]?.id}`)
              }
            >
              Aula anterior
            </button>
            <button
              className="primary"
              onClick={() => {
                completeLesson(c.id, lesson.id);
                if (idx < all.length - 1)
                  go(`/app/learn/${c.slug}/lesson/${all[idx + 1].id}`);
              }}
            >
              {progress[c.id]?.includes(lesson.id)
                ? "Concluída"
                : "Concluir aula"}{" "}
              {idx < all.length - 1 && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
      <aside className="lesson-sidebar">
        <b>{c.title}</b>
        {c.modules.map((m) => (
          <div key={m.id}>
            <span>{m.title}</span>
            {m.lessons.map((l) => (
              <button
                key={l.id}
                className={cx(l.id === lesson.id && "active")}
                onClick={() => go(`/app/learn/${c.slug}/lesson/${l.id}`)}
              >
                <i className={cx(progress[c.id]?.includes(l.id) && "done")}>
                  {progress[c.id]?.includes(l.id) ? <Check /> : <Play />}
                </i>
                {l.title}
              </button>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}

function Messages({
  messages,
  setMessages,
  investorMode = false,
}: {
  messages: Record<string, { from: string; text: string; time: string }[]>;
  setMessages: (v: any) => void;
  investorMode?: boolean;
}) {
  const conversations = investorMode
    ? [
        ["marina", "Equipe Atlas"],
        ["vision", "Equipe Lumina"],
      ]
    : [
        ["atlas", "Equipe Atlas"],
        ["orion", "Equipe Orion"],
        ["marina", "Marina Alves"],
      ];
  const [active, setActive] = useState(conversations[0][0]);
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    setMessages({
      ...messages,
      [active]: [
        ...(messages[active] || []),
        { from: "Você", text, time: "Agora" },
      ],
    });
    setText("");
  };
  return (
    <>
      <PageHead
        title="Mensagens"
        desc="Converse com pessoas e equipes sem promessas de segurança que ainda não existem."
      />
      <div className="messages-layout panel">
        <aside>
          <label className="search-field">
            <Search size={16} />
            <input placeholder="Buscar conversa" />
          </label>
          {conversations.map(([id, name]) => (
            <button
              key={id}
              className={cx(active === id && "active")}
              onClick={() => setActive(id)}
            >
              <Avatar name={name} />
              <div>
                <b>{name}</b>
                <small>
                  {messages[id]?.at(-1)?.text || "Começar conversa"}
                </small>
              </div>
            </button>
          ))}
        </aside>
        <section>
          <header>
            <div>
              <Avatar
                name={conversations.find((x) => x[0] === active)?.[1] || ""}
              />
              <div>
                <b>{conversations.find((x) => x[0] === active)?.[1]}</b>
                <small>Conversa Envista</small>
              </div>
            </div>
            <button className="icon-btn" aria-label="Opções da conversa" onClick={() => alert("Opções da conversa: silenciar ou arquivar (demonstração).") }>
              <MoreHorizontal />
            </button>
          </header>
          <div className="chat-body">
            {(messages[active] || []).map((m, i) => (
              <div
                className={cx("bubble", m.from === "Você" && "mine")}
                key={i}
              >
                <small>{m.from}</small>
                <p>{m.text}</p>
                <time>{m.time}</time>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <button className="icon-btn" aria-label="Anexar arquivo" onClick={() => alert("Anexo selecionado no modo demonstração.")}>
              <Plus />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escreva uma mensagem..."
            />
            <button className="primary square" onClick={send}>
              <Send size={17} />
            </button>
          </div>
        </section>
      </div>
      <p className="security-note">
        Backend Java preparado para autenticação, autorização e persistência. A
        integração Supabase será ligada na próxima etapa; não há alegação de
        criptografia ponta a ponta.
      </p>
    </>
  );
}

function Profile({
  user,
  projects,
  teams,
  setToast,
  go,
}: {
  user: User;
  projects: Project[];
  teams: Team[];
  setToast: (s: string) => void;
  go: (p: string) => void;
}) {
  const profileSettings = storage.get(`settings-${user.role}`, {showLocation:true});
  const [tab, setTab] = useState(
    user.role === "participant" ? "Projetos" : "Sobre",
  );
  const [editing, setEditing] = useState(false);
  return (
    <>
      <div className="profile-head panel">
        <Avatar name={user.name} />
        <div className="profile-main">
          <div className="profile-title-line">
            <h1>{user.name}</h1>
            <span className="role-status">
              {user.role === "investor" ? "Investidor" : "Participante"}
            </span>
          </div>
          <p className="profile-username">@{user.username}</p>
          <p className="profile-bio">{user.bio}</p>
          <div className="profile-meta">
            {user.school && (
              <span>
                <School size={14} />
                {user.school}
              </span>
            )}
            {profileSettings.showLocation !== false && (
              <span>
                <MapPin size={14} />
                {user.city}, {user.state}
              </span>
            )}
            {user.organization && (
              <span>
                <Building2 size={14} />
                {user.organization}
              </span>
            )}
          </div>
          <div className="profile-skills">
            <span className="profile-section-label">{user.role === "investor" ? "Interesses" : "Habilidades"}</span>
            <div className="chips">
              {(user.skills || user.interests || []).map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </div>
        <button className="secondary" onClick={() => setEditing(true)}>
          Editar perfil
        </button>
      </div>
      <Tabs
        values={
          user.role === "participant"
            ? ["Projetos", "Equipes", "Conquistas", "Sobre"]
            : ["Sobre"]
        }
        value={tab}
        setValue={setTab}
      />
      {tab === "Projetos" && (
        <div className="project-grid section-block">
          {projects
            .filter((p) => ["p1", "p4"].includes(p.id))
            .map((p) => (
              <ProjectCard key={p.id} p={p} go={() => go(`/app/projects/${p.slug}`)} />
            ))}
        </div>
      )}
      {tab === "Equipes" && (
        <div className="team-row section-block">
          {teams
            .filter((t) => ["t1", "t2"].includes(t.id))
            .map((t) => (
              <TeamCard key={t.id} team={t} go={() => go(`/app/teams/${t.slug}`)} />
            ))}
        </div>
      )}
      {tab === "Conquistas" && (
        <div className="achievement-grid section-block">
          {[
            ["Primeiro projeto", "Publicou seu primeiro projeto no Envista."],
            ["Primeira competição", "Inscreveu um projeto em uma competição."],
            ["Curso concluído", "Finalizou uma trilha de aprendizagem."],
          ].map(([t, d]) => (
            <div className="panel achievement" key={t}>
              <Trophy />
              <b>{t}</b>
              <p>{d}</p>
            </div>
          ))}
        </div>
      )}
      {(tab === "Sobre" || user.role === "investor") && (
        <section className="panel prose">
          <h2>Sobre</h2>
          <p>{user.bio}</p>
        </section>
      )}
      {editing && (
        <Modal title="Editar perfil" close={() => setEditing(false)}>
          <label>
            Nome
            <input defaultValue={user.name} />
          </label>
          <label>
            Bio
            <textarea defaultValue={user.bio} />
          </label>
          <button
            className="primary full"
            onClick={() => {
              setEditing(false);
              setToast("Perfil atualizado localmente no MVP.");
            }}
          >
            Salvar alterações
          </button>
        </Modal>
      )}
    </>
  );
}

function AdminArea({ setToast, pathname }: { setToast: (s: string) => void; pathname:string }) {
  const routeTab = pathname.includes("courses") || pathname.includes("content") ? "Aulas" : pathname.includes("analytics") ? "Cliques" : pathname.includes("moderation") ? "Moderação" : "Visão geral";
  const [tab, setTab] = useState(routeTab);
  useEffect(() => setTab(routeTab), [routeTab]);
  const [lessonEditor, setLessonEditor] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [adminLessons, setAdminLessons] = useState<string[]>(() => storage.get("admin-lessons", courses.map((course) => course.title)));
  const [moderation, setModeration] = useState(() => storage.get("admin-moderation", [
    {id:"report-post", title:"Publicação denunciada", reason:"Possível spam", resolved:false},
    {id:"report-project", title:"Projeto denunciado", reason:"Conteúdo inadequado", resolved:false},
  ]));
  const trackedEvents = storage.get<Record<string,number>>("analytics-events", {});
  const tabs = ["Visão geral", "Aulas", "Cliques", "Moderação"];
  const saveLesson = () => {
    if (!lessonTitle.trim()) return setToast("Informe o título da aula.");
    const next = lessonEditor === "new" ? [lessonTitle, ...adminLessons] : adminLessons.map((title) => title === lessonEditor ? lessonTitle : title);
    setAdminLessons(next); storage.set("admin-lessons", next); setLessonEditor(null); setLessonTitle(""); setToast("Aula salva no painel administrativo.");
  };
  const review = (id:string) => {
    const next = moderation.map((item) => item.id === id ? {...item, resolved:!item.resolved} : item);
    setModeration(next); storage.set("admin-moderation", next); setToast("Status da moderação atualizado.");
  };
  return (
    <>
      <PageHead
        eyebrow="ADMIN"
        title="Painel administrativo"
        desc="Publique conteúdo, acompanhe uso e modere o ecossistema."
      />
      <Tabs values={tabs} value={tab} setValue={setTab} />
      {tab === "Visão geral" && (
        <div className="admin-stats">
          <div className="panel">
            <b>1.284</b>
            <span>usuários</span>
          </div>
          <div className="panel">
            <b>96</b>
            <span>projetos</span>
          </div>
          <div className="panel">
            <b>41</b>
            <span>equipes</span>
          </div>
          <div className="panel">
            <b>7</b>
            <span>denúncias abertas</span>
          </div>
        </div>
      )}
      {tab === "Aulas" && (
        <section className="panel settings-card">
          <div className="section-row">
            <div>
              <h2>Publicar aulas</h2>
              <p>Conteúdo será persistido no banco e materiais no Storage.</p>
            </div>
            <button
              className="primary"
              onClick={() => {setLessonEditor("new");setLessonTitle("")}}
            >
              Nova aula
            </button>
          </div>
          {adminLessons.map((title, index) => (
            <div className="member-row" key={`${title}-${index}`}>
              <div>
                <b>{title}</b>
                <small>{courses[index]?.modules.length || 1} módulo(s) · Publicado</small>
              </div>
              <button className="secondary" onClick={() => {setLessonEditor(title);setLessonTitle(title)}}>Editar</button>
            </div>
          ))}
        </section>
      )}
      {tab === "Cliques" && (
        <section className="panel settings-card">
          <h2>Eventos e cliques</h2>
          <p>
            Estrutura preparada para registrar visualizações, cliques em CTAs,
            follows, likes e conversões sem armazenar dados sensíveis
            desnecessários.
          </p>
          <div className="admin-event-list">
            {Object.keys(trackedEvents).length ? Object.entries(trackedEvents).map(([name,count]) => <div key={name}>{name} · {count}</div>) : <div>Nenhum evento local registrado ainda.</div>}
          </div>
        </section>
      )}
      {tab === "Moderação" && (
        <section className="panel settings-card">
          <h2>Fila de moderação</h2>
          {moderation.map((item) => <div className="member-row" key={item.id}><div><b>{item.title}</b><small>{item.reason} · {item.resolved ? "revisado" : "aguardando revisão"}</small></div><button className={cx("secondary", item.resolved && "selected")} onClick={() => review(item.id)}>{item.resolved ? "Reabrir" : "Marcar revisado"}</button></div>)}
        </section>
      )}
      {lessonEditor && <Modal title={lessonEditor === "new" ? "Nova aula" : "Editar aula"} close={() => setLessonEditor(null)}><label>Título da aula<input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Ex.: Validando uma ideia"/></label><label>Status<select defaultValue="Publicado"><option>Rascunho</option><option>Publicado</option></select></label><button className="primary full" onClick={saveLesson}>Salvar aula</button></Modal>}
    </>
  );
}

function SettingsPage({
  me,
  setToast,
}: {
  me: User;
  setToast: (s: string) => void;
}) {
  const settingsKey = `settings-${me.role}`;
  const savedSettings = storage.get(settingsKey, {name:me.name, username:me.username, emailNotifications:true, projectNotifications:true, showLocation:true, publicProfile:true, reducedMotion:false});
  const [name, setName] = useState(savedSettings.name);
  const [username, setUsername] = useState(savedSettings.username);
  const [emailNotifications, setEmailNotifications] = useState(savedSettings.emailNotifications);
  const [projectNotifications, setProjectNotifications] = useState(savedSettings.projectNotifications);
  const [showLocation, setShowLocation] = useState(savedSettings.showLocation ?? true);
  const [publicProfile, setPublicProfile] = useState(savedSettings.publicProfile ?? true);
  const [reducedMotion, setReducedMotion] = useState(savedSettings.reducedMotion ?? false);
  const currentSettings = {name, username, emailNotifications, projectNotifications, showLocation, publicProfile, reducedMotion};
  const persistSettings = (next = currentSettings) => {
    storage.set(settingsKey, next);
    document.documentElement.classList.toggle("reduced-motion", next.reducedMotion);
    window.dispatchEvent(new Event("envista-settings"));
    setToast("Configurações salvas neste dispositivo.");
  };
  const resetDemo = () => {
    if (!confirm("Restaurar todos os dados locais do MVP? Projetos, equipes, mensagens, Social e preferências voltarão ao estado inicial.")) return;
    ["saved","following","liked-projects","projects","teams","progress","messages","notifications","social-posts","social-following","social-liked-posts","analytics-events","admin-lessons","admin-moderation","settings-participant","settings-investor","settings-admin"].forEach((key)=>storage.remove(key));
    setToast("Dados do MVP restaurados.");
    setTimeout(()=>location.assign(me.role === "investor" ? "/investor" : me.role === "admin" ? "/admin" : "/app"),500);
  };
  return (
    <>
      <PageHead
        title="Configurações"
        desc="Privacidade, notificações e preferências da sua conta."
      />
      <div className="settings-grid">
        <section className="panel settings-card" id="preferences">
          <h2>Conta</h2>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ""))} />
          </label>
          <button
            className="primary"
            onClick={() => persistSettings()}
          >
            Salvar alterações
          </button>
        </section>
        <section className="panel settings-card" id="notifications">
          <h2>Notificações</h2>
          <label className="toggle-row">
            <span>
              <b>Projetos seguidos</b>
              <small>Competições, novos arquivos e avanços.</small>
            </span>
            <input
              type="checkbox"
              checked={projectNotifications}
              onChange={(e) => {const checked=e.target.checked;setProjectNotifications(checked);persistSettings({...currentSettings,projectNotifications:checked})}}
            />
          </label>
          <label className="toggle-row">
            <span>
              <b>E-mail</b>
              <small>Resumo de notificações importantes.</small>
            </span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => {const checked=e.target.checked;setEmailNotifications(checked);persistSettings({...currentSettings,emailNotifications:checked})}}
            />
          </label>
        </section>
        <section className="panel settings-card">
          <h2>Privacidade do perfil</h2>
          <label className="toggle-row">
            <span><b>Perfil público</b><small>Permitir que pessoas encontrem seu perfil na pesquisa e na Social.</small></span>
            <input type="checkbox" checked={publicProfile} onChange={(e) => {const checked=e.target.checked;setPublicProfile(checked);persistSettings({...currentSettings,publicProfile:checked})}} />
          </label>
          <label className="toggle-row">
            <span><b>Mostrar localização</b><small>Exibir cidade e estado no seu perfil.</small></span>
            <input type="checkbox" checked={showLocation} onChange={(e) => {const checked=e.target.checked;setShowLocation(checked);persistSettings({...currentSettings,showLocation:checked})}} />
          </label>
        </section>
        <section className="panel settings-card">
          <h2>Acessibilidade</h2>
          <label className="toggle-row">
            <span><b>Reduzir animações</b><small>Remove transições e movimentos da interface neste dispositivo.</small></span>
            <input type="checkbox" checked={reducedMotion} onChange={(e) => {const checked=e.target.checked;setReducedMotion(checked);persistSettings({...currentSettings,reducedMotion:checked})}} />
          </label>
        </section>
        <section className="panel settings-card danger-zone">
          <h2>Privacidade e conta</h2>
          <p>
            Configurações sensíveis serão validadas pelo backend Java e pelas
            políticas do Supabase.
          </p>
          <button
            className="danger"
            onClick={() =>
              setToast(
                "Exclusão de conta exige confirmação e backend conectado.",
              )
            }
          >
            Excluir minha conta
          </button>
          <button className="secondary" onClick={resetDemo}>Restaurar dados do MVP</button>
        </section>
      </div>
    </>
  );
}

function SocialFeed({
  me,
  teams,
  setToast,
}: {
  me: User;
  teams: Team[];
  setToast: (s: string) => void;
}) {
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [as, setAs] = useState<"user" | "team">("user");
  const [image, setImage] = useState("");
  const [commentPost, setCommentPost] = useState("");
  const [socialComment, setSocialComment] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const [followingSocial, setFollowingSocial] = useState<string[]>(() => storage.get("social-following", []));
  const [likedSocialPosts, setLikedSocialPosts] = useState<Record<string, string[]>>(() => storage.get("social-liked-posts", {}));
  const [posts, setPosts] = useState<SocialPost[]>(() => storage.get<SocialPost[]>("social-posts", [
    {
      id: "s1",
      author: "Equipe Atlas",
      handle: "@atlas",
      body: "Fechamos uma nova rodada de testes do Aqua. O sensor está mais estável e agora vamos validar em ambiente escolar.",
      likes: 18,
      time: "2h",
    },
    {
      id: "s2",
      author: "Ana Souza",
      handle: "@anasouza",
      body: "Fim de semana de competição e muita coisa aprendida. Documentar o que deu errado foi tão importante quanto o resultado.",
      likes: 31,
      time: "5h",
    },
    {
      id: "s3",
      author: "Equipe Orion",
      handle: "@orion",
      body: "O EduMatch ganhou um fluxo novo para organizar oportunidades educacionais por interesse.",
      likes: 12,
      time: "1d",
    },
  ]));
  const persistPosts = (next: SocialPost[]) => { setPosts(next); storage.set("social-posts", next); };
  const toggleLike = (postId: string) => {
    const currentLikedPostIds = likedSocialPosts[me.id] || [];
    const result = toggleSocialPostLike(posts, currentLikedPostIds, postId);
    const nextLikedSocialPosts = { ...likedSocialPosts, [me.id]: result.likedPostIds };

    persistPosts(result.posts);
    setLikedSocialPosts(nextLikedSocialPosts);
    storage.set("social-liked-posts", nextLikedSocialPosts);
    setToast(result.liked ? "Publicação curtida." : "Curtida removida.");
  };
  const normalizedQuery = normalizeSearch(q);
  const visible = posts.filter(
    (p) =>
      !normalizedQuery ||
      `${p.author} ${p.handle} ${p.body}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery),
  );
  const visiblePeople = people.filter((person) => person.id !== me.id && (
    !normalizedQuery || `${person.name} ${person.username} ${(person.skills || []).join(" ")}`
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedQuery)),
  );
  const visibleTeams = teams.filter((team) =>
    !normalizedQuery || `${team.name} ${team.description} ${team.tags.join(" ")}`
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedQuery),
  );
  const toggleSocialFollow = (id: string, name: string) => {
    const next = followingSocial.includes(id) ? followingSocial.filter((item) => item !== id) : [...followingSocial, id];
    setFollowingSocial(next);
    storage.set("social-following", next);
    setToast(next.includes(id) ? `Agora você segue ${name}.` : `Você deixou de seguir ${name}.`);
  };
  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setToast("Selecione um arquivo de imagem.");
    if (file.size > 1_500_000) return setToast("Use uma imagem de até 1,5 MB no MVP.");
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const publish = () => {
    if (!text.trim() && !image) return setToast("Escreva algo ou adicione uma imagem.");
    const team = teams.find((t) => ["t1", "t2"].includes(t.id));
    const next: SocialPost[] = [
      {
        id: `local-${Date.now()}`,
        author: as === "team" ? team?.name || "Equipe" : me.name,
        handle:
          as === "team" ? `@${team?.slug || "equipe"}` : `@${me.username}`,
        body: text,
        likes: 0,
        time: "agora",
        image: image || undefined,
      },
      ...posts,
    ];
    persistPosts(next);
    trackEvent("social_publish");
    setText("");
    setImage("");
    setToast(
      "Publicação criada. A API Java já terá endpoint para persistir esse conteúdo.",
    );
  };
  const publishComment = (postId:string) => {if(!socialComment.trim())return;persistPosts(posts.map((post)=>post.id===postId?{...post,comments:[...(post.comments||[]),{id:`comment-${Date.now()}`,author:me.name,text:socialComment}]}:post));setSocialComment("");setToast("Comentário publicado.");trackEvent("social_comment")};
  const ownHandles = new Set([`@${me.username}`,...teams.filter((team)=>["t1","t2"].includes(team.id)).map((team)=>`@${team.slug}`)]);
  return (
    <>
      <PageHead
        title="Social"
        desc="Compartilhe competições, avanços de projeto, novidades de equipe e aprendizados."
      />
      <div className="social-layout">
        <section>
          <div className="panel composer">
            <div className="composer-head">
              <Avatar name={as === "user" ? me.name : "Atlas"} />
              <select aria-label="Publicar como" value={as} onChange={(e) => setAs(e.target.value as "user" | "team")}>
                <option value="user">Publicar como {me.name}</option>
                <option value="team">Publicar como Equipe Atlas</option>
              </select>
            </div>
            <textarea
              aria-label="Conteúdo da publicação"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Compartilhe uma novidade..."
            />
            {image && <div className="composer-image"><img src={image} alt="Prévia do anexo"/><button aria-label="Remover imagem" onClick={() => setImage("")}><X size={16}/></button></div>}
            <div className="composer-actions">
              <input ref={imageInput} className="sr-only" type="file" accept="image/*" onChange={chooseImage}/>
              <button
                className="secondary"
                onClick={() => imageInput.current?.click()}
              >
                <Upload size={16} />
                Imagem
              </button>
              <button className="primary" onClick={publish}>
                Publicar
              </button>
            </div>
          </div>
          <label className="social-search">
            <Search size={17} />
            <input
              aria-label="Pesquisar na Social"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar publicações, pessoas ou equipes..."
            />
            {q && <button className="search-clear" aria-label="Limpar pesquisa" onClick={() => setQ("")}><X size={16} /></button>}
          </label>
          {visible.map((post) => (
            <article className="panel social-post" key={post.id}>
              <header>
                <Avatar name={post.author} />
                <div>
                  <b>{post.author}</b>
                  <small>
                    {post.handle} · {post.time}
                  </small>
                </div>
                {!ownHandles.has(post.handle) && <button className={cx("secondary small-follow", followingSocial.includes(post.handle) && "selected")} onClick={() => toggleSocialFollow(post.handle, post.author)}>{followingSocial.includes(post.handle) ? "Seguindo" : "Seguir"}</button>}
              </header>
              <p>{post.body}</p>
              {post.image && <img className="social-post-image" src={post.image} alt={`Imagem publicada por ${post.author}`}/>} 
              <footer>
                <button
                  className={cx((likedSocialPosts[me.id] || []).includes(post.id) && "liked")}
                  aria-label={(likedSocialPosts[me.id] || []).includes(post.id) ? "Remover curtida" : "Curtir publicação"}
                  aria-pressed={(likedSocialPosts[me.id] || []).includes(post.id)}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart size={17} fill={(likedSocialPosts[me.id] || []).includes(post.id) ? "currentColor" : "none"} />
                  {post.likes}
                </button>
                <button onClick={() => setCommentPost(commentPost===post.id?"":post.id)}>
                  <MessageCircle size={17} />
                  Comentar {post.comments?.length ? `(${post.comments.length})` : ""}
                </button>
                <button onClick={() => {navigator.clipboard?.writeText(post.body);setToast("Publicação copiada para compartilhar.")}}>
                  <Share2 size={17} />
                  Compartilhar
                </button>
              </footer>
              {commentPost===post.id && <div className="social-comments">{(post.comments||[]).map((comment)=><div key={comment.id}><b>{comment.author}</b><p>{comment.text}</p></div>)}<div className="comment-box"><input value={socialComment} onChange={(event)=>setSocialComment(event.target.value)} onKeyDown={(event)=>event.key==="Enter"&&publishComment(post.id)} placeholder="Escreva um comentário..."/><button aria-label="Enviar comentário" onClick={()=>publishComment(post.id)}><Send size={16}/></button></div></div>}
            </article>
          ))}
          {!visible.length && <Empty title="Nenhuma publicação encontrada" desc={`Não encontramos publicações para “${q}”.`} action="Limpar pesquisa" onClick={() => setQ("")} />}
        </section>
        <aside className="panel social-side">
          <h3>{q ? "Resultados relacionados" : "Pessoas e equipes"}</h3>
          {visiblePeople.slice(0, 4).map((u) => (
            <div className="social-person" key={u.id}>
              <Avatar name={u.name} />
              <div>
                <b>{u.name}</b>
                <small>@{u.username}</small>
              </div>
              <button className={cx(followingSocial.includes(u.id) && "selected")} onClick={() => toggleSocialFollow(u.id, u.name)}>{followingSocial.includes(u.id) ? "Seguindo" : "Seguir"}</button>
            </div>
          ))}
          {q && visibleTeams.slice(0, 3).map((team) => (
            <div className="social-person" key={team.id}>
              <Avatar name={team.name} />
              <div><b>{team.name}</b><small>Equipe · {team.category}</small></div>
              <button className={cx(followingSocial.includes(team.id) && "selected")} onClick={() => toggleSocialFollow(team.id, team.name)}>{followingSocial.includes(team.id) ? "Seguindo" : "Seguir"}</button>
            </div>
          ))}
          {q && !visiblePeople.length && !visibleTeams.length && <p className="social-no-results">Nenhuma pessoa ou equipe encontrada.</p>}
        </aside>
      </div>
    </>
  );
}

function InvestorProjects({
  go,
  projects,
}: {
  go: (p: string) => void;
  projects: Project[];
}) {
  return (
    <>
      <PageHead
        title="Projetos"
        desc="Explore projetos públicos de toda a comunidade."
      />
      <div className="project-grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            p={p}
            go={() => go(`/investor/projects/${p.slug}`)}
          />
        ))}
      </div>
    </>
  );
}
function InvestorTeams({
  teams,
  go,
}: {
  teams: Team[];
  go: (p: string) => void;
}) {
  return (
    <>
      <PageHead
        title="Equipes"
        desc="Conheça equipes que estão construindo dentro do ecossistema."
      />
      <div className="team-row">
        {teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            go={() => go(`/investor/teams/${t.slug}`)}
          />
        ))}
      </div>
    </>
  );
}
function InvestorCompetitions({ go }: { go: (p: string) => void }) {
  return (
    <>
      <PageHead
        title="Competições"
        desc="Acompanhe competições e oportunidades onde os projetos estão evoluindo."
      />
      <div className="competition-grid">
        {competitions.map((c) => (
          <CompetitionCard
            key={c.id}
            c={c}
            go={() => go(`/investor/competitions/${c.slug}`)}
          />
        ))}
      </div>
    </>
  );
}

function InvestorTeamDetail({
  slug,
  go,
  teams,
  projects,
}: {
  slug: string;
  go: (p: string) => void;
  teams: Team[];
  projects: Project[];
}) {
  const team = teams.find((t) => t.slug === slug);
  if (!team) return <NotFound go={go} />;
  return (
    <>
      <button className="back" onClick={() => go("/investor/teams")}>
        <ArrowLeft size={16} /> Equipes
      </button>
      <div className="team-hero panel">
        <Avatar name={team.name} />
        <div>
          <span className="eyebrow">EQUIPE</span>
          <h1>{team.name}</h1>
          <p>{team.description}</p>
          <div className="meta-row">
            <span>
              <Building2 size={14} />
              {team.institution}
            </span>
            <span>
              <MapPin size={14} />
              {team.city}
            </span>
          </div>
          <div className="chips">
            {team.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <section className="panel prose">
          <h2>Projetos da equipe</h2>
          <div className="project-grid">
            {projects
              .filter((p) => team.projects.includes(p.id))
              .map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  go={() => go(`/investor/projects/${p.slug}`)}
                />
              ))}
          </div>
        </section>
        <aside className="panel project-side">
          <h3>{team.members.length} integrantes</h3>
          {team.members.map((m) => {
            const user = people.find((p) => p.id === m.userId);
            return user ? (
              <div className="member" key={m.userId}>
                <Avatar name={user.name} />
                <div>
                  <b>{user.name}</b>
                  <small>{m.role}</small>
                </div>
              </div>
            ) : null;
          })}
        </aside>
      </div>
    </>
  );
}
function InvestorCompetitionDetail({
  slug,
  go,
  setToast,
}: {
  slug: string;
  go: (p: string) => void;
  setToast: (s: string) => void;
}) {
  const c = competitions.find((x) => x.slug === slug);
  if (!c) return <NotFound go={go} />;
  return (
    <>
      <button className="back" onClick={() => go("/investor/competitions")}>
        <ArrowLeft size={16} /> Competições
      </button>
      <div className="competition-hero panel">
        <div>
          <span className="eyebrow">OPORTUNIDADE</span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="meta-row">
            <span>{c.organization}</span>
            <span>{c.location}</span>
            <span>{c.format}</span>
          </div>
        </div>
        <button
          className="primary"
          onClick={() =>
            setToast("Competição adicionada aos seus acompanhamentos.")
          }
        >
          Acompanhar oportunidade
        </button>
      </div>
      <section className="panel prose">
        <h2>Informações</h2>
        <p>
          <b>Status:</b> {c.status}
        </p>
        {c.deadline && (
          <p>
            <b>Inscrições:</b> até {c.deadline}
          </p>
        )}
        <h2>Categorias</h2>
        <div className="chips">
          {c.categories.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        {c.prize && (
          <p>
            <b>Premiação:</b> {c.prize}
          </p>
        )}
      </section>
    </>
  );
}

function InvestorHome({
  go,
  projects,
  teams,
}: {
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const filtered = projects.filter(
    (p) =>
      (!q || `${p.title} ${p.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) &&
      (!filter || `${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(filter.toLowerCase())),
  );
  return (
    <>
      <PageHead
        title="Descubra projetos com potencial."
        desc="Encontre equipes que estão evoluindo soluções — sem rankings financeiros artificiais."
      />
      <label className="investor-search">
        <Search />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar projetos, tecnologias, equipes..."
        />
      </label>
      <div className="quick-filters">
        {[
          "Educação",
          "Tecnologia",
          "Sustentabilidade",
          "Saúde",
          "IA",
          "Robótica",
        ].map((x) => (
          <button key={x} className={cx(filter === x && "selected")} onClick={() => setFilter(filter === x ? "" : x)}>{x}</button>
        ))}
      </div>
      <section className="section-block">
        <h2>Projetos em destaque</h2>
        <div className="project-grid">
          {filtered.slice(0, 3).map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              go={() => go(`/investor/projects/${p.slug}`)}
            />
          ))}
        </div>
      </section>
      <section className="section-block">
        <h2>Projetos em evolução</h2>
        <div className="list-cards">
          {filtered.map((p) => (
            <ProjectListItem
              key={p.id}
              p={p}
              go={() => go(`/investor/projects/${p.slug}`)}
            />
          ))}
        </div>
      </section>
      <section className="section-block">
        <h2>Equipes em destaque</h2>
        <div className="team-row">
          {teams.slice(0, 4).map((t) => (
            <TeamCard key={t.id} team={t} go={() => go(`/investor/teams/${t.slug}`)} />
          ))}
        </div>
      </section>
    </>
  );
}
function SavedProjects({
  go,
  projects,
  saved,
  toggleSaved,
}: {
  go: (p: string) => void;
  projects: Project[];
  saved: string[];
  toggleSaved: (id: string) => void;
}) {
  const list = projects.filter((p) => saved.includes(p.id));
  return (
    <>
      <PageHead
        title="Projetos salvos"
        desc="Uma lista privada para voltar aos projetos que chamaram sua atenção."
      />
      <div className="project-grid section-block">
        {list.length ? (
          list.map((p) => (
            <div key={p.id} className="card-wrap">
              <ProjectCard
                p={p}
                go={() => go(`/investor/projects/${p.slug}`)}
              />
              <button className="card-action" onClick={() => toggleSaved(p.id)}>
                Remover
              </button>
            </div>
          ))
        ) : (
          <Empty
            title="Nenhum projeto salvo"
            desc="Salve projetos durante a descoberta para revisitá-los aqui."
            action="Descobrir projetos"
            onClick={() => go("/investor")}
          />
        )}
      </div>
    </>
  );
}
function FollowingProjects({
  go,
  projects,
  following,
}: {
  go: (p: string) => void;
  projects: Project[];
  following: string[];
}) {
  const list = projects.filter((p) => following.includes(p.id));
  return (
    <>
      <PageHead
        title="Seguindo"
        desc="Projetos que você segue para receber notificações de competições, arquivos e avanços."
      />
      <div className="list-cards section-block">
        {list.length ? (
          list.map((p) => (
            <ProjectListItem
              key={p.id}
              p={p}
              go={() => go(`/investor/projects/${p.slug}`)}
            />
          ))
        ) : (
          <Empty
            title="Você ainda não segue projetos"
            desc="Abra um projeto e escolha seguir para receber notificações de evolução."
            action="Descobrir projetos"
            onClick={() => go("/investor")}
          />
        )}
      </div>
    </>
  );
}

function ProjectCard({ p, go }: { p: Project; go: () => void }) {
  return (
    <button className="project-card" onClick={go}>
      <div className="project-cover">
        <span className="project-initial">{p.title[0]}</span>
        <Stage value={p.stage} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{p.category}</span>
          <span>{p.location.split(",")[0]}</span>
        </div>
        <h3>{p.title}</h3>
        <p>{p.shortDescription}</p>
        <div className="chips compact">
          {p.tags.slice(0, 3).map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </div>
    </button>
  );
}
function ProjectListItem({ p, go }: { p: Project; go: () => void }) {
  return (
    <button className="project-list-item" onClick={go}>
      <div className="project-icon">{p.title[0]}</div>
      <div className="grow">
        <div className="meta-row">
          <Stage value={p.stage} />
          <span>{p.category}</span>
        </div>
        <b>{p.title}</b>
        <p>{p.shortDescription}</p>
      </div>
      <ArrowRight size={17} />
    </button>
  );
}
function TeamCard({ team, go }: { team: Team; go: () => void }) {
  return (
    <button className="team-card" onClick={go}>
      <Avatar name={team.name} />
      <h3>{team.name}</h3>
      <p>{team.description}</p>
      <div className="chips compact">
        {team.tags.slice(0, 2).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <small>
        {team.members.length} integrantes · {team.projects.length} projeto(s)
      </small>
    </button>
  );
}
function TeamWide({ team, go }: { team: Team; go: () => void }) {
  const myRole = team.members.find((m) => m.userId === "u1")?.role || "Membro";
  return (
    <button className="team-wide panel" onClick={go}>
      <Avatar name={team.name} />
      <div className="grow">
        <h3>{team.name}</h3>
        <p>{team.description}</p>
        <div className="meta-row">
          <span>{team.institution}</span>
          <span>{team.city}</span>
        </div>
      </div>
      <div className="team-role">
        <small>Sua função</small>
        <b>{myRole}</b>
      </div>
      <ArrowRight />
    </button>
  );
}
function CompetitionCard({ c, go }: { c: Competition; go: () => void }) {
  return (
    <button className="competition-card" onClick={go}>
      <div className="competition-banner">
        <Trophy />
        <span>{c.type === "external" ? "Externa" : "Envista"}</span>
      </div>
      <div>
        <Stage value={c.status} />
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <div className="meta-stack">
          <span>
            <Building2 size={14} />
            {c.organization}
          </span>
          <span>
            <MapPin size={14} />
            {c.location}
          </span>
          {c.deadline && (
            <span>
              <Clock3 size={14} />
              Até {c.deadline}
            </span>
          )}
        </div>
        {c.prize && <b className="prize">{c.prize}</b>}
      </div>
    </button>
  );
}
function CourseCard({ course, go }: { course: Course; go: () => void }) {
  return (
    <button className="course-card" onClick={go}>
      <div className="course-thumb">
        <BookOpen />
      </div>
      <div>
        <span className="eyebrow">CURSO ENVISTA</span>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <small>
          {course.level} · {course.duration}
        </small>
      </div>
    </button>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
function Tabs({
  values,
  value,
  setValue,
}: {
  values: string[];
  value: string;
  setValue: (s: string) => void;
}) {
  return (
    <div className="tabs">
      {values.map((x) => (
        <button
          key={x}
          className={cx(value === x && "active")}
          onClick={() => setValue(x)}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
function Empty({
  title,
  desc,
  action,
  onClick,
}: {
  title: string;
  desc: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      <div>
        <FolderKanban />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && (
        <button className="secondary" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Fechar modal" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function NotFound({ go }: { go: (p: string) => void }) {
  return (
    <Empty
      title="Conteúdo não encontrado"
      desc="Essa rota não existe ou não está disponível para este perfil."
      action="Voltar ao início"
      onClick={() => go("/app")}
    />
  );
}
function CommandPalette({
  close,
  go,
  projects,
  teams,
}: {
  close: () => void;
  go: (p: string) => void;
  projects: Project[];
  teams: Team[];
}) {
  const [q, setQ] = useState("");
  const items = [
    ...projects.map((p) => ({
      type: "Projeto",
      name: p.title,
      path: `/app/projects/${p.slug}`,
    })),
    ...teams.map((t) => ({
      type: "Equipe",
      name: t.name,
      path: `/app/teams/${t.slug}`,
    })),
    ...courses.map((c) => ({
      type: "Curso",
      name: c.title,
      path: `/app/learn/${c.slug}`,
    })),
    ...competitions.map((c) => ({
      type: "Competição",
      name: c.title,
      path: `/app/competitions/${c.slug}`,
    })),
  ].filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="modal-backdrop command-backdrop" onMouseDown={close}>
      <div className="command" onMouseDown={(e) => e.stopPropagation()}>
        <div className="command-input">
          <Search />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no Envista"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-results">
          {items.slice(0, 10).map((i) => (
            <button key={i.path} onClick={() => go(i.path)}>
              <span>{i.type}</span>
              <b>{i.name}</b>
              <ArrowRight />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
