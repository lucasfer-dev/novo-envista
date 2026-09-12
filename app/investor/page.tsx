import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { toggleProjectSaveAction } from "@/lib/projects/investor-actions";
import { requireProductUser } from "@/lib/auth/require-product-user";

export default async function InvestorHomePage() {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const [verificationResult, savesResult, followsResult, interestsResult, projectsResult] = await Promise.all([
    supabase.from("investor_verifications").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("project_saves").select("project_id").eq("user_id", userId),
    supabase.from("follows").select("id").eq("follower_id", userId),
    supabase.from("project_interests").select("id,owner_status").eq("investor_id", userId),
    supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags,impact,needs").eq("visibility", "platform").order("updated_at", { ascending: false }).limit(6),
  ]);

  const verification = verificationResult.data?.status ?? "not_requested";
  const savedIds = new Set((savesResult.data ?? []).map((item: any) => item.project_id));
  const activePipeline = (interestsResult.data ?? []).filter((item: any) => item.owner_status !== "closed").length;

  return (
    <LegacySocialShell user={appUser} role="investor" pathname="/investor">
      <div className="page-head">
        <div><h1>Radar de oportunidades</h1><p>Descubra projetos, acompanhe sinais de evolução e organize seus contatos em um pipeline claro.</p></div>
        <Link className="primary" href="/investor/explore">Explorar projetos</Link>
      </div>

      {verification !== "verified" ? (
        <section className="panel section-block" style={{ padding: 18 }}>
          <div className="section-row">
            <div><h2>{verification === "pending" ? "Verificação em análise" : verification === "rejected" ? "Sua verificação precisa de ajustes" : "Verifique sua conta de investidor"}</h2><p>Você pode explorar, salvar e seguir projetos agora. Para demonstrar interesse e iniciar o fluxo de contato, conclua a verificação.</p></div>
            <Link className="primary" href="/investor/verification">Abrir verificação</Link>
          </div>
        </section>
      ) : null}

      <div className="admin-stats section-block">
        <Link href="/investor/saved" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{savesResult.data?.length ?? 0}</b><span>projetos salvos</span></Link>
        <Link href="/investor/following" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{followsResult.data?.length ?? 0}</b><span>acompanhamentos</span></Link>
        <Link href="/investor/interests" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{activePipeline}</b><span>contatos ativos</span></Link>
      </div>

      <section className="section-block">
        <div className="section-row"><div><h2>Projetos recentes</h2><p>Uma visão rápida de iniciativas publicadas e do que elas precisam agora.</p></div><Link className="text-btn" href="/investor/explore">Abrir Radar</Link></div>
        {(projectsResult.data ?? []).length ? (
          <div className="project-grid">
            {(projectsResult.data ?? []).map((project: any) => (
              <article className="project-card" key={project.id}>
                <div className="project-cover"><span className="project-initial">{project.title.slice(0, 1).toUpperCase()}</span><span className="stage">{project.stage}</span></div>
                <div className="card-body">
                  <div className="card-meta"><span>{project.category || "Projeto"}</span><span>{project.location || "Envista"}</span></div>
                  <h3><Link href={`/investor/projects/${encodeURIComponent(project.slug)}?from=explore`}>{project.title}</Link></h3>
                  <p>{project.short_description || "Projeto publicado no Envista."}</p>
                  {project.needs?.length ? <div className="chips compact">{project.needs.slice(0, 3).map((need: string) => <span key={need}>{need}</span>)}</div> : null}
                  <div className="actions" style={{ marginTop: 12 }}>
                    <form action={toggleProjectSaveAction}><input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="return_to" value="/investor" /><button className="secondary" type="submit">{savedIds.has(project.id) ? "Salvo" : "Salvar"}</button></form>
                    <FollowEntityButton targetType="project" targetId={project.id} returnTo="/investor" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty"><h3>Nenhum projeto público ainda</h3><p>Projetos publicados aparecerão aqui.</p></div>}
      </section>
    </LegacySocialShell>
  );
}
