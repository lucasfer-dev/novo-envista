"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Compass,
  Eye,
  FolderKanban,
  GitBranch,
  GraduationCap,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Rocket,
  ArrowRight,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { isNavItemActive } from "@/lib/navigation";
import TaxonomyNavigationEnhancer from "@/components/explore/TaxonomyNavigationEnhancer";
import NotificationsBell from "@/components/real/NotificationsBell";
import SidebarNavIcon from "@/components/social/SidebarNavIcon";
import GlobalSearchCommand from "@/components/product/GlobalSearchCommand";
import type { User } from "@/types";
import type { ProductRole } from "@/lib/auth/require-product-user";

const participantNav = [
  ["/home", Home, "Página Inicial"],
  ["/explore", Compass, "Explorar"],
  ["/notifications", Bell, "Notificações"],
  ["/social", Activity, "Social"],
  ["/messages", MessageCircle, "Mensagens"],
  ["/app/projects", FolderKanban, "Projetos"],
  ["/teams", Users, "Equipes"],
  ["/competitions", Trophy, "Competições"],
  ["/learn", GraduationCap, "Aprender"],
] as const;

const investorNav = [
  ["/investor", Home, "Início"],
  ["/investor/explore", Compass, "Radar"],
  ["/investor/interests", BriefcaseBusiness, "Pipeline"],
  ["/investor/saved", Bookmark, "Projetos salvos"],
  ["/investor/activity", Bell, "Atividade"],
  ["/investor/social", Activity, "Atualizações"],
  ["/investor/following", Eye, "Seguindo"],
  ["/investor/competitions", Trophy, "Competições"],
  ["/investor/calendar", CalendarDays, "Calendário"],
  ["/investor/messages", MessageCircle, "Mensagens"],
  ["/investor/verification", BadgeCheck, "Verificação"],
  ["/investor/profile", CircleUserRound, "Perfil"],
] as const;

const participantMobileNav = [
  ["/home", Home, "Início"],
  ["/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Projetos"],
  ["/messages", MessageCircle, "Mensagens"],
] as const;

const investorMobileNav = [
  ["/investor", Home, "Início"],
  ["/investor/explore", Compass, "Radar"],
  ["/investor/interests", BriefcaseBusiness, "Pipeline"],
  ["/investor/messages", MessageCircle, "Mensagens"],
] as const;

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return <span className="avatar">{src ? <img src={src} alt="" loading="lazy" /> : initials(name)}</span>;
}

