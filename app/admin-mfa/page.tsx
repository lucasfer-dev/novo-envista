import { redirect } from "next/navigation";
import { ShieldCheck, Smartphone, LockKeyhole } from "lucide-react";
import { requireAdminIdentity } from "@/lib/admin/require-admin";
import { AdminMfaClient } from "@/components/admin/AdminMfaClient";
import styles from "@/components/admin/AdminMfa.module.css";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const { aal, profile } = await requireAdminIdentity();
  if (aal === "aal2") redirect("/admin");

  const name = profile.display_name || profile.username || "Administrador";

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.aside}>
          <div>
            <div className={styles.brand}>
              <img src="/envista-logo.png" alt="" />
              <strong>Envista</strong>
            </div>

            <div style={{ marginTop: 54 }}>
              <p className={styles.eyebrow}>Área administrativa</p>
              <h1>Uma camada extra antes de entrar.</h1>
              <p className={styles.lead}>
                O painel administra usuários, projetos, cursos e operações sensíveis. Por isso, a senha sozinha não libera o acesso.
              </p>
            </div>
          </div>

          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}><ShieldCheck size={16} /></span>
              <span><strong>MFA obrigatório</strong><br />Sessões administrativas exigem AAL2.</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}><Smartphone size={16} /></span>
              <span><strong>Código temporário</strong><br />Use um aplicativo autenticador compatível com TOTP.</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}><LockKeyhole size={16} /></span>
              <span><strong>Acesso restrito</strong><br />Somente contas com associação administrativa válida entram.</span>
            </div>
          </div>
        </aside>

        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <p className={styles.eyebrow}>Proteção administrativa</p>
            <h2>Verificação em duas etapas</h2>
            <p>{name}, confirme sua identidade para continuar para o painel.</p>
          </header>
          <AdminMfaClient />
        </div>
      </section>
    </main>
  );
}
