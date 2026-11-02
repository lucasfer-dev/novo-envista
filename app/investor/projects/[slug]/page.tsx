import Link from "next/link";
import { notFound } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { sendProjectInterestAction, toggleProjectSaveAction } from "@/lib/projects/investor-actions";
import ProjectDetailTabs from "@/components/projects/ProjectDetailTabs";
import { normalizeProjectDetails, PROJECT_TYPE_LABELS } from "@/lib/projects/project-details";

const opportunityNames: Record<string, string> = { developer: "Desenvolvedores", designer: "Designers", mentor: "Mentores", investor: "Investidores", tester: "Pessoas para testar", partner: "Parceiros", community: "Divulgação e comunidade" };

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
    .select("id,slug,title,cover_path,short_description,problem,solution,impact,needs,stage,category,location,tags,readme,details,website_url,repository_url,project_type,target_audience,differentiator,objective,team_description,challenges,technologies,collaboration_roles,seeking_investment,business_model,target_market,traction,investment_amount,use_of_funds,pitch_deck_url,visibility,owner_user_id,owner_team_id,owner_user:profiles!projects_owner_user_id_fkey(id,username,display_name),owner_team:teams!projects_owner_team_id_fkey(id,slug,name)")
    .eq("slug", slug)
    .eq("visibility", "platform")
    .maybeSingle();
  if (!project) notFound();
  const { data: signedCover } = project.cover_path
    ? await supabase.storage.from("project-assets").createSignedUrl(project.cover_path, 900)
    : { data: null };
  const coverUrl = signedCover?.signedUrl ?? null;
  const legacyDetails = normalizeProjectDetails(project.details);
  const projectType = project.project_type === "personal" && legacyDetails.project_type ? legacyDetails.project_type : project.project_type;
  const objective = project.objective || legacyDetails.main_goal;
  const targetAudience = project.target_audience || legacyDetails.target_audience;
  const differentiator = project.differentiator || legacyDetails.competitive_edge;
  const technologies = project.technologies?.length ? project.technologies : legacyDetails.technologies;
  const impact = project.impact || legacyDetails.validation;
  const challenges = project.challenges || legacyDetails.challenges;
  const nextGoals = legacyDetails.next_goals;
  const seekingInvestment = project.seeking_investment || legacyDetails.seeking_investment;

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
      {coverUrl ? <div className="project-cover-wrap"><img className="project-cover-banner" src={coverUrl} alt={`Capa de ${project.title}`} /></div> : null}
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
          <ProjectDetailTabs ariaLabel="Informações do projeto" tabs={[
            { id: "overview", label: "Visão geral", content: <><h2>Resumo executivo</h2><h3>Problema</h3><p>{project.problem || "Ainda não descrito."}</p><h3>Solução</h3><p>{project.solution || "Ainda não descrita."}</p>{objective ? <><h3>Objetivo principal</h3><p>{objective}</p></> : null}{targetAudience ? <><h3>Público-alvo</h3><p>{targetAudience}</p></> : null}</> },
            { id: "development", label: "Desenvolvimento", content: <>{projectType ? <><h3>Tipo de projeto</h3><p>{PROJECT_TYPE_LABELS[projectType] || projectType}</p></> : null}{differentiator ? <><h3>Diferencial</h3><p>{differentiator}</p></> : null}{technologies.length ? <><h3>Tecnologias</h3><div className="chips">{technologies.map((item: string) => <span key={item}>{item}</span>)}</div></> : null}<h3>Impacto e evidências</h3><p>{impact || "A equipe ainda não registrou evidências de validação."}</p>{challenges ? <><h3>Principais desafios</h3><p>{challenges}</p></> : null}{nextGoals ? <><h3>Próximos objetivos</h3><p>{nextGoals}</p></> : null}</> },
            { id: "team", label: "Equipe e oportunidades", content: <>{project.team_description ? <><h3>Equipe</h3><p>{project.team_description}</p></> : null}<h3>Necessidade atual</h3>{project.needs?.length ? <div className="chips">{project.needs.map((need: string) => <span key={need}>{need}</span>)}</div> : <p>Nenhuma necessidade informada.</p>}{project.collaboration_roles?.length ? <><h3>Oportunidades de colaboração</h3><div className="chips">{project.collaboration_roles.map((role: string) => <span key={role}>{opportunityNames[role] || role}</span>)}</div></> : null}{seekingInvestment ? <><h3>Informações para investidores</h3>{project.business_model ? <p><b>Modelo de negócio:</b> {project.business_model}</p> : null}{project.target_market ? <p><b>Mercado:</b> {project.target_market}</p> : null}{project.traction ? <p><b>Tração:</b> {project.traction}</p> : null}{project.investment_amount ? <p><b>Investimento desejado:</b> {project.investment_amount}</p> : null}{project.use_of_funds ? <p><b>Destinação dos recursos:</b> {project.use_of_funds}</p> : null}{project.pitch_deck_url ? <a className="secondary" href={project.pitch_deck_url} target="_blank" rel="noopener noreferrer">Ver pitch deck</a> : null}</> : null}</> },
            { id: "presentation", label: "Apresentação", content: <>{(project.website_url || project.repository_url) ? <><h3>Links verificáveis</h3><div className="actions">{project.website_url ? <a className="primary" href={project.website_url} target="_blank" rel="noreferrer">Abrir site / demonstração</a> : null}{project.repository_url ? <a className="secondary" href={project.repository_url} target="_blank" rel="noreferrer">Ver repositório</a> : null}</div></> : <p>Este projeto ainda não adicionou links externos.</p>}<h3>Descrição completa / README</h3><p style={{ whiteSpace: "pre-wrap" }}>{project.readme || "Sem descrição completa."}</p></> },
            { id: "files", label: "Arquivos", content: <ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={false} /> },
          ]} />
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
