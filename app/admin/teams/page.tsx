import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

const PAGE_SIZE = 50;

function pageNumber(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export default async function AdminTeams({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const from = (page - 1) * PAGE_SIZE;

  const { data: teams, count, error } = await supabase
    .from("teams")
    .select("id,slug,name,category,city,institution,visibility,owner_id,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const teamIds = (teams ?? []).map((team: any) => team.id);
  const ownerIds = [...new Set((teams ?? []).map((team: any) => team.owner_id).filter(Boolean))];
  const [membersResult, ownersResult] = await Promise.all([
    teamIds.length ? supabase.from("team_members").select("team_id,user_id").in("team_id", teamIds) : Promise.resolve({ data: [] as any[] }),
    ownerIds.length ? supabase.from("profiles").select("id,username,display_name").in("id", ownerIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const ownerMap = new Map((ownersResult.data ?? []).map((owner: any) => [owner.id, owner]));
  const memberCounts = new Map<string, number>();
  for (const member of membersResult.data ?? []) memberCounts.set(member.team_id, (memberCounts.get(member.team_id) ?? 0) + 1);

  return (
    <AdminShell profile={profile} title="Equipes">
      <div className={styles.head}>
        <div><h1>Equipes</h1><p className={styles.muted}>Inspeção das equipes registradas, membros e vínculos com competições.</p></div>
      </div>
      {error ? <div className={styles.error}>Não foi possível carregar as equipes.</div> : null}
      {!error && (teams ?? []).length === 0 ? <div className={styles.empty}>Nenhuma equipe cadastrada.</div> : null}
      {(teams ?? []).length > 0 ? (
        <>
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
          <AdminPagination pathname="/admin/teams" page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
        </>
      ) : null}
    </AdminShell>
  );
}
