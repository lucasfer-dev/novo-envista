"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Bookmark,
  CircleUserRound,
  Compass,
  Eye,
  FolderKanban,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { isNavItemActive } from "@/lib/navigation";
import type { User } from "@/types";
import type { ProductRole } from "@/lib/auth/require-product-user";

const participantNav = [
  ["/app", Home, "Início"],
  ["/app/social", Activity, "Social"],
  ["/app/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Meus projetos"],
  ["/app/teams", Users, "Minhas equipes"],
  ["/app/competitions", Trophy, "Competições"],
  ["/app/learn", GraduationCap, "Aprender"],
  ["/app/messages", MessageCircle, "Mensagens"],
] as const;

const investorNav = [
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

const participantMobileNav = [
  ["/app", Home, "Início"],
  ["/app/explore", Compass, "Explorar"],
  ["/app/projects", FolderKanban, "Projetos"],
  ["/app/messages", MessageCircle, "Mensagens"],
] as const;

const investorMobileNav = [
  ["/investor", Home, "Início"],
  ["/investor/explore", Compass, "Explorar"],
  ["/investor/saved", Bookmark, "Salvos"],
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

function Avatar({ name }: { name: string }) {
  return <span className="avatar">{initials(name)}</span>;
}

export default function LegacySocialShell({
  user,
  role,
  children,
}: {
  user: User;
  role: ProductRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const pathname = role === "investor" ? "/investor/social" : "/app/social";
  const nav = role === "investor" ? investorNav : participantNav;
  const mobileNav = role === "investor" ? investorMobileNav : participantMobileNav;
  const home = role === "investor" ? "/investor" : "/app";
  const profile = role === "investor" ? "/investor/profile" : `/app/profile/${user.username}`;
  const settings = role === "investor" ? "/investor/settings" : "/app/settings";

  const go = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const logout = async () => {
    await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-navigation"
        aria-label="Navegação principal"
        className={cx("sidebar", mobileOpen && "mobile-open")}
      >
        <button className="mobile-close" aria-label="Fechar navegação" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>

        <button className="brand" onClick={() => go(home)}>
          <img src="/envista-logo.png" alt="" />
          <b>Envista</b>
        </button>

        <nav>
          {nav.map(([href, Icon, label]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className={cx(isNavItemActive(pathname, href) && "active")}
              aria-current={isNavItemActive(pathname, href) ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {role === "participant" && (
          <div className="side-section">
            <span>Configurações</span>
            <button onClick={() => go(profile)}>
              <CircleUserRound size={18} /> Perfil
            </button>
            <button onClick={() => go("/app/settings#preferences")}>
              <Settings size={18} /> Preferências
            </button>
            <button onClick={() => go("/app/settings#notifications")}>
              <Bell size={18} /> Notificações
            </button>
          </div>
        )}

        <div className="side-bottom">
          {role === "investor" && (
            <button onClick={() => go(settings)}>
              <Settings size={18} /> Configurações
            </button>
          )}
          <div className="user-card">
            <button className="profile-avatar-btn" aria-label="Abrir meu perfil" onClick={() => go(profile)}>
              <Avatar name={user.name} />
            </button>
            <div>
              <b>{user.name}</b>
              <small>@{user.username} · {role === "investor" ? "Investidor" : "Participante"}</small>
            </div>
            <button aria-label="Sair" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Abrir navegação"
            aria-expanded={mobileOpen}
            aria-controls="app-navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </button>

          <button className="global-search" onClick={() => go(`${home}/explore`.replace("/app/explore", "/app/explore").replace("/investor/explore", "/investor/explore"))}>
            <Search size={17} />
            <span>Buscar no Envista</span>
          </button>

          <div className="top-actions">
            <button className="icon-btn" aria-label="Notificações" onClick={() => setNotifyOpen((open) => !open)}>
              <Bell size={19} />
            </button>
            <button className="profile-avatar-btn" aria-label="Abrir meu perfil" onClick={() => go(profile)}>
              <Avatar name={user.name} />
            </button>
          </div>

          {notifyOpen && (
            <div className="popover notifications">
              <div className="popover-head"><b>Notificações</b></div>
              <div className="notification">Novos posts e atualizações dos seus acompanhamentos aparecem no Social.</div>
            </div>
          )}
        </header>

        <div className="page-wrap">{children}</div>
      </main>

      <nav className="bottom-nav">
        {mobileNav.map(([href, Icon, label]) => (
          <button
            key={href}
            onClick={() => go(href)}
            className={cx(isNavItemActive(pathname, href) && "active")}
            aria-current={isNavItemActive(pathname, href) ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className={cx(!mobileNav.some(([href]) => isNavItemActive(pathname, href)) && "active")}
          aria-label="Abrir mais destinos"
          aria-expanded={mobileOpen}
          aria-controls="app-navigation"
        >
          <MoreHorizontal size={19} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
