"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Flag,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import styles from "./AdminShell.module.css";

type Props = { profile: { username: string; display_name: string }; title: string; children: React.ReactNode };

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const operations: NavItem[] = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/investors", label: "Investidores", icon: BriefcaseBusiness },
  { href: "/admin/teams", label: "Equipes", icon: UsersRound },
  { href: "/admin/projects", label: "Projetos", icon: FolderKanban },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
];

const governance: NavItem[] = [
  { href: "/admin/moderation", label: "Moderação", icon: Flag },
  { href: "/admin/feedback", label: "Feedback e suporte", icon: LifeBuoy },
  { href: "/admin/privacy", label: "Privacidade", icon: LockKeyhole },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <nav className={styles.nav} aria-label={label}>
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link href={href} key={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
              <Icon size={17} aria-hidden="true" />
              <span>{itemLabel}</span>
              {active ? <ChevronRight className={styles.navArrow} size={15} aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminShell({ profile, title, children }: Props) {
  const pathname = usePathname();
  const initials = (profile.display_name || profile.username || "A").trim().slice(0, 1).toUpperCase();

  return (
    <div className={styles.shell}>
      <a className="a11y-skip-link" href="#main-content">Pular para o conteúdo</a>

      <aside className={styles.side} aria-label="Navegação administrativa">
        <Link className={styles.brand} href="/admin">
          <span className={styles.brandMark}><img src="/envista-logo.png" alt="" /></span>
          <span><b>Envista</b><small>Admin Console</small></span>
        </Link>

        <div className={styles.securityCard}>
          <ShieldCheck size={18} aria-hidden="true" />
          <div><strong>Sessão protegida</strong><span>MFA administrativo ativo</span></div>
        </div>

        <div className={styles.navigation}>
          <NavGroup label="Operação" items={operations} pathname={pathname} />
          <NavGroup label="Governança" items={governance} pathname={pathname} />
        </div>

        <div className={styles.sideBottom}>
          <Link href="/app" className={styles.backToProduct}>
            <Activity size={16} aria-hidden="true" /> Voltar ao Envista
          </Link>
          <div className={styles.meta}>
            <span className={styles.avatar}>{initials}</span>
            <div><strong>{profile.display_name}</strong><span>@{profile.username}</span></div>
          </div>
        </div>
      </aside>

      <main className={styles.main} id="main-content" tabIndex={-1}>
        <header className={styles.top}>
          <div>
            <span className={styles.topEyebrow}>Administração</span>
            <strong>{title}</strong>
          </div>
          <span className={styles.badge}><ShieldCheck size={14} aria-hidden="true" /> Admin verificado</span>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
