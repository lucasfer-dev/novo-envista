import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminCompetitions() {
  const { supabase, profile } = await requireAdminUser();
  const [{ data: competitions }, { data: registrations }] = await Promise.all([
    supabase.from("competitions").select("id,slug,title,organizer,status,starts_at,ends_at,max_teams,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("competition_team_registrations").select("competition_id,team_id"),
  ]);

  const counts = new Map<string, number>();
  for (const registration of registrations ?? []) counts.set(registration.competition_id, (counts.get(registration.competition_id) ?? 0) + 1);

  return (
    <AdminShell profile={profile} title="Competições">
      <div className={styles.head}>
        <div><h1>Competições</h1><p className={styles.muted}>Crie, publique, edite e gerencie manualmente as equipes inscritas.</p></div>
        <Link className={styles.primary} href="/admin/competitions/new">Nova competição</Link>
      </div>

      {(competitions ?? []).length === 0 ? <div className={styles.empty}>Nenhuma competição cadastrada.</div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Competição</th><th>Organizador</th><th>Status</th><th>Data</th><th>Equipes</th><th></th></tr></thead>
            <tbody>{(competitions ?? []).map((competition: any) => <tr key={competition.id}>
              <td><strong>{competition.title}</strong><br /><span className={styles.muted}>/{competition.slug}</span></td>
              <td>{competition.organizer}</td>
              <td><span className={styles.pill}>{competition.status}</span></td>
              <td>{competition.starts_at ? new Date(competition.starts_at).toLocaleString("pt-BR") : "A definir"}</td>
              <td>{counts.get(competition.id) ?? 0}{competition.max_teams ? ` / ${competition.max_teams}` : ""}</td>
              <td><Link className={styles.secondary} href={`/admin/competitions/${competition.id}`}>Gerenciar</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
