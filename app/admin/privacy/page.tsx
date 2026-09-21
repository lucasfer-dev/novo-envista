import AdminShell from "@/components/admin/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import styles from "@/components/admin/AdminViews.module.css";
import {
  updatePrivacyRequestAdminAction,
  updatePublicPrivacyContactAdminAction,
} from "@/lib/admin/actions";
import { requireAdminUser } from "@/lib/admin/require-admin";

const PAGE_SIZE = 30;

function pageNumber(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export default async function AdminPrivacy({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { supabase, profile } = await requireAdminUser();
  const page = pageNumber(query.page);
  const from = (page - 1) * PAGE_SIZE;

  const [
    { data: requests, count, error },
    { data: publicRequests, error: publicError },
  ] = await Promise.all([
    supabase
      .from("privacy_requests")
      .select("id,user_id,request_type,details,status,admin_note,requested_at,resolved_at", { count: "exact" })
      .order("requested_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1),
    supabase
      .from("privacy_contact_requests")
      .select("id,email,request_type,message,status,admin_note,created_at,resolved_at")
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  const ids = Array.from(new Set((requests ?? []).map((item: any) => item.user_id)));
  let profiles: any[] = [];
  if (ids.length) {
    const result = await supabase
      .from("profiles")
      .select("id,username,display_name")
      .in("id", ids);
    profiles = result.data ?? [];
  }
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return (
    <AdminShell profile={profile} title="Privacidade">
      <div className={styles.head}>
        <div>
          <h1>Solicitações de privacidade</h1>
          <p className={styles.muted}>
            Acesso, correção, exportação, exclusão e outros pedidos registrados pelos titulares.
          </p>
        </div>
      </div>

      {query.status ? <div className={styles.notice}>Solicitação atualizada e registrada no log.</div> : null}
      {query.error ? <div className={styles.error}>Não foi possível atualizar a solicitação.</div> : null}

      <div className={styles.warning}>
        Concluir um pedido exige verificar se a ação efetiva foi executada. Marcar como resolvido não substitui exclusão, exportação ou correção no sistema de origem.
      </div>

      <section className={styles.stack}>
        <div className={styles.head}>
          <div>
            <h2>Canal público</h2>
            <p className={styles.muted}>Pedidos enviados em /privacy/contact, inclusive por pessoas sem login.</p>
          </div>
        </div>
        {publicError ? <div className={styles.error}>Não foi possível carregar o canal público.</div> : null}
        {!publicError && (publicRequests ?? []).length === 0 ? (
          <div className={styles.empty}>Nenhuma solicitação pública.</div>
        ) : (
          (publicRequests ?? []).map((request: any) => (
            <article className={styles.request} key={request.id}>
              <div className={styles.actions}>
                <span className={styles.pill}>{request.request_type}</span>
                <span className={styles.pill}>{request.status}</span>
              </div>
              <h3>{request.email}</h3>
              <p className={styles.muted}>{new Date(request.created_at).toLocaleString("pt-BR")}</p>
              <p>{request.message || "Sem detalhes adicionais."}</p>
              <form className={styles.form} action={updatePublicPrivacyContactAdminAction}>
                <input type="hidden" name="request_id" value={request.id} />
                <label>
                  Status
                  <select name="status" defaultValue={request.status}>
                    <option value="open">Aberta</option>
                    <option value="in_progress">Em análise</option>
                    <option value="resolved">Concluída</option>
                    <option value="rejected">Rejeitada</option>
                  </select>
                </label>
                <label>
                  Nota administrativa
                  <textarea name="admin_note" defaultValue={request.admin_note} maxLength={2000} />
                </label>
                <button className={styles.primary}>Salvar atendimento</button>
              </form>
            </article>
          ))
        )}
      </section>

      <section className={styles.stack}>
        <div className={styles.head}>
          <div>
            <h2>Solicitações de usuários autenticados</h2>
            <p className={styles.muted}>Pedidos enviados pela área de privacidade da conta.</p>
          </div>
        </div>
        {error ? <div className={styles.error}>Não foi possível carregar as solicitações.</div> : null}
        {!error && (requests ?? []).length === 0 ? (
          <div className={styles.empty}>Nenhuma solicitação autenticada.</div>
        ) : (
          (requests ?? []).map((request: any) => {
            const user = profileMap.get(request.user_id);
            return (
              <article className={styles.request} key={request.id}>
                <div className={styles.actions}>
                  <span className={styles.pill}>{request.request_type}</span>
                  <span className={styles.pill}>{request.status}</span>
                </div>
                <h3>{user?.display_name ?? "Conta"}</h3>
                <p className={styles.muted}>
                  {user?.username ? `@${user.username}` : ""} · {new Date(request.requested_at).toLocaleString("pt-BR")}
                </p>
                <p>{request.details || "Sem detalhes adicionais."}</p>
                <form className={styles.form} action={updatePrivacyRequestAdminAction}>
                  <input type="hidden" name="request_id" value={request.id} />
                  <label>
                    Status
                    <select name="status" defaultValue={request.status}>
                      <option value="open">Aberta</option>
                      <option value="in_review">Em análise</option>
                      <option value="completed">Concluída</option>
                      <option value="rejected">Rejeitada</option>
                    </select>
                  </label>
                  <label>
                    Nota administrativa
                    <textarea name="admin_note" defaultValue={request.admin_note} maxLength={2000} />
                  </label>
                  <button className={styles.primary}>Salvar atendimento</button>
                </form>
              </article>
            );
          })
        )}
      </section>

      {!error ? (
        <AdminPagination
          pathname="/admin/privacy"
          page={page}
          pageSize={PAGE_SIZE}
          total={count ?? 0}
        />
      ) : null}
    </AdminShell>
  );
}
