import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminTeams() {
  const { supabase, profile } = await requireAdminUser();
  const [{ data: teams }, { data: members }] = await Promise.all([
    supabase.from("teams").select("id,slug,name,category,city,institution,visibility,owner_id,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("team_members").select("team_id,user_id"),
  ]);

  const ownerIds = [...new Set((teams ?? []).map((team: any) => team.owner_id))];
  let owners: any[] = [];
  if (ownerIds.length) {
    const { data } = await supabase.from("profiles").select("id,username,display_name").in("id", ownerIds);
    owners = data ?? [];
  }
  const ownerMap = new Map(owners.map((owner: any) => [owner.id, owner]));
  const memberCounts = new Map<string, number>();
  for (const member of members ?? []) memberCounts.set(member.team_id, (memberCounts.get(member.team_id) ?? 0) + 1);

  return (
    <AdminShell profile={profile} title="Equipes">
      <div className={styles.head}>
        <div><h1>Equipes</h1><p className={styles.muted}>Inspeção das equipes registradas, membros e vínculos com competições.</p></div>
      </div>
      {(teams ?? []).length === 0 ? <div className={styles.empty}>Nenhuma equipe cadastrada.</div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Equipe</th><th>Responsável</th><th>Membros</th><th>Categoria</th><th>Local</th><th>Visibilidade</th><th></th></tr></thead>
            <tbody>{(teams ?? []).map((team: any) => {
              const owner: any = ownerMap.get(team.owner_id);
              return <tr key={team.id}>
                <td><strong>{team.name}</strong><br /><span className={styles.muted}>{team.institution || "Sem instituição"}</span></td>
                <td>{owner ? <Link href={`/admin/users/${owner.id}`}>{owner.display_name}<br /><span className={styles.muted}>@{owner.username}</span></Link> : "—"}</td>
                <td>{memberCounts.get(team.id) ?? 0}</td>
                <td>{team.category || "—"}</td>
                <td>{team.city || "—"}</td>
                <td><span className={styles.pill}>{team.visibility}</span></td>
                <td><Link className={styles.secondary} href={`/admin/teams/${team.id}`}>Ver equipe</Link></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
