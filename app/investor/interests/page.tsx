import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";

const labels: Record<string, string> = {
  new: "Enviado",
  viewed: "Visualizado",
  contacted: "Em contato",
  meeting: "Conversa/reunião",
  closed: "Encerrado",
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function InvestorInterestsPage() {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const [{ data: verification }, { data: interests }] = await Promise.all([
    supabase.from("investor_verifications").select("status").eq("user_id", userId).maybeSingle(),
    supabase
      .from("project_interests")
      .select("id,message,status,owner_status,created_at,updated_at,projects(id,slug,title,short_description,stage,category)")
      .eq("investor_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <LegacySocialShell user={appUser} role="investor" pathname="/investor/interests">
      <div className="page-head">
        <div><h1>Meu pipeline</h1><p>Acompanhe os projetos em que você demonstrou interesse e o andamento de cada contato.</p></div>
        {verification?.status !== "verified" ? <Link className="primary" href="/investor/verification">Verificar conta</Link> : <Link className="secondary" href="/investor/explore">Descobrir projetos</Link>}
      </div>

      {verification?.status !== "verified" ? <div className="form-error">Sua conta ainda não está verificada. Você pode explorar e salvar projetos, mas a ação “Tenho interesse” exige verificação.</div> : null}

      {(interests ?? []).length ? (
        <div className="section-block">
          {(interests ?? []).map((interest: any) => {
            const project = one<any>(interest.projects);
            if (!project) return null;
            const status = labels[interest.owner_status] || "Enviado";
            return (
              <article className="panel" style={{ padding: 18, marginBottom: 14 }} key={interest.id}>
                <div className="section-row">
                  <div>
                    <div className="meta-row"><span className="stage">{status}</span><span>{project.stage}</span>{project.category ? <span>{project.category}</span> : null}</div>
                    <h2 style={{ marginBottom: 6 }}><Link href={`/investor/projects/${encodeURIComponent(project.slug)}?from=explore`}>{project.title}</Link></h2>
                    <p>{project.short_description || "Projeto publicado no Envista."}</p>
                  </div>
                  <Link className="secondary" href={`/investor/projects/${encodeURIComponent(project.slug)}?from=explore`}>Abrir projeto</Link>
                </div>
                {interest.message ? <div className="panel" style={{ padding: 14, marginTop: 12 }}><small>Sua mensagem</small><p style={{ marginBottom: 0 }}>{interest.message}</p></div> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>Nenhum interesse enviado ainda</h3><p>Explore projetos, salve os mais relevantes e demonstre interesse quando houver alinhamento.</p><Link className="primary" href="/investor/explore">Explorar projetos</Link></div>
      )}
    </LegacySocialShell>
  );
}
