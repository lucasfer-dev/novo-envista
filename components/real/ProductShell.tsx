"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bookmark,
  BookOpen,
  BriefcaseBusiness,
  Compass,
  Eye,
  FolderKanban,
  Home,
  Menu,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NotificationsBell from "@/components/real/NotificationsBell";
import type { User } from "@/types";
import styles from "./ProductShell.module.css";

type Props = { user: User; children: React.ReactNode; title?: string };
type NavItem = { href: string; label: string; Icon: LucideIcon };

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function initials(name: unknown) {
  return safeText(name, "Envista")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function ProductShell({ user, children, title = "Envista" }: Props) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const prefix: "/app" | "/investor" = user.role === "investor" ? "/investor" : "/app";
  const displayName = safeText(user.name, "Usuário");
  const username = safeText(user.username, "usuario");

  const nav: NavItem[] = user.role === "investor"
    ? [
        { href: prefix, label: "Início", Icon: Home },
        { href: `${prefix}/social`, label: "Social", Icon: Activity },
        { href: `${prefix}/explore`, label: "Explorar", Icon: Compass },
        { href: `${prefix}/projects`, label: "Meus projetos", Icon: FolderKanban },
        { href: `${prefix}/teams`, label: "Minhas equipes", Icon: Users },
        { href: `${prefix}/interests`, label: "Meus interesses", Icon: BriefcaseBusiness },
        { href: `${prefix}/saved`, label: "Projetos salvos", Icon: Bookmark },
        { href: `${prefix}/following`, label: "Seguindo", Icon: Eye },
        { href: `${prefix}/messages`, label: "Mensagens", Icon: MessageCircle },
      ]
    : [
        { href: prefix, label: "Início", Icon: Home },
        { href: `${prefix}/social`, label: "Social", Icon: Activity },
        { href: `${prefix}/explore`, label: "Explorar", Icon: Compass },
        { href: `${prefix}/projects`, label: "Meus projetos", Icon: FolderKanban },
        { href: `${prefix}/interests`, label: "Interesses recebidos", Icon: BriefcaseBusiness },
        { href: `${prefix}/teams`, label: "Minhas equipes", Icon: Users },
        { href: `${prefix}/learn`, label: "Aprender", Icon: BookOpen },
        { href: `${prefix}/messages`, label: "Mensagens", Icon: MessageCircle },
      ];

  const mobilePaths = user.role === "investor"
    ? new Set([prefix, `${prefix}/explore`, `${prefix}/saved`, `${prefix}/messages`])
    : new Set([prefix, `${prefix}/explore`, `${prefix}/projects`, `${prefix}/messages`]);
  const mobileNav = nav.filter((item) => mobilePaths.has(item.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const sidebar = sidebarRef.current;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusable = () => Array.from(sidebar?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => focusable()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [open]);

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
      window.location.assign(response.ok || response.redirected ? "/login" : "/login?error=signout");
    } catch {
      window.location.assign("/login?error=signout");
    }
  }

  return (
    <div className={styles.shell}>
      {open && <button className={styles.backdrop} aria-label="Fechar navegação" onClick={() => setOpen(false)} />}

      <aside ref={sidebarRef} id="product-navigation" className={styles.sidebar} data-open={open}>
        <div className={styles.sidebarHeader}>
          <Link className={styles.brand} href={prefix} onClick={() => setOpen(false)}>
            <img src="/envista-logo.png" alt="" />
            <span>Envista</span>
          </Link>
          <button className={styles.sidebarClose} type="button" aria-label="Fechar navegação" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
          </button>
        </div>

        <span className={styles.navLabel}>Produto</span>
        <nav className={styles.nav} aria-label="Navegação principal">
          {nav.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href, prefix);
            return (
              <Link key={href} href={href} data-active={active} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.accountSection}>
          <span className={styles.navLabel}>Conta</span>
          <Link href="/account/profile" onClick={() => setOpen(false)}>
            <UserRound size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>Perfil</span>
          </Link>
          <Link href="/account" onClick={() => setOpen(false)}>
            <Settings size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>Configurações</span>
          </Link>
        </div>

        <div className={styles.bottom}>
          <Link className={styles.profile} href="/account">
            <span className={styles.avatar}>{initials(displayName)}</span>
            <span className={styles.meta}>
              <strong>{displayName}</strong>
              <span>@{username}</span>
            </span>
          </Link>
          <button className={styles.logout} onClick={logout} disabled={signingOut}>
            {signingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button ref={menuButtonRef} className={styles.menu} aria-label="Abrir navegação" aria-expanded={open} aria-controls="product-navigation" onClick={() => setOpen(true)}>
            <Menu aria-hidden="true" />
          </button>

          <span className={styles.topbarTitle}>{title}</span>

          <form className={styles.searchForm} action={`${prefix}/search`} method="get">
            <Search className={styles.searchIcon} size={16} aria-hidden="true" />
            <input className={styles.searchInput} name="q" maxLength={80} aria-label="Buscar no Envista" placeholder="Buscar projetos, equipes ou pessoas..." />
          </form>

          <div className={styles.topbarActions}>
            <NotificationsBell userId={user.id} prefix={prefix} />
            <Link className={styles.topProfile} href="/account" aria-label="Abrir minha conta">
              <span className={styles.topAvatar}>{initials(displayName)}</span>
              <span>@{username}</span>
            </Link>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>

      <nav className={styles.bottomNav} aria-label="Navegação rápida">
        {mobileNav.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href, prefix);
          return (
            <Link key={href} href={href} data-active={active} aria-current={active ? "page" : undefined}>
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label.replace("Meus ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
