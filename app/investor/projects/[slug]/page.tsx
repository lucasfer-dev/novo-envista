import Link from "next/link";
import { notFound } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { sendProjectInterestAction, toggleProjectSaveAction } from "@/lib/projects/investor-actions";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function InvestorProjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const { data: project } = await supabase
    .from("projects")
    .select("id,slug,title,short_description,problem,solution,impact,needs,stage,category,location,tags,readme,website_url,repository_url,visibility,owner_user_id,owner_team_id,owner_user:profiles!projects_owner_user_id_fkey(id,username,display_name),owner_team:teams!projects_owner_team_id_fkey(id,slug,name)")
    .eq("slug", slug)
    .eq("visibility", "platform")
    .maybeSingle();
  if (!project) notFound();

  await supabase.from("project_view_events").insert({ project_id: project.id, viewer_id: userId, source: "investor_project" }).then(() => undefined);

  const [{ data: saved }, { data: interest }, { data: verification }] = await Promise.all([
    supabase.from("project_saves").select("project_id").eq("user_id", userId).eq("project_id", project.id).maybeSingle(),
    supabase.from("project_interests").select("id,message,status,owner_status,updated_at").eq("investor_id", userId).eq("project_id", project.id).maybeSingle(),
    supabase.from("investor_verifications").select("status").eq("user_id", userId).maybeSingle(),
  ]);

  const ownerUser = one<any>(project.owner_user);
  const ownerTeam = one<any>(project.owner_team);
  const ownerLabel = ownerTeam?.name ? `Equipe ${ownerTeam.name}` : ownerUser?.display_name || ownerUser?.username || "Projeto Envista";
  const returnTo = `/investor/projects/${encodeURIComponent(project.slug)}?from=explore`;
  const verified = verification?.status === "verified";
  const status = typeof query.status === "string" ? query.status : "";
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <LegacySocialShell user={appUser} role="investor" pathname={`/investor/projects/${slug}`}>
      <Link className="back" href="/investor/explore">← Voltar ao Radar</Link>
      <div className="project-hero panel">
        <div><div className="project-icon">{project.title.slice(0, 1).toUpperCase()}</div><div><div className="meta-row"><span className="stage">{project.stage}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span>{project.location}</span> : null}</div><h1>{project.title}</h1><p>{project.short_description || "Projeto publicado no Envista."}</p><div className="chips">{(project.tags || []).map((tag: string) => <span key={tag}>{tag}</span>)}</div></div></div>
        <div className="actions">
          <form action={toggleProjectSaveAction}><input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="return_to" value={returnTo} /><button className="secondary" type="submit">{saved ? "Salvo" : "Salvar projeto"}</button></form>
          <FollowEntityButton targetType="project" targetId={project.id} returnTo={returnTo} />
        </div>
      </div>

      {status === "interest" ? <div className="form-feedback">Interesse registrado. Você pode acompanhar o andamento no Pipeline.</div> : null}
      {error ? <div className="form-error">Não foi possível concluir a ação.</div> : null}

      <div className="detail-grid">
        <section className="panel prose">
          <h2>Resumo executivo</h2>
          <h3>Problema</h3><p>{project.problem || "Ainda não descrito."}</p>
          <h3>Solução</h3><p>{project.solution || "Ainda não descrita."}</p>
          <h3>Impacto e evidências</h3><p>{project.impact || "A equipe ainda não registrou evidências de validação."}</p>
          <h3>Necessidade atual</h3>{project.needs?.length ? <div className="chips">{project.needs.map((need: string) => <span key={need}>{need}</span>)}</div> : <p>Nenhuma necessidade informada.</p>}
          {(project.website_url || project.repository_url) ? <><h3>Links verificáveis</h3><div className="actions">{project.website_url ? <a className="primary" href={project.website_url} target="_blank" rel="noreferrer">Abrir site / demo</a> : null}{project.repository_url ? <a className="secondary" href={project.repository_url} target="_blank" rel="noreferrer">Ver repositório</a> : null}</div></> : null}
          <h3>Descrição completa</h3><p style={{ whiteSpace: "pre-wrap" }}>{project.readme || "Sem descrição completa."}</p>
          <h3>Arquivos públicos</h3><ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={false} />
        </section>

        <aside className="panel project-side">
          <h3>Autoria</h3><p><b>{ownerLabel}</b><br /><small>{ownerTeam ? "Equipe" : "Projeto pessoal"}</small></p>
          <hr />
          <h3>Demonstrar interesse</h3>
          {verified ? (
            <form className="form-page" style={{ padding: 0 }} action={sendProjectInterestAction}>
              <input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="return_to" value={returnTo} />
              <label>Mensagem<textarea name="message" maxLength={1200} defaultValue={interest?.message || `Olá! Gostaria de conhecer melhor o projeto ${project.title} e entender os próximos passos.`} /></label>
              <button className="primary" type="submit">{interest?.status === "active" ? "Atualizar interesse" : "Tenho interesse"}</button>
              {interest ? <small>Etapa atual: {interest.owner_status === "new" ? "enviado" : interest.owner_status === "viewed" ? "visualizado" : interest.owner_status === "contacted" ? "em contato" : interest.owner_status === "meeting" ? "conversa/reunião" : "encerrado"}.</small> : null}
            </form>
          ) : (
            <div><p>Para proteger participantes e equipes, somente investidores verificados podem iniciar esse tipo de contato.</p><Link className="primary" href="/investor/verification">Verificar minha conta</Link></div>
          )}
          {interest ? <div className="actions" style={{ marginTop: 14 }}><Link className="secondary" href="/investor/interests">Abrir meu pipeline</Link></div> : null}
        </aside>
      </div>
    </LegacySocialShell>
  );
}
