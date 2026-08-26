"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { User } from "@/types";
import styles from "./ProductShell.module.css";

type Props = { user: User; children: React.ReactNode; title?: string };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ProductShell({ user, children, title = "Envista" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const prefix = user.role === "investor" ? "/investor" : "/app";
  const nav = user.role === "investor"
    ? [
        [prefix, "Início"],
        [`${prefix}/social`, "Social"],
        [`${prefix}/explore`, "Explorar"],
        [`${prefix}/projects`, "Meus projetos"],
        [`${prefix}/teams`, "Minhas equipes"],
        [`${prefix}/saved`, "Projetos salvos"],
        [`${prefix}/following`, "Seguindo"],
        [`${prefix}/messages`, "Mensagens"],
      ]
    : [
        [prefix, "Início"],
        [`${prefix}/social`, "Social"],
        [`${prefix}/explore`, "Explorar"],
        [`${prefix}/projects`, "Meus projetos"],
        [`${prefix}/teams`, "Minhas equipes"],
        [`${prefix}/learn`, "Aprender"],
        [`${prefix}/messages`, "Mensagens"],
      ];

  async function logout() {
    await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/login");
  }

  return (
    <div className={styles.shell}>
      {open && <button className={styles.backdrop} aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
      <aside className={styles.sidebar} data-open={open}>
        <Link className={styles.brand} href={prefix} onClick={() => setOpen(false)}>
          <img src="/envista-logo.png" alt="" />
          <span>Envista</span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          {nav.map(([href, label]) => {
            const active = href === prefix ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} data-active={active} onClick={() => setOpen(false)}>{label}</Link>;
          })}
        </nav>
        <div className={styles.bottom}>
          <Link className={styles.profile} href="/account/profile">
            <span className={styles.avatar}>{initials(user.name)}</span>
            <span className={styles.meta}><strong>{user.name}</strong><span>@{user.username}</span></span>
          </Link>
          <button className={styles.logout} onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menu} aria-label="Abrir navegação" onClick={() => setOpen(true)}>☰</button>
          <span className={styles.topbarTitle}>{title}</span>
          <span>@{user.username}</span>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
