import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { updateProjectInterestPipelineAction } from "@/lib/product/readiness-actions";

const labels: Record<string, string> = {
  new: "Novo",
  viewed: "Visualizado",
  contacted: "Em contato",
  meeting: "Conversa/reunião",
  closed: "Encerrado",
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ParticipantInterestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, appUser } = await requireProductUser("participant");
  const params = await searchParams;
  const { data: interests } = await supabase
    .from("project_interests")
    .select("id,investor_id,message,status,owner_status,created_at,updated_at,projects(id,slug,title,owner_user_id,owner_team_id)")
    .order("updated_at", { ascending: false });

  const investorIds = Array.from(new Set((interests ?? []).map((item: any) => item.investor_id).filter(Boolean)));
  const { data: investors } = investorIds.length
    ? await supabase.from("profiles").select("id,username,display_name,organization,organization_type").in("id", investorIds)
    : { data: [] as any[] };
  const investorMap = new Map((investors ?? []).map((profile: any) => [profile.id, profile]));

  const updated = params.status === "updated";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/app/interests">
      <div className="page-head">
        <div><h1>Interesses recebidos</h1><p>Acompanhe contatos de investidores verificados em seus projetos e nos projetos das suas equipes.</p></div>
      </div>
      {updated ? <div className="form-feedback" role="status">Etapa do contato atualizada.</div> : null}
      {error ? <div className="form-error" role="alert">Não foi possível atualizar esse contato.</div> : null}

      {(interests ?? []).length ? (
        <div className="section-block">
          {(interests ?? []).map((interest: any) => {
            const project = one<any>(interest.projects);
            const investor = investorMap.get(interest.investor_id) as any;
            if (!project) return null;
            return (
              <article className="panel" style={{ padding: 18, marginBottom: 14 }} key={interest.id}>
                <div className="section-row">
                  <div>
                    <div className="meta-row"><span className="stage">{labels[interest.owner_status] || "Novo"}</span><span>{project.title}</span></div>
                    <h2 style={{ marginBottom: 4 }}>{investor?.display_name || investor?.username || "Investidor verificado"}</h2>
                    <p style={{ marginTop: 0 }}>{[investor?.organization, investor?.organization_type].filter(Boolean).join(" · ") || "Conta de investidor"}</p>
                  </div>
                  <Link className="secondary" href={`/app/projects/${encodeURIComponent(project.slug)}`}>Abrir projeto</Link>
                </div>
                <div className="panel" style={{ padding: 14, marginTop: 12 }}><small>Mensagem</small><p style={{ marginBottom: 0 }}>{interest.message || "O investidor demonstrou interesse neste projeto."}</p></div>
                <form action={updateProjectInterestPipelineAction} className="actions" style={{ marginTop: 14, alignItems: "end" }}>
                  <input type="hidden" name="interest_id" value={interest.id} />
                  <label style={{ minWidth: 220 }}>Etapa<select name="owner_status" defaultValue={interest.owner_status}><option value="new">Novo</option><option value="viewed">Visualizado</option><option value="contacted">Em contato</option><option value="meeting">Conversa/reunião</option><option value="closed">Encerrado</option></select></label>
                  <button className="primary" type="submit">Atualizar etapa</button>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty"><h3>Nenhum interesse recebido ainda</h3><p>Complete seus projetos, mantenha as informações atualizadas e publique evidências para aumentar a qualidade da descoberta.</p><Link className="secondary" href="/app/projects">Meus projetos</Link></div>
      )}
    </LegacySocialShell>
  );
}
