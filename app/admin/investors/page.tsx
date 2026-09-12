import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { reviewInvestorVerificationAction } from "@/lib/product/readiness-actions";

export default async function AdminInvestorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const { data: requests } = await supabase
    .from("investor_verifications")
    .select("user_id,status,organization_name,organization_type,website_url,review_note,requested_at,reviewed_at,profiles!investor_verifications_user_id_fkey(username,display_name,organization)")
    .order("requested_at", { ascending: false, nullsFirst: false });

  return (
    <AdminShell profile={profile} title="Investidores">
      <div className={styles.head}><div><h1>Verificação de investidores</h1><p className={styles.muted}>Revise solicitações antes de liberar o contato com projetos.</p></div></div>
      {params.status === "reviewed" ? <div className={styles.card}>Revisão salva.</div> : null}
      {params.error ? <div className={styles.card}>Não foi possível concluir a revisão.</div> : null}
      <div className={styles.stack}>
        {(requests ?? []).length ? (requests ?? []).map((request: any) => {
          const linked = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
          return (
            <section className={styles.card} key={request.user_id}>
              <h2>{linked?.display_name || linked?.username || "Investidor"}</h2>
              <p className={styles.muted}>@{linked?.username || "sem-username"} · Status: {request.status}</p>
              <p><strong>Organização:</strong> {request.organization_name || linked?.organization || "Não informada"}</p>
              <p><strong>Tipo:</strong> {request.organization_type || "Não informado"}</p>
              {request.website_url ? <p><a href={request.website_url} target="_blank" rel="noreferrer">Abrir site informado</a></p> : null}
              {request.status === "pending" ? (
                <form action={reviewInvestorVerificationAction}>
                  <input type="hidden" name="user_id" value={request.user_id} />
                  <label>Observação<textarea name="review_note" maxLength={1000} placeholder="Opcional para aprovação; recomendado ao rejeitar." /></label>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button className={styles.primary} type="submit" name="status" value="verified">Aprovar</button>
                    <button className={styles.secondary} type="submit" name="status" value="rejected">Pedir ajustes</button>
                  </div>
                </form>
              ) : request.review_note ? <p><strong>Observação:</strong> {request.review_note}</p> : null}
            </section>
          );
        }) : <div className={styles.empty}>Nenhuma solicitação encontrada.</div>}
      </div>
    </AdminShell>
  );
}
