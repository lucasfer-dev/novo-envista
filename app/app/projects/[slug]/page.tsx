import Link from "next/link";
import { notFound } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { updateProductProjectAction } from "@/lib/projects/product-actions";
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
    .select("id,slug,title,short_description,problem,solution,impact,needs,stage,category,location,tags,readme,website_url,repository_url,visibility,owner_user_id,owner_team_id,created_by,owner_user:profiles!projects_owner_user_id_fkey(display_name,username),owner_team:teams!projects_owner_team_id_fkey(name,slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

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
      <div className="project-hero panel">
        <div><div className="project-icon">{project.title.slice(0, 1).toUpperCase()}</div><div><div className="meta-row"><span className="stage">{project.stage}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span>{project.location}</span> : null}</div><h1>{project.title}</h1><p>{project.short_description || "Projeto em construção."}</p><div className="chips">{(project.tags || []).map((tag: string) => <span key={tag}>{tag}</span>)}</div></div></div>
        <div className="actions">{!canEdit && project.visibility === "platform" ? <FollowEntityButton targetType="project" targetId={project.id} returnTo={`/app/projects/${slug}`} /> : null}{canEdit ? <a className="secondary" href="#editar">Editar projeto</a> : null}</div>
      </div>

      {status === "created" ? <div className="form-feedback">Projeto criado. Complete as evidências conforme ele evolui.</div> : null}
      {status === "saved" ? <div className="form-feedback">Projeto atualizado.</div> : null}
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
          <h2>Problema</h2><p>{project.problem || "Ainda não descrito."}</p>
          <h2>Solução</h2><p>{project.solution || "Ainda não descrita."}</p>
          <h2>Impacto e evidências</h2><p>{project.impact || "A equipe ainda não registrou evidências de validação."}</p>
          <h2>O que o projeto precisa agora</h2>{project.needs?.length ? <div className="chips">{project.needs.map((need: string) => <span key={need}>{need}</span>)}</div> : <p>Nenhuma necessidade informada.</p>}
          {(project.website_url || project.repository_url) ? <><h2>Links</h2><div className="actions">{project.website_url ? <a className="primary" href={project.website_url} target="_blank" rel="noreferrer">Abrir site / demo</a> : null}{project.repository_url ? <a className="secondary" href={project.repository_url} target="_blank" rel="noreferrer">Ver repositório</a> : null}</div></> : null}
          <h2>Descrição completa</h2><p style={{ whiteSpace: "pre-wrap" }}>{project.readme || "Sem descrição completa."}</p>
          <h2>Arquivos</h2><ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={canEdit} />
        </section>

        <aside className="panel project-side">
          <h3>Autoria</h3><p><b>{ownerLabel}</b><br /><small>{ownerTeam ? "Equipe" : "Projeto pessoal"}</small></p>
          {canEdit ? <><hr /><Link className="primary" href="/app/interests">Ver interesses recebidos</Link></> : null}
        </aside>
      </div>

      {canEdit ? (
        <section className="panel section-block" id="editar" style={{ padding: 20 }}>
          <h2>Editar projeto</h2>
          <form className="form-page" style={{ padding: 0 }} action={updateProductProjectAction}>
            <input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="slug" value={project.slug} />
            <div className="form-grid"><label>Título<input required name="title" defaultValue={project.title} maxLength={140} /></label><label>Estágio<select name="stage" defaultValue={project.stage}><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label></div>
            <label>Descrição curta<textarea name="short_description" defaultValue={project.short_description} maxLength={320} /></label>
            <label>Problema<textarea name="problem" defaultValue={project.problem} maxLength={4000} /></label>
            <label>Solução<textarea name="solution" defaultValue={project.solution} maxLength={4000} /></label>
            <label>Impacto / validação<textarea name="impact" defaultValue={project.impact} maxLength={4000} /></label>
            <label>Necessidades<input name="needs" defaultValue={(project.needs || []).join(", ")} maxLength={1200} /></label>
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
