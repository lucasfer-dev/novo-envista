import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const { supabase, profile } = await requireAdminUser();

  let request = supabase
    .from("projects")
    .select("id,slug,title,short_description,stage,category,visibility,owner_user_id,owner_team_id,created_at,updated_at,profiles:owner_user_id(username,display_name),teams:owner_team_id(name,slug)")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (q) request = request.or(`title.ilike.%${q.replace(/[%_,()]/g, "")}%,short_description.ilike.%${q.replace(/[%_,()]/g, "")}%`);
  const { data: projects, error } = await request;

  return (
    <AdminShell profile={profile} title="Projetos">
      <div className={styles.head}>
        <div><h1>Projetos</h1><p className={styles.muted}>Registro operacional dos projetos cadastrados na plataforma.</p></div>
        <form><input name="q" defaultValue={q} placeholder="Buscar projeto" style={{ border: "1px solid #d0d5dd", borderRadius: 10, padding: "10px 12px" }} /></form>
      </div>
      {error ? <div className={styles.error}>Não foi possível carregar os projetos.</div> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Projeto</th><th>Responsável</th><th>Estágio</th><th>Visibilidade</th><th>Atualizado</th></tr></thead>
          <tbody>
            {(projects ?? []).map((project: any) => {
              const ownerProfile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;
              const ownerTeam = Array.isArray(project.teams) ? project.teams[0] : project.teams;
              return <tr key={project.id}>
                <td><strong>{project.title}</strong><div className={styles.muted}>{project.category || "Sem categoria"}</div></td>
                <td>{ownerTeam?.name || ownerProfile?.display_name || "Conta"}{ownerProfile?.username ? <div className={styles.muted}>@{ownerProfile.username}</div> : null}</td>
                <td><span className={styles.pill}>{project.stage || "—"}</span></td>
                <td>{project.visibility}</td>
                <td>{new Date(project.updated_at).toLocaleString("pt-BR")}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!error && !(projects ?? []).length ? <div className={styles.empty}>Nenhum projeto encontrado.</div> : null}
      <p className={styles.muted} style={{ marginTop: 12 }}>Mostrando até 200 projetos mais recentemente atualizados.</p>
      <Link href="/admin/analytics" className={styles.secondary} style={{ marginTop: 10 }}>Ver indicadores</Link>
    </AdminShell>
  );
}
