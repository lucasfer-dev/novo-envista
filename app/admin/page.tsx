import Link from "next/link";
import { ArrowRight, BarChart3, Flag, LockKeyhole, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminDashboard() {
  const { supabase, profile } = await requireAdminUser();
  const [users, participants, investors, teams, projects, courses, messageReports, contentReports, privacy, audit] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "participant"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "investor"),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("message_reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("content_reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("privacy_requests").select("id", { count: "exact", head: true }).in("status", ["open", "in_review"]),
    supabase.from("admin_audit_log").select("id,action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const pendingReports = (messageReports.count ?? 0) + (contentReports.count ?? 0);
  const metrics = [
    ["Usuários", users.count ?? 0, "/admin/users"],
    ["Participantes", participants.count ?? 0, "/admin/users?role=participant"],
    ["Investidores", investors.count ?? 0, "/admin/users?role=investor"],
    ["Equipes", teams.count ?? 0, "/admin/teams"],
    ["Projetos", projects.count ?? 0, "/admin/projects"],
    ["Cursos", courses.count ?? 0, "/admin/courses"],
    ["Denúncias pendentes", pendingReports, "/admin/moderation"],
    ["Pedidos de privacidade", privacy.count ?? 0, "/admin/privacy"],
  ] as const;

  return (
    <AdminShell profile={profile} title="Visão geral">
      <div className={styles.head}>
        <div>
          <span className={styles.kicker}><ShieldCheck size={14} /> Console administrativo</span>
          <h1>Visão geral da plataforma</h1>
          <p className={styles.muted}>Acompanhe crescimento, operação, segurança e governança do Envista em um único lugar.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/admin/moderation"><Flag size={15} /> Moderação</Link>
          <Link className={styles.primary} href="/admin/analytics"><BarChart3 size={15} /> Abrir analytics</Link>
        </div>
      </div>

      <div className={styles.metrics}>
        {metrics.map(([label, value, href]) => (
          <Link href={href} className={styles.metric} key={label} style={{ textDecoration: "none", color: "inherit" }}>
            <strong>{value}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className={styles.overviewGrid}>
        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <h2>Atividade administrativa recente</h2>
            <span>Últimas 10 ações</span>
          </div>
          {(audit.data ?? []).length === 0 ? (
            <div className={styles.empty}>Nenhuma ação administrativa registrada ainda.</div>
          ) : (
            <div className={styles.activityList}>
              {(audit.data ?? []).map((item: any) => (
                <div className={styles.activityRow} key={item.id}>
                  <span className={styles.activityDot} />
                  <div>
                    <strong>{item.action}</strong>
                    <span>{item.target_type} {item.target_id} · {new Date(item.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.card}>
          <div className={styles.sectionTitle}>
            <h2>Ações rápidas</h2>
            <span>Operação</span>
          </div>
          <div className={styles.quickActions}>
            <Link href="/admin/analytics"><span>Analisar ativação e uso</span><ArrowRight size={15} /></Link>
            <Link href="/admin/moderation"><span>Revisar denúncias ({pendingReports})</span><ArrowRight size={15} /></Link>
            <Link href="/admin/privacy"><span>Pedidos de privacidade ({privacy.count ?? 0})</span><ArrowRight size={15} /></Link>
            <Link href="/admin/users"><span>Gerenciar usuários</span><ArrowRight size={15} /></Link>
          </div>
          <div className={styles.divider} />
          <p className={styles.muted} style={{ margin: 0, fontSize: 12 }}><LockKeyhole size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Sessão administrativa protegida por associação no banco e MFA AAL2.</p>
        </aside>
      </div>
    </AdminShell>
  );
}
