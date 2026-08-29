"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Bookmark,
  Compass,
  Eye,
  FolderKanban,
  GraduationCap,
  Home,
  MessageCircle,
  Trophy,
  Users,
} from "lucide-react";
import NotificationsBell from "@/components/real/NotificationsBell";
import type { User } from "@/types";
import styles from "./ProductShell.module.css";

type Props = {
  user: User;
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "legacyDark";
};

type NavItem = [string, string, typeof Home];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ProductShell({ user, children, title = "Envista", variant = "default" }: Props) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const prefix: "/app" | "/investor" = user.role === "investor" ? "/investor" : "/app";
  const dark = variant === "legacyDark";
  const nav: NavItem[] = user.role === "investor"
    ? [
        [prefix, "Início", Home],
        [`${prefix}/social`, "Social", Activity],
        [`${prefix}/explore`, "Explorar", Compass],
        [`${prefix}/projects`, "Meus projetos", FolderKanban],
        [`${prefix}/teams`, "Minhas equipes", Users],
        [`${prefix}/competitions`, "Competições", Trophy],
        [`${prefix}/saved`, "Projetos salvos", Bookmark],
        [`${prefix}/following`, "Seguindo", Eye],
        [`${prefix}/messages`, "Mensagens", MessageCircle],
      ]
    : [
        [prefix, "Início", Home],
        [`${prefix}/social`, "Social", Activity],
        [`${prefix}/explore`, "Explorar", Compass],
        [`${prefix}/projects`, "Meus projetos", FolderKanban],
        [`${prefix}/teams`, "Minhas equipes", Users],
        [`${prefix}/competitions`, "Competições", Trophy],
        [`${prefix}/learn`, "Aprender", GraduationCap],
        [`${prefix}/messages`, "Mensagens", MessageCircle],
      ];

  async function logout() {
    await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  }

  return (
    <div className={`${styles.shell} ${dark ? styles.legacyDark : ""}`}>
      <a className="a11y-skip-link" href="#main-content">Pular para o conteúdo</a>
      {open && <button className={styles.backdrop} aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
      <aside id="product-navigation" className={styles.sidebar} data-open={open} aria-label="Navegação do produto">
        <Link className={styles.brand} href={prefix} prefetch={false} onClick={() => setOpen(false)}>
          <img src="/envista-logo.png" alt="" />
          <span>Envista</span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          {nav.map(([href, label, Icon]) => {
            const active = href === prefix ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} prefetch={false} data-active={active} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                {dark ? <Icon size={18} strokeWidth={1.9} aria-hidden="true" /> : null}
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.bottom}>
          <Link className={styles.profile} href="/account/profile" prefetch={false}>
            <span className={styles.avatar}>{initials(user.name)}</span>
            <span className={styles.meta}><strong>{user.name}</strong><span>@{user.username}</span></span>
          </Link>
          <button className={styles.logout} onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <header className={styles.topbar}>
          <button
            className={styles.menu}
            aria-label="Abrir navegação"
            aria-expanded={open}
            aria-controls="product-navigation"
            onClick={() => setOpen(true)}
          >☰</button>
          <span className={styles.topbarTitle}>{title}</span>
          <span className={styles.topbarActions}>
            <NotificationsBell userId={user.id} prefix={prefix} dark={dark} />
            <span>@{user.username}</span>
          </span>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
