import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminDashboard() {
  const { supabase, profile } = await requireAdminUser();
  const [users, participants, investors, teams, projects, competitions, courses, reports, privacy, audit] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "participant"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "investor"),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("competitions").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("message_reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("privacy_requests").select("id", { count: "exact", head: true }).in("status", ["open", "in_review"]),
    supabase.from("admin_audit_log").select("id,action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const metrics = [
    ["Usuários", users.count ?? 0, "/admin/users"],
    ["Participantes", participants.count ?? 0, "/admin/users?role=participant"],
    ["Investidores", investors.count ?? 0, "/admin/users?role=investor"],
    ["Equipes", teams.count ?? 0, "/admin/teams"],
    ["Projetos", projects.count ?? 0, "/admin/users"],
    ["Competições", competitions.count ?? 0, "/admin/competitions"],
    ["Cursos", courses.count ?? 0, "/admin/courses"],
    ["Denúncias pendentes", reports.count ?? 0, "/admin/moderation"],
    ["Pedidos de privacidade", privacy.count ?? 0, "/admin/privacy"],
  ] as const;

  return (
    <AdminShell profile={profile} title="Visão geral">
      <div className={styles.head}>
        <div>
          <h1>Administração</h1>
          <p className={styles.muted}>Painel operacional privado do Envista. O acesso depende de associação administrativa válida no banco.</p>
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

      <section className={styles.card}>
        <h2>Atividade administrativa recente</h2>
        {(audit.data ?? []).length === 0 ? (
          <div className={styles.empty}>Nenhuma ação administrativa registrada ainda.</div>
        ) : (
          <div className={styles.stack}>
            {(audit.data ?? []).map((item: any) => (
              <div key={item.id}>
                <strong>{item.action}</strong>
                <div className={styles.muted}>{item.target_type} {item.target_id} · {new Date(item.created_at).toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
