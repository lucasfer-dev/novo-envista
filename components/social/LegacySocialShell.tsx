"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  Compass,
  Eye,
  FolderKanban,
  GraduationCap,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PanelsTopLeft,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { isNavItemActive } from "@/lib/navigation";
import TaxonomyNavigationEnhancer from "@/components/explore/TaxonomyNavigationEnhancer";
import NotificationsBell from "@/components/real/NotificationsBell";
import GlobalSearchCommand from "@/components/product/GlobalSearchCommand";
import type { User } from "@/types";
import type { ProductRole } from "@/lib/auth/require-product-user";

const participantNav = [
  ["/home", Home, "Início"],
  ["/social", Activity, "Social"],
  ["/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Meus projetos"],
  ["/teams", Users, "Minhas equipes"],
  ["/workspace", PanelsTopLeft, "Workspace"],
  ["/insights", BarChart3, "Insights"],
  ["/interests", BriefcaseBusiness, "Interesses recebidos"],
  ["/competitions", Trophy, "Competições"],
  ["/calendar", CalendarDays, "Calendário"],
  ["/learn", GraduationCap, "Aprender"],
  ["/messages", MessageCircle, "Mensagens"],
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
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return <span className="avatar">{initials(name)}</span>;
}

export default function LegacySocialShell({ user, role, pathname: activePath, children }: { user: User; role: ProductRole; pathname?: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = activePath ?? (role === "investor" ? "/investor/social" : "/social");
  const normalizedPathname = role === "participant" && pathname.startsWith("/app/")
    ? pathname.slice(4)
    : pathname === "/app"
      ? "/home"
      : pathname;
  const nav = role === "investor" ? investorNav : participantNav;
  const mobileNav = role === "investor" ? investorMobileNav : participantMobileNav;
  const prefix: "" | "/investor" = role === "investor" ? "/investor" : "";
  const home = role === "investor" ? "/investor" : "/home";
  const profile = role === "investor" ? "/investor/profile" : "/account/profile";

  const closeMobile = () => setMobileOpen(false);
  const logout = async () => {
    await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  };

  return (
    <div className="app-shell" data-envista-product-shell>
      <a className="a11y-skip-link" href="#main-content">Pular para o conteúdo</a>
      <TaxonomyNavigationEnhancer />
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Fechar navegação" onClick={closeMobile} />}

      <aside id="app-navigation" aria-label="Navegação principal" className={cx("sidebar", mobileOpen && "mobile-open")}>
        <button className="mobile-close" aria-label="Fechar navegação" onClick={closeMobile}><X size={20} /></button>

        <Link className="brand envista-brand-lockup" href={home} onClick={closeMobile} aria-label="Ir para o início do Envista">
          <img src="/brand/envista-symbol-gradient.svg" alt="" />
          <b>Envista</b>
        </Link>

        <nav aria-label="Seções do produto">
          {nav.map(([href, Icon, label]) => {
            const activeHref = role === "participant" && href.startsWith("/app/") ? href.slice(4) : href;
            const active = isNavItemActive(normalizedPathname, activeHref);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={cx(active && "active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="side-section">
          <span>Conta</span>
          {[
            [profile, CircleUserRound, "Perfil"],
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
              >
                <Icon size={18} aria-hidden="true" /> {label as string}
              </Link>
            );
          })}
        </div>

        <div className="side-bottom">
          <div className="user-card">
            <Link className="profile-avatar-btn" aria-label="Abrir meu perfil" href={profile} onClick={closeMobile}><Avatar name={user.name} /></Link>
            <div>
              <Link href={profile} onClick={closeMobile}><b>{user.name}</b></Link>
              <small>@{user.username} · {role === "investor" ? "Investidor" : "Participante"}</small>
            </div>
            <button aria-label="Sair" onClick={logout}><LogOut size={17} aria-hidden="true" /></button>
          </div>
        </div>
      </aside>

      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="app-navigation" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button>
          <GlobalSearchCommand label={role === "investor" ? "Buscar projetos, equipes e pessoas" : "Buscar no Envista"} />
          <div className="top-actions">
            <NotificationsBell userId={user.id} prefix={prefix} dark />
            <Link className="profile-avatar-btn" aria-label="Abrir meu perfil" href={profile}><Avatar name={user.name} /></Link>
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>

      <nav className="bottom-nav" aria-label="Navegação móvel">
        {mobileNav.map(([href, Icon, label]) => {
          const activeHref = role === "participant" && href.startsWith("/app/") ? href.slice(4) : href;
          const active = isNavItemActive(normalizedPathname, activeHref);
          return (
            <Link key={href} href={href} onClick={closeMobile} className={cx(active && "active")} aria-current={active ? "page" : undefined}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileOpen(true)} className={cx(!mobileNav.some(([href]) => isNavItemActive(normalizedPathname, role === "participant" && href.startsWith("/app/") ? href.slice(4) : href)) && "active")} aria-label="Abrir mais destinos" aria-expanded={mobileOpen} aria-controls="app-navigation"><MoreHorizontal size={19} aria-hidden="true" /><span>Mais</span></button>
      </nav>
    </div>
  );
}
