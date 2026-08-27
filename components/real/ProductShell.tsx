"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NotificationsBell from "@/components/real/NotificationsBell";
import type { User } from "@/types";
import styles from "./ProductShell.module.css";

type Props = { user: User; children: React.ReactNode; title?: string };

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

export default function ProductShell({ user, children, title = "Envista" }: Props) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const prefix: "/app" | "/investor" = user.role === "investor" ? "/investor" : "/app";
  const displayName = safeText(user.name, "Usuário");
  const username = safeText(user.username, "usuario");
  const nav = user.role === "investor"
    ? [
        [prefix, "Início"],
        [`${prefix}/social`, "Social"],
        [`${prefix}/explore`, "Explorar"],
        [`${prefix}/projects`, "Meus projetos"],
        [`${prefix}/teams`, "Minhas equipes"],
        [`${prefix}/interests`, "Meus interesses"],
        [`${prefix}/saved`, "Projetos salvos"],
        [`${prefix}/following`, "Seguindo"],
        [`${prefix}/messages`, "Mensagens"],
      ]
    : [
        [prefix, "Início"],
        [`${prefix}/social`, "Social"],
        [`${prefix}/explore`, "Explorar"],
        [`${prefix}/projects`, "Meus projetos"],
        [`${prefix}/interests`, "Interesses recebidos"],
        [`${prefix}/teams`, "Minhas equipes"],
        [`${prefix}/learn`, "Aprender"],
        [`${prefix}/messages`, "Mensagens"],
      ];

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
        <nav className={styles.nav} aria-label="Navegação principal">
          {nav.map(([href, label]) => {
            const active = href === prefix ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} data-active={active} onClick={() => setOpen(false)}>{label}</Link>;
          })}
        </nav>
        <div className={styles.bottom}>
          <Link className={styles.profile} href="/account">
            <span className={styles.avatar}>{initials(displayName)}</span>
            <span className={styles.meta}><strong>{displayName}</strong><span>@{username}</span></span>
          </Link>
          <button className={styles.logout} onClick={logout} disabled={signingOut}>{signingOut ? "Saindo…" : "Sair"}</button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button ref={menuButtonRef} className={styles.menu} aria-label="Abrir navegação" aria-expanded={open} aria-controls="product-navigation" onClick={() => setOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          <span className={styles.topbarTitle}>{title}</span>
          <form className={styles.searchForm} action={`${prefix}/search`} method="get">
            <input className={styles.searchInput} name="q" maxLength={80} aria-label="Buscar no Envista" placeholder="Buscar projetos, equipes ou pessoas..." />
          </form>
          <span className={styles.topbarActions}><NotificationsBell userId={user.id} prefix={prefix}/><span>@{username}</span></span>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