export default function LegacySocialShell({
  user,
  role,
  pathname: activePath,
  avatarUrl,
  children,
}: {
  user: User;
  role: ProductRole;
  pathname?: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (role !== "participant") return;
    try {
      setSidebarCollapsed(window.localStorage.getItem("envista:sidebar:collapsed") === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, [role]);
  const navigationRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const navigation = navigationRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navigation?.querySelector<HTMLButtonElement>(".mobile-close")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const controls = Array.from(
        navigation?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) || [],
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuRef.current?.focus();
    };
  }, [mobileOpen]);
  const pathname =
    activePath ?? (role === "investor" ? "/investor/social" : "/social");
  const normalizedPathname =
    role === "participant" && pathname.startsWith("/app/")
      ? pathname.slice(4)
      : pathname === "/app"
        ? "/home"
        : pathname;
  const homeReference = role === "participant" && (pathname === "/home" || pathname === "/explore" || pathname === "/social");
  const socialReference = role === "participant" && pathname === "/social";
  const dashboardHome = role === "participant" && pathname === "/home";
  const nav = role === "investor" ? investorNav : participantNav;
  const mobileNav =
    role === "investor" ? investorMobileNav : participantMobileNav;
  const prefix: "" | "/investor" = role === "investor" ? "/investor" : "";
  const home = role === "investor" ? "/investor" : "/home";
  const profile =
    role === "investor" ? "/investor/profile" : "/account/profile";

  const closeMobile = () => setMobileOpen(false);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      window.localStorage.setItem("envista:sidebar:collapsed", String(next));
    } catch {}
  };
  const logout = async () => {
    await fetch("/auth/signout", {
      method: "POST",
      credentials: "same-origin",
    });
    window.location.assign("/login");
  };

  return (
    <div className="app-shell" data-envista-product-shell data-envista-home-reference={homeReference ? "true" : undefined} data-envista-home-page={role === "participant" && pathname === "/home" ? "true" : undefined} data-envista-social-reference={socialReference ? "true" : undefined} data-envista-x-sidebar={role === "participant" ? "true" : undefined} data-envista-clean-explore={role === "participant" && pathname === "/explore" ? "true" : undefined} data-sidebar-collapsed={role === "participant" && sidebarCollapsed ? "true" : undefined}>
      <a className="a11y-skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <TaxonomyNavigationEnhancer />
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar navegação"
          onClick={closeMobile}
        />
      )}
      {role === "participant" ? (
        <button
          type="button"
          className="envista-sidebar-handle"
          aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-controls="app-navigation"
          aria-expanded={!sidebarCollapsed}
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
        </button>
      ) : null}

      <aside
        ref={navigationRef}
        id="app-navigation"
        aria-label="Navegação principal"
        className={cx("sidebar", mobileOpen && "mobile-open")}
      >
        <button
          className="mobile-close"
          aria-label="Fechar navegação"
          onClick={closeMobile}
        >
          <X size={20} />
        </button>

        <Link
          className="brand envista-brand-lockup"
          href={home}
          onClick={closeMobile}
          aria-label="Ir para o início do Envista"
        >
          <img src="/brand/envista-symbol-gradient.svg" alt="" />
          <strong>ENVISTA</strong>
        </Link>

        <nav aria-label="Seções do produto">
          {nav.map(([href, Icon, label]) => {
            const activeHref =
              role === "participant" && href.startsWith("/app/")
                ? href.slice(4)
                : href;
            const active = isNavItemActive(normalizedPathname, activeHref);
            if (href === "/notifications") {
              return <NotificationsBell key={href} userId={user.id} prefix={prefix} variant="sidebar" active={active} onNavigate={closeMobile} />;
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={cx(active && "active")}
                aria-current={active ? "page" : undefined}
                title={role === "participant" ? label : undefined}
                aria-label={label}
              >
                <SidebarNavIcon href={href} active={active} OutlineIcon={Icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>


        {role === "participant" ? (
          <div className="dashboard-home-group">
            <span className="dashboard-home-label">CRIAR</span>
            <Link className="dashboard-new-project" href="/app/projects/new" onClick={closeMobile} title="Novo projeto" aria-label="Novo projeto">
              <Plus size={24} aria-hidden="true" /><span>Novo projeto</span>
            </Link>
          </div>
        ) : (
          <div className="side-section">
          <span>Conta</span>
          {[
            [profile, CircleUserRound, "Perfil"],
            ["/integrations/github", GitBranch, "Integrações"],
            ["/account/settings", Settings, "Configurações"],
            [`${prefix}/activity`, Bell, "Central de atividade"],
            ["/account/feedback", LifeBuoy, "Feedback e suporte"],
          ].map(([href, Icon, label]) => {
            const active = isNavItemActive(normalizedPathname, href as string);
            return (
              <Link
                key={href as string}
                href={href as string}
                onClick={closeMobile}
                className={cx(active && "active")}
                aria-current={active ? "page" : undefined}
                title={label as string}
                aria-label={label as string}
              >
                <SidebarNavIcon href={href as string} active={active} OutlineIcon={Icon as typeof Home} size={18} /> <span>{label as string}</span>
              </Link>
            );
          })}
        </div>
        )}
        {role === "participant" && (
          <Link
            className="sidebar-plans-promo"
            href="/plans"
            onClick={closeMobile}
            aria-label="Conhecer os planos do Envista"
            title={sidebarCollapsed ? "Conhecer planos do Envista" : undefined}
          >
            <span className="sidebar-plans-eyebrow">EVOLUA NO ENVISTA</span>
            <span className="sidebar-plans-rocket" aria-hidden="true"><Rocket size={23} strokeWidth={1.9} /></span>
            <strong className="sidebar-plans-title">Envista <span>Pro</span></strong>
            <span className="sidebar-plans-description">Mais recursos, visibilidade e oportunidades.</span>
            <span className="sidebar-plans-link">Conhecer planos <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>
        )}
        <div className="side-bottom">
          {role === "participant" && (
            <Link
              className="sidebar-settings-link"
              href="/account/settings"
              onClick={closeMobile}
              aria-current={isNavItemActive(normalizedPathname, "/account/settings") ? "page" : undefined}
              aria-label="Configurações"
              title="Configurações"
            >
              <Settings size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>Configurações</span>
            </Link>
          )}
          <div className="user-card">
            <Link
              className="profile-avatar-btn"
              aria-label="Abrir meu perfil"
              href={profile}
              onClick={closeMobile}
            >
              <Avatar name={user.name} src={avatarUrl} />
            </Link>
            <div>
              <Link href={profile} onClick={closeMobile}>
                <b>{user.name}</b>
              </Link>
              <small>
                @{user.username} ·{" "}
                {role === "investor" ? "Investidor" : "Participante"}
              </small>
            </div>
            <button aria-label="Sair" onClick={logout}>
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <button
            ref={menuRef}
            className="mobile-menu"
            aria-label="Abrir navegação"
            aria-expanded={mobileOpen}
            aria-controls="app-navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className={cx("topbar-search-command", role === "participant" && pathname === "/explore" && "topbar-search-command--hidden")}>
            <GlobalSearchCommand
              label={
                role === "investor"
                  ? "Buscar projetos, equipes e pessoas"
                  : dashboardHome ? "Buscar projetos, pessoas, equipes, competições, conteúdos..." : socialReference ? "Buscar projetos, pessoas, equipes ou competições..." : "Buscar no Envista"
              }
            />
          </div>
          <div className="top-actions">
            <NotificationsBell userId={user.id} prefix={prefix} dark />
            {dashboardHome ? <Link className="dashboard-top-user" href={profile} aria-label="Abrir meu perfil">
              <Avatar name={user.name} src={avatarUrl} />
              <span>{user.name}</span><ChevronDown size={17} aria-hidden="true" />
            </Link> : <Link
              className="profile-avatar-btn"
              aria-label="Abrir meu perfil"
              href={profile}
            >
              <Avatar name={user.name} src={avatarUrl} />
            </Link>}
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>

      <nav className="bottom-nav" aria-label="Navegação móvel">
        {mobileNav.map(([href, Icon, label]) => {
          const activeHref =
            role === "participant" && href.startsWith("/app/")
              ? href.slice(4)
              : href;
          const active = isNavItemActive(normalizedPathname, activeHref);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
              className={cx(active && "active")}
              aria-current={active ? "page" : undefined}
            >
              <SidebarNavIcon href={href} active={active} OutlineIcon={Icon} size={19} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className={cx(
            !mobileNav.some(([href]) =>
              isNavItemActive(
                normalizedPathname,
                role === "participant" && href.startsWith("/app/")
                  ? href.slice(4)
                  : href,
              ),
            ) && "active",
          )}
          aria-label="Abrir mais destinos"
          aria-expanded={mobileOpen}
          aria-controls="app-navigation"
        >
          <MoreHorizontal size={19} aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
