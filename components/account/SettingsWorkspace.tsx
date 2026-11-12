import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell, CircleUserRound, GitBranch, LifeBuoy, LockKeyhole,
  Settings2, ShieldCheck, UserRound,
} from "lucide-react";
import styles from "./SettingsWorkspace.module.css";

export type SettingsSection = "account" | "profile" | "security" | "privacy" | "notifications" | "integrations" | "support";

const sections = [
  { id: "account", href: "/account/settings?section=account", label: "Conta", Icon: CircleUserRound },
  { id: "profile", href: "/account/settings", label: "Perfil", Icon: UserRound },
  { id: "security", href: "/account/security", label: "Segurança", Icon: LockKeyhole },
  { id: "privacy", href: "/account/privacy", label: "Privacidade", Icon: ShieldCheck },
  { id: "notifications", href: "/account/settings?section=notifications", label: "Notificações", Icon: Bell },
  { id: "integrations", href: "/integrations/github", label: "Integrações", Icon: GitBranch },
  { id: "support", href: "/account/feedback", label: "Suporte", Icon: LifeBuoy },
] as const;

export default function SettingsWorkspace({
  active,
  title,
  description,
  children,
}: {
  active: SettingsSection;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.layout} data-settings-workspace>
      <aside className={styles.navigation} aria-label="Categorias das configurações">
        <div className={styles.navigationIntro}>
          <Settings2 size={26} aria-hidden="true" />
          <h2>Configurações</h2>
          <p>Personalize sua conta, privacidade, segurança e preferências do Envista.</p>
        </div>
        <nav className={styles.navigationLinks} aria-label="Navegação das configurações">
          {sections.map(({ id, href, label, Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={active === id ? styles.navigationActive : styles.navigationLink}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section className={styles.content} id="settings-main" aria-label="Painel de configurações">
        <header className={styles.contentHeader}>
          <span className={styles.eyebrow}>{active === "profile" ? "PERFIL" : active === "notifications" ? "PREFERÊNCIAS" : "CONFIGURAÇÕES"}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className={styles.contentBody}>{children}</div>
      </section>
    </div>
  );
}

export { styles as settingsStyles };
