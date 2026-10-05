"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, CircleUserRound, Compass, FolderKanban, GitBranch, Home, LifeBuoy, LogOut, Menu, Plus, Settings, Trophy, MessageCircle, X } from "lucide-react";
import NotificationsBell from "@/components/real/NotificationsBell";
import GlobalSearchCommand from "@/components/product/GlobalSearchCommand";
import TaxonomyNavigationEnhancer from "@/components/explore/TaxonomyNavigationEnhancer";
import { productNavigation, productNavActive } from "@/lib/product-navigation";
import type { ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";
import styles from "./AppShell.module.css";

const icons = { home: Home, explore: Compass, projects: FolderKanban, competitions: Trophy, messages: MessageCircle };
function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase(); }

export default function AppShell({ user, role, pathname: activePath, children }: { user: User; role: ProductRole; pathname?: string; children: ReactNode }) {
  const route = usePathname();
  const pathname = route || activePath || "/home";
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const prefix = role === "investor" ? "/investor" : "";
  const home = role === "investor" ? "/investor" : "/home";
  const profile = "/account/profile";
  const nav = productNavigation(role);
  const account = [
    { href: profile, label: "Perfil", Icon: CircleUserRound },
    { href: "/integrations/github", label: "Integrações", Icon: GitBranch },
    { href: "/account/settings", label: "Configurações", Icon: Settings },
  ];

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menu.current?.focus(); }
      if (event.key !== "Tab") return;
      const items = sidebar.current?.querySelectorAll<HTMLElement>("a[href], button, summary");
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function logout() { await fetch("/auth/signout", { method: "POST", credentials: "same-origin" }); window.location.assign("/login"); }
  const close = () => setOpen(false);

  return <div className={`app-shell ${styles.shell}`} data-envista-product-shell>
    <a className="a11y-skip-link" href="#main-content">Pular para o conteúdo</a>
    <TaxonomyNavigationEnhancer />
    {open ? <button className={styles.backdrop} aria-label="Fechar navegação" onClick={close} /> : null}
    <aside ref={sidebar} id="app-navigation" className={styles.sidebar} data-open={open} aria-label="Navegação principal">
      <button className={styles.close} onClick={close} aria-label="Fechar navegação"><X size={20} /></button>
      <Link className={styles.brand} href={home} onClick={close}><Image src="/brand/envista-symbol-gradient.svg" alt="" width={30} height={36} /><strong>Envista</strong></Link>
      <p className={styles.tagline}>A rede de quem está construindo.</p>
      <nav className={styles.navigation} aria-label="Seções do produto">{nav.map(({ href, label, icon }) => {
        const Icon = icons[icon], active = productNavActive(pathname, href);
        return <Link href={href} key={href} onClick={close} aria-current={active ? "page" : undefined}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>;
      })}</nav>
      {role === "participant" ? <Link className={styles.create} href="/projects/new" onClick={close}><Plus size={18} /> Criar projeto</Link> : <Link className={styles.create} href="/investor/explore" onClick={close}><Compass size={18} /> Descobrir projetos</Link>}
      <div className={styles.account}>{account.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={close} aria-current={productNavActive(pathname, href) ? "page" : undefined}><Icon size={18} aria-hidden="true" />{label}</Link>)}</div>
      <details className={styles.resources}><summary>Recursos e atividade</summary><Link href={`${prefix}/activity`} onClick={close}><Bell size={16} /> Central de atividade</Link>{role === "participant" ? <Link href="/learn" onClick={close}>Aprender</Link> : <Link href="/investor/verification" onClick={close}>Verificação</Link>}<Link href="/account/feedback" onClick={close}><LifeBuoy size={16} /> Feedback e suporte</Link></details>
      <div className={styles.user}><Link href={profile} onClick={close}><span className={styles.avatar}>{initials(user.name)}</span><span><strong>{user.name}</strong><small>@{user.username}</small></span></Link><button aria-label="Sair" onClick={logout}><LogOut size={17} /></button></div>
    </aside>
    <main className={styles.main} id="main-content" tabIndex={-1}>
      <header className={styles.topbar}><button ref={menu} className={styles.menu} aria-label="Abrir navegação" aria-expanded={open} aria-controls="app-navigation" onClick={() => setOpen(true)}><Menu size={21} /></button><GlobalSearchCommand label="Buscar projetos, pessoas e tecnologias" /><div className={styles.topActions}><NotificationsBell userId={user.id} prefix={prefix} dark /><Link href={profile} className={styles.avatar} aria-label="Abrir meu perfil">{initials(user.name)}</Link></div></header>
      <div className={`page-wrap ${styles.content}`}>{children}</div>
    </main>
    <nav className={styles.mobileNav} aria-label="Navegação móvel">{nav.map(({ href, label, icon }) => { const Icon = icons[icon]; return <Link key={href} href={href} onClick={close} aria-current={productNavActive(pathname, href) ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{label}</span></Link>; })}</nav>
  </div>;
}
