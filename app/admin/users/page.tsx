import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const requestedRole = typeof params.role === "string" ? params.role : "";
  const role = requestedRole === "participant" || requestedRole === "investor" ? requestedRole : "";

  let profilesQuery = supabase
    .from("profiles")
    .select("id,username,display_name,role,profile_visibility,allow_messages,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (role) profilesQuery = profilesQuery.eq("role", role);

  const [{ data: profiles }, { data: compliance }] = await Promise.all([
    profilesQuery,
    supabase.from("account_compliance").select("user_id,age_band,guardian_consent_verified_at"),
  ]);
  const complianceMap = new Map((compliance ?? []).map((row: any) => [row.user_id, row]));

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
      {(profiles ?? []).length === 0 ? <div className={styles.empty}>Nenhum perfil encontrado.</div> : (
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
      )}
    </AdminShell>
  );
}
