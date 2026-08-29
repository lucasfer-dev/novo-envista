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

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const requestedRole = typeof params.role === "string" ? params.role : "";
  const role = requestedRole === "participant" || requestedRole === "investor" ? requestedRole : "";
  const page = pageNumber(params.page);
  const from = (page - 1) * PAGE_SIZE;

  let profilesQuery = supabase
    .from("profiles")
    .select("id,username,display_name,role,profile_visibility,allow_messages,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (role) profilesQuery = profilesQuery.eq("role", role);

  const { data: profiles, count, error } = await profilesQuery;
  const ids = (profiles ?? []).map((item: any) => item.id);
  let compliance: any[] = [];
  if (ids.length) {
    const result = await supabase
      .from("account_compliance")
      .select("user_id,age_band,guardian_consent_verified_at")
      .in("user_id", ids);
    compliance = result.data ?? [];
  }
  const complianceMap = new Map(compliance.map((row: any) => [row.user_id, row]));

  return (
    <AdminShell profile={profile} title="Usuários">
      <div className={styles.head}>
        <div>
          <h1>Perfis e usuários</h1>
          <p className={styles.muted}>Consulte participantes e investidores sem expor e-mail ou credenciais no diretório administrativo.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/admin/users">Todos</Link>
          <Link className={styles.secondary} href="/admin/users?role=participant">Participantes</Link>
          <Link className={styles.secondary} href="/admin/users?role=investor">Investidores</Link>
        </div>
      </div>

      <div className={styles.warning}>Faixa etária e status de responsável são dados de conformidade: use apenas quando necessário para proteção e atendimento.</div>
      {error ? <div className={styles.error}>Não foi possível carregar os usuários.</div> : null}
      {!error && (profiles ?? []).length === 0 ? <div className={styles.empty}>Nenhum perfil encontrado.</div> : null}
      {(profiles ?? []).length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Conta</th><th>Tipo</th><th>Visibilidade</th><th>Mensagens</th><th>Faixa etária</th><th>Responsável</th><th></th></tr></thead>
              <tbody>
                {(profiles ?? []).map((item: any) => {
                  const c: any = complianceMap.get(item.id);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.display_name}</strong><br /><span className={styles.muted}>@{item.username}</span></td>
                      <td>{item.role === "participant" ? "Participante" : "Investidor"}</td>
                      <td><span className={styles.pill}>{item.profile_visibility}</span></td>
                      <td>{item.allow_messages ? "Permitidas" : "Bloqueadas"}</td>
                      <td>{c?.age_band ?? "—"}</td>
                      <td>{c?.guardian_consent_verified_at ? "Verificado" : "—"}</td>
                      <td><Link className={styles.secondary} href={`/admin/users/${item.id}`}>Ver perfil</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <AdminPagination pathname="/admin/users" page={page} pageSize={PAGE_SIZE} total={count ?? 0} query={{ role }} />
        </>
      ) : null}
    </AdminShell>
  );
}
