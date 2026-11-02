import Link from "next/link";
import { notFound } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ShareProjectButton from "@/components/public/ShareProjectButton";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { updateProductProjectAction } from "@/lib/projects/product-actions";
import ProjectDetailTabs from "@/components/projects/ProjectDetailTabs";
import { normalizeProjectDetails, PROJECT_TYPE_LABELS } from "@/lib/projects/project-details";
import { deleteProjectAction } from "@/lib/projects/actions";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const { data: project } = await supabase
    .from("projects")
    .select("id,slug,title,cover_path,short_description,problem,solution,impact,needs,stage,category,location,tags,readme,details,website_url,repository_url,project_type,target_audience,differentiator,objective,team_description,challenges,technologies,collaboration_roles,seeking_investment,business_model,target_market,traction,investment_amount,use_of_funds,pitch_deck_url,visibility,owner_user_id,owner_team_id,created_by,owner_user:profiles!projects_owner_user_id_fkey(display_name,username),owner_team:teams!projects_owner_team_id_fkey(name,slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();
  const { data: signedCover } = project.cover_path
    ? await supabase.storage.from("project-assets").createSignedUrl(project.cover_path, 900)
    : { data: null };
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

  let canEdit = project.owner_user_id === userId;
  let canDelete = canEdit;
  if (project.owner_team_id) {
    const { data: membership } = await supabase.from("team_members").select("access_level").eq("team_id", project.owner_team_id).eq("user_id", userId).maybeSingle();
    canEdit = Boolean(membership);
    canDelete = membership?.access_level === "owner" || membership?.access_level === "admin";
  }

  if (!canEdit && project.visibility === "platform") {
    await supabase.from("project_view_events").insert({ project_id: project.id, viewer_id: userId, source: "participant_project" }).then(() => undefined);
  }

  const [{ data: metric }, { count: interestCount }] = canEdit
    ? await Promise.all([
        supabase.from("project_metrics").select("view_count,last_viewed_at").eq("project_id", project.id).maybeSingle(),
        supabase.from("project_interests").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      ])
    : [{ data: null } as any, { count: null } as any];

  const ownerUser = one<any>(project.owner_user);
  const ownerTeam = one<any>(project.owner_team);
  const ownerLabel = ownerTeam?.name ? `Equipe ${ownerTeam.name}` : ownerUser?.display_name || ownerUser?.username || "Projeto Envista";
  const status = typeof query.status === "string" ? query.status : "";
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <LegacySocialShell user={appUser} role="participant" pathname={`/app/projects/${slug}`}>
      <Link className="back" href="/app/projects">← Voltar aos projetos</Link>
      {signedCover?.signedUrl ? <div className="project-cover-wrap"><img className="project-cover-banner" src={signedCover.signedUrl} alt={`Capa de ${project.title}`} /></div> : null}
      <div className="project-hero panel">
        <div><div className="project-icon">{project.title.slice(0, 1).toUpperCase()}</div><div><div className="meta-row"><span className="stage">{project.stage}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span>{project.location}</span> : null}</div><h1>{project.title}</h1><p>{project.short_description || "Projeto em construção."}</p><div className="chips">{(project.tags || []).map((tag: string) => <span key={tag}>{tag}</span>)}</div></div></div>
        <div className="actions">{!canEdit && project.visibility === "platform" ? <FollowEntityButton targetType="project" targetId={project.id} returnTo={`/app/projects/${slug}`} /> : null}{canEdit && project.visibility === "platform" ? <><Link className="secondary" href={`/p/${project.slug}`} target="_blank">Ver página pública</Link><ShareProjectButton className="secondary" title={project.title} href={`/p/${project.slug}`} /></> : null}{canEdit ? <a className="secondary" href="#editar">Editar projeto</a> : null}</div>
      </div>

      {status === "created" ? <div className="form-feedback">Projeto criado. Complete as evidências conforme ele evolui.</div> : null}
      {status === "saved" ? <div className="form-feedback">Projeto atualizado.</div> : null}
      {canEdit && project.visibility === "platform" ? <div className="form-feedback">Sua página pública está ativa em <Link href={`/p/${project.slug}`}>/p/{project.slug}</Link>. Compartilhe esse link como portfólio, em processos seletivos e nas redes.</div> : null}
      {error ? <div className="form-error">{error === "url" ? "Use links HTTPS válidos." : "Não foi possível concluir a alteração."}</div> : null}

      {canEdit ? (
        <div className="admin-stats section-block">
          <div className="panel"><b>{metric?.view_count ?? 0}</b><span>visualizações únicas/dia</span></div>
          <div className="panel"><b>{interestCount ?? 0}</b><span>interesses recebidos</span></div>
          <div className="panel"><b>{project.visibility === "platform" ? "Publicado" : "Privado"}</b><span>visibilidade atual</span></div>
        </div>
      ) : null}

      <div className="detail-grid">
        <section className="panel prose">
          <ProjectDetailTabs tabs={[
            { id: "overview", label: "Visão geral", content: <>
              <h2>Problema</h2><p>{project.problem || "Ainda não descrito."}</p>
              <h2>Solução</h2><p>{project.solution || "Ainda não descrita."}</p>
              {objective ? <><h2>Objetivo principal</h2><p>{objective}</p></> : null}
              {targetAudience ? <><h2>Público-alvo</h2><p>{targetAudience}</p></> : null}
            </> },
            { id: "development", label: "Desenvolvimento", content: <>
              {projectType ? <><h2>Tipo de projeto</h2><p>{PROJECT_TYPE_LABELS[projectType] || projectType}</p></> : null}
              {differentiator ? <><h2>Diferencial competitivo</h2><p>{differentiator}</p></> : null}
              {technologies.length ? <><h2>Tecnologias utilizadas</h2><div className="chips">{technologies.map((item: string) => <span key={item}>{item}</span>)}</div></> : null}
              <h2>Impacto e validação</h2><p>{impact || "Ainda não informado."}</p>
              {challenges ? <><h2>Principais desafios</h2><p>{challenges}</p></> : null}
              {nextGoals ? <><h2>Próximos objetivos</h2><p>{nextGoals}</p></> : null}
            </> },
            { id: "team", label: "Equipe e oportunidades", content: <>
              {project.team_description ? <><h2>Equipe atual</h2><p>{project.team_description}</p></> : null}
              <h2>O que o projeto precisa agora</h2>{project.needs?.length ? <div className="chips">{project.needs.map((need: string) => <span key={need}>{need}</span>)}</div> : <p>Nenhuma necessidade informada.</p>}
              {project.collaboration_roles?.length ? <><h2>Oportunidades de colaboração</h2><div className="chips">{project.collaboration_roles.map((role: string) => <span key={role}>{role}</span>)}</div></> : null}
              {seekingInvestment ? <><h2>Busca investimento</h2>
                {project.business_model ? <p><strong>Modelo de negócio:</strong> {project.business_model}</p> : null}
                {project.target_market ? <p><strong>Mercado:</strong> {project.target_market}</p> : null}
                {project.traction ? <p><strong>Tração:</strong> {project.traction}</p> : null}
                {project.investment_amount ? <p><strong>Investimento desejado:</strong> {project.investment_amount}</p> : null}
                {project.use_of_funds ? <p><strong>Destinação dos recursos:</strong> {project.use_of_funds}</p> : null}
                {project.pitch_deck_url ? <a className="secondary" href={project.pitch_deck_url} target="_blank" rel="noopener noreferrer">Ver pitch deck</a> : null}
              </> : null}
            </> },
            { id: "presentation", label: "Apresentação", content: <>
              {(project.website_url || project.repository_url) ? <><h2>Links</h2><div className="actions">{project.website_url ? <a className="primary" href={project.website_url} target="_blank" rel="noreferrer">Abrir site / demonstração</a> : null}{project.repository_url ? <a className="secondary" href={project.repository_url} target="_blank" rel="noreferrer">Ver repositório</a> : null}</div></> : <p>Adicione um site ou repositório para apresentar o projeto.</p>}
              <h2>Descrição completa / README</h2><p style={{ whiteSpace: "pre-wrap" }}>{project.readme || "Sem descrição completa."}</p>
            </> },
            { id: "files", label: "Arquivos e capa", content: <ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={canEdit} /> },
          ]} />
        </section>

        <aside className="panel project-side">
          <h3>Autoria</h3><p><b>{ownerLabel}</b><br /><small>{ownerTeam ? "Equipe" : "Projeto pessoal"}</small></p>
          {canEdit ? <><hr /><Link className="primary" href="/app/interests">Ver interesses recebidos</Link></> : null}
        </aside>
      </div>

      {canEdit ? (
        <section className="panel section-block" id="editar" style={{ padding: 20 }}>
          <div className="section-row"><h2>Editar projeto</h2><Link className="secondary" href={`/app/projects/${project.slug}/cockpit`}>Prontidão e próximos passos</Link></div>
          <form className="form-page" style={{ padding: 0 }} action={updateProductProjectAction}>
            <input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="slug" value={project.slug} />
            <div className="form-grid"><label>Título<input required name="title" defaultValue={project.title} maxLength={140} /></label><label>Estágio<select name="stage" defaultValue={project.stage}><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label></div>
            <label>Descrição curta<textarea name="short_description" defaultValue={project.short_description} maxLength={320} /></label>
            <label>Problema<textarea name="problem" defaultValue={project.problem} maxLength={4000} /></label>
            <label>Solução<textarea name="solution" defaultValue={project.solution} maxLength={4000} /></label>
            <label>Impacto esperado<textarea name="impact" defaultValue={impact} maxLength={4000} /></label>
            <div className="form-grid">
              <label>Tipo de projeto<select name="project_type" defaultValue={projectType || "personal"}><option value="personal">Projeto pessoal</option><option value="startup">Startup</option><option value="business">Negócio</option><option value="academic">Projeto acadêmico</option><option value="social">Impacto social</option><option value="research">Pesquisa</option><option value="other">Outro</option></select></label>
              <label>Tecnologias utilizadas<input name="technologies" defaultValue={technologies.join(", ")} maxLength={1800} /></label>
            </div>
            <label>Objetivo principal<textarea name="objective" defaultValue={objective} maxLength={2000} /></label>
            <label>Público-alvo<textarea name="target_audience" defaultValue={targetAudience} maxLength={2000} /></label>
            <label>Diferencial competitivo<textarea name="differentiator" defaultValue={differentiator} maxLength={4000} /></label>
            <label>Principais desafios<textarea name="challenges" defaultValue={challenges} maxLength={4000} /></label>
            <label>Próximos objetivos<textarea name="next_goals" defaultValue={nextGoals} maxLength={2000} /></label>
            <label>Equipe e funções<textarea name="team_description" defaultValue={project.team_description || ""} maxLength={2000} /></label>
            <label>Necessidades<input name="needs" defaultValue={(project.needs || []).join(", ")} maxLength={1200} /></label>
            <fieldset style={{ border: "1px solid var(--ev-border)", borderRadius: 10, padding: 14 }}><legend>Oportunidades de colaboração</legend>
              {["developer", "designer", "mentor", "investor", "tester", "partner", "community"].map((role) => <label key={role} style={{ display: "inline-flex", gap: 8, alignItems: "center", margin: 8 }}><input type="checkbox" name="collaboration_roles" value={role} defaultChecked={(project.collaboration_roles || []).includes(role)} style={{ width: 18 }} /> {role}</label>)}
            </fieldset>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" name="seeking_investment" defaultChecked={seekingInvestment} style={{ width: 18 }} /> Busca investimento</label>
            <label>Modelo de negócio<textarea name="business_model" defaultValue={project.business_model || ""} maxLength={2000} /></label>
            <label>Mercado de atuação<textarea name="target_market" defaultValue={project.target_market || ""} maxLength={2000} /></label>
            <label>Tração<textarea name="traction" defaultValue={project.traction || ""} maxLength={2000} /></label>
            <label>Investimento desejado<input name="investment_amount" defaultValue={project.investment_amount || ""} maxLength={100} /></label>
            <label>Destinação dos recursos<textarea name="use_of_funds" defaultValue={project.use_of_funds || ""} maxLength={2000} /></label>
            <label>Pitch deck (URL HTTPS)<input type="url" name="pitch_deck_url" defaultValue={project.pitch_deck_url || ""} maxLength={500} /></label>
            <div className="form-grid"><label>Categoria<input name="category" defaultValue={project.category} maxLength={100} /></label><label>Localização<input name="location" defaultValue={project.location} maxLength={160} /></label></div>
            <label>Tags<input name="tags" defaultValue={(project.tags || []).join(", ")} maxLength={700} /></label>
            <div className="form-grid"><label>Site / demo<input type="url" name="website_url" defaultValue={project.website_url} maxLength={500} /></label><label>Repositório<input type="url" name="repository_url" defaultValue={project.repository_url} maxLength={500} /></label></div>
            <label>Descrição completa / README<textarea name="readme" defaultValue={project.readme} maxLength={20000} /></label>
            <label>Visibilidade<select name="visibility" defaultValue={project.visibility}><option value="platform">Visível no Envista</option><option value="private">Privado</option></select></label>
            <button className="primary" type="submit">Salvar alterações</button>
          </form>
          {canDelete ? <form action={deleteProjectAction} style={{ marginTop: 20 }}><input type="hidden" name="project_id" value={project.id} /><button className="danger" type="submit">Excluir projeto</button></form> : null}
        </section>
      ) : null}
    </LegacySocialShell>
  );
}
