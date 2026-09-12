"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
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
  ["/app", Home, "Início"],
  ["/app/social", Activity, "Social"],
  ["/app/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Meus projetos"],
  ["/app/teams", Users, "Minhas equipes"],
  ["/app/workspace", PanelsTopLeft, "Workspace"],
  ["/app/insights", BarChart3, "Insights"],
  ["/app/interests", BriefcaseBusiness, "Interesses recebidos"],
  ["/app/competitions", Trophy, "Competições"],
  ["/app/learn", GraduationCap, "Aprender"],
  ["/app/messages", MessageCircle, "Mensagens"],
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
  ["/investor/messages", MessageCircle, "Mensagens"],
  ["/investor/verification", BadgeCheck, "Verificação"],
  ["/investor/profile", CircleUserRound, "Perfil"],
] as const;

const participantMobileNav = [
  ["/app", Home, "Início"],
  ["/app/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Projetos"],
  ["/app/messages", MessageCircle, "Mensagens"],
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = activePath ?? (role === "investor" ? "/investor/social" : "/app/social");
  const nav = role === "investor" ? investorNav : participantNav;
  const mobileNav = role === "investor" ? investorMobileNav : participantMobileNav;
  const prefix: "/app" | "/investor" = role === "investor" ? "/investor" : "/app";
  const home = prefix;
  const profile = role === "investor" ? "/investor/profile" : `/app/profile/${user.username}`;

  const go = (path: string) => { router.push(path); setMobileOpen(false); };
  const logout = async () => { await fetch("/auth/signout", { method: "POST", credentials: "same-origin" }); window.location.assign("/login"); };

  return (
    <div className="app-shell">
      <a className="a11y-skip-link" href="#main-content">Pular para o conteúdo</a>
      <TaxonomyNavigationEnhancer />
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Fechar navegação" onClick={() => setMobileOpen(false)} />}

      <aside id="app-navigation" aria-label="Navegação principal" className={cx("sidebar", mobileOpen && "mobile-open")}>
        <button className="mobile-close" aria-label="Fechar navegação" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        <button className="brand" onClick={() => go(home)} aria-label="Ir para o início do Envista"><img src="/envista-logo.png" alt="" /><b>Envista</b></button>
        <nav aria-label="Seções do produto">
          {nav.map(([href, Icon, label]) => <button key={href} onClick={() => go(href)} className={cx(isNavItemActive(pathname, href) && "active")} aria-current={isNavItemActive(pathname, href) ? "page" : undefined}><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}
        </nav>

        <div className="side-section">
          <span>Conta</span>
          <button onClick={() => go(profile)}><CircleUserRound size={18} aria-hidden="true" /> Perfil</button>
          <button onClick={() => go("/account/settings")}><Settings size={18} aria-hidden="true" /> Configurações</button>
          <button onClick={() => go(`${prefix}/activity`)}><Bell size={18} aria-hidden="true" /> Central de atividade</button>
          <button onClick={() => go("/account/feedback")}><LifeBuoy size={18} aria-hidden="true" /> Feedback e suporte</button>
        </div>

        <div className="side-bottom">
          <div className="user-card">
            <button className="profile-avatar-btn" aria-label="Abrir meu perfil" onClick={() => go(profile)}><Avatar name={user.name} /></button>
            <div><b>{user.name}</b><small>@{user.username} · {role === "investor" ? "Investidor" : "Participante"}</small></div>
            <button aria-label="Sair" onClick={logout}><LogOut size={17} aria-hidden="true" /></button>
          </div>
        </div>
      </aside>

      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="app-navigation" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button>
          <GlobalSearchCommand label={role === "investor" ? "Buscar projetos, equipes e pessoas" : "Buscar no Envista"} />
          <div className="top-actions"><NotificationsBell userId={user.id} prefix={prefix} dark /><button className="profile-avatar-btn" aria-label="Abrir meu perfil" onClick={() => go(profile)}><Avatar name={user.name} /></button></div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>

      <nav className="bottom-nav" aria-label="Navegação móvel">
        {mobileNav.map(([href, Icon, label]) => <button key={href} onClick={() => go(href)} className={cx(isNavItemActive(pathname, href) && "active")} aria-current={isNavItemActive(pathname, href) ? "page" : undefined}><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
        <button onClick={() => setMobileOpen(true)} className={cx(!mobileNav.some(([href]) => isNavItemActive(pathname, href)) && "active")} aria-label="Abrir mais destinos" aria-expanded={mobileOpen} aria-controls="app-navigation"><MoreHorizontal size={19} aria-hidden="true" /><span>Mais</span></button>
      </nav>
    </div>
  );
}
