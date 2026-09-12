import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, GitBranch, Link2, MapPin, Users } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { calculateProjectReadiness } from "@/lib/projects/readiness-score";
import {
  createProjectMilestoneAction,
  createProjectUpdateAction,
  deleteProjectMilestoneAction,
  deleteProjectUpdateAction,
  toggleProjectMilestoneAction,
  updateProjectProfessionalLinksAction,
} from "@/lib/projects/professional-actions";
import styles from "@/components/product/ProfessionalSuite.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ProjectCockpitPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const { data: project } = await supabase
    .from("projects")
    .select("id,slug,title,short_description,problem,solution,impact,stage,category,location,tags,needs,readme,cover_path,visibility,owner_user_id,owner_team_id,website_url,repository_url,demo_url,design_url,updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

  let canEdit = project.owner_user_id === userId;
  if (project.owner_team_id) {
    const { data: membership } = await supabase.from("team_members").select("access_level").eq("team_id", project.owner_team_id).eq("user_id", userId).maybeSingle();
    canEdit = Boolean(membership);
  }
  if (!canEdit) notFound();

  const [milestonesResult, updatesResult, metricResult, savesResult, interestsResult, membersResult] = await Promise.all([
    supabase.from("project_milestones").select("id,title,description,due_date,completed_at,created_at").eq("project_id", project.id).order("position", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("project_updates").select("id,title,body,created_at,author_id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("project_metrics").select("view_count,last_viewed_at").eq("project_id", project.id).maybeSingle(),
    supabase.from("project_saves").select("user_id", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("project_interests").select("id", { count: "exact", head: true }).eq("project_id", project.id),
    project.owner_team_id ? supabase.from("team_members").select("user_id,role_label,profiles:user_id(display_name,username)").eq("team_id", project.owner_team_id).limit(30) : Promise.resolve({ data: [] as any[] }),
  ]);

  const milestones = milestonesResult.data ?? [];
  const completed = milestones.filter((item: any) => item.completed_at).length;
  const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;
  const readiness = calculateProjectReadiness(project);
  const updates = updatesResult.data ?? [];
  const authorIds = Array.from(new Set(updates.map((item: any) => item.author_id).filter(Boolean)));
  const { data: updateAuthors } = authorIds.length
    ? await supabase.from("profiles").select("id,display_name,username").in("id", authorIds)
    : { data: [] as any[] };
  const authors = new Map((updateAuthors ?? []).map((profile: any) => [profile.id, profile]));
  const members = membersResult.data ?? [];
  const metric = metricResult.data;
  const status = typeof query.status === "string" ? query.status : "";
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/app/projects">
      <div className="page-head">
        <div><h1>{project.title}</h1><p>Cockpit do projeto: progresso, evidências, links, equipe, métricas e histórico de evolução.</p></div>
        <div className="actions"><Link className="secondary" href={`/app/projects/${encodeURIComponent(project.slug)}`}>Página do projeto</Link>{project.visibility === "platform" ? <Link className="secondary" href={`/p/${encodeURIComponent(project.slug)}`} target="_blank">Página pública <ExternalLink size={14}/></Link> : null}</div>
      </div>
      {status ? <div className="form-feedback">Alterações salvas.</div> : null}
      {error ? <div className="form-error">Não foi possível salvar esta alteração.</div> : null}

      <div className={styles.grid}>
        <div className={styles.metric}><b>{readiness.score}%</b><span>prontidão do projeto</span></div>
        <div className={styles.metric}><b>{Number(metric?.view_count || 0)}</b><span>visualizações</span></div>
        <div className={styles.metric}><b>{savesResult.count ?? 0}</b><span>salvamentos</span></div>
        <div className={styles.metric}><b>{interestsResult.count ?? 0}</b><span>interesses</span></div>
      </div>

      <section className="section-block panel" style={{ padding: 20 }}>
        <div className="section-row">
          <div><h2>Prontidão para apresentar</h2><p>Score explicável de completude do projeto — sem IA opaca. Estado atual: <strong>{readiness.level}</strong>.</p></div>
          <strong>{readiness.score}%</strong>
        </div>
        <div className={styles.progress}><i style={{ width: `${readiness.score}%` }} /></div>
        {readiness.missing.length ? (
          <div style={{ marginTop: 14 }}>
            <strong>Próximos passos que mais aumentam a qualidade:</strong>
            <ul>{readiness.missing.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : <p style={{ marginTop: 14 }}>Os principais sinais de apresentação estão completos. Agora foque em evidências de uso, evolução e resultados.</p>}
      </section>

      <section className="section-block panel" style={{ padding: 20 }}>
        <div className="section-row"><div><h2>Progresso</h2><p>{completed} de {milestones.length} marcos concluídos.</p></div><strong>{progress}%</strong></div>
        <div className={styles.progress}><i style={{ width: `${progress}%` }} /></div>
        <div className="meta-row" style={{ marginTop: 12 }}><span>{project.stage}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span><MapPin size={14}/> {project.location}</span> : null}<span>Atualizado {new Date(project.updated_at).toLocaleDateString("pt-BR")}</span></div>
      </section>

      <div className="detail-grid">
        <section className="panel" style={{ padding: 20 }}>
          <div className="section-row"><div><h2>Marcos</h2><p>Transforme a evolução do projeto em etapas visíveis.</p></div></div>
          <form action={createProjectMilestoneAction} className="form-page" style={{ padding: 0, marginBottom: 18 }}>
            <input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="slug" value={project.slug}/>
            <label>Título<input name="title" minLength={2} maxLength={140} required placeholder="Ex.: Protótipo validado com 10 usuários"/></label>
            <label>Descrição<textarea name="description" maxLength={700} placeholder="O que precisa estar verdadeiro para considerar este marco concluído?"/></label>
            <label>Prazo<input type="date" name="due_date"/></label>
            <button className="primary" type="submit">Adicionar marco</button>
          </form>
          {milestones.length ? milestones.map((item: any) => <article className={styles.task} key={item.id}>
            <h4>{item.completed_at ? "✓ " : "○ "}{item.title}</h4><p>{item.description || "Sem descrição."}</p>
            <div className={styles.taskFooter}><small>{item.due_date ? `Prazo ${new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo"}</small><div style={{ display:"flex", gap:6 }}><form action={toggleProjectMilestoneAction}><input type="hidden" name="milestone_id" value={item.id}/><input type="hidden" name="slug" value={project.slug}/><input type="hidden" name="complete" value={item.completed_at ? "false" : "true"}/><button type="submit">{item.completed_at ? "Reabrir" : "Concluir"}</button></form><form action={deleteProjectMilestoneAction}><input type="hidden" name="milestone_id" value={item.id}/><input type="hidden" name="slug" value={project.slug}/><button type="submit">Remover</button></form></div></div>
          </article>) : <div className="empty"><h3>Nenhum marco ainda</h3><p>Crie marcos para transformar o projeto em uma jornada mensurável.</p></div>}
        </section>

        <aside className="panel" style={{ padding: 20 }}>
          <h2>Links profissionais</h2><p style={{ color:"#8395a8" }}>Conecte código, demo e design ao projeto.</p>
          <form action={updateProjectProfessionalLinksAction} className="form-page" style={{ padding:0 }}>
            <input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="slug" value={project.slug}/>
            <label><GitBranch size={14}/> Repositório<input type="url" name="repository_url" defaultValue={project.repository_url || ""} placeholder="https://github.com/..."/></label>
            <label><ExternalLink size={14}/> Demo<input type="url" name="demo_url" defaultValue={project.demo_url || ""} placeholder="https://..."/></label>
            <label><Link2 size={14}/> Design / protótipo<input type="url" name="design_url" defaultValue={project.design_url || ""} placeholder="https://figma.com/..."/></label>
            <button className="primary" type="submit">Salvar links</button>
          </form>
          {members.length ? <><hr/><h3><Users size={16}/> Equipe</h3>{members.map((member:any)=>{const p=one<any>(member.profiles);return <p key={member.user_id}><strong>{p?.display_name || p?.username || "Membro"}</strong><br/><small>{member.role_label || "Membro da equipe"}</small></p>})}</> : null}
          <hr/><p><b>Última visualização</b><br/>{metric?.last_viewed_at ? new Date(metric.last_viewed_at).toLocaleString("pt-BR") : "Ainda sem visualizações registradas"}</p>
        </aside>
      </div>

      <section className="section-block panel" style={{ padding: 20 }}>
        <div className="section-row"><div><h2>Changelog</h2><p>Registre versões, testes, aprendizados e entregas importantes.</p></div></div>
        <form action={createProjectUpdateAction} className="form-page" style={{ padding:0, marginBottom:20 }}><input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="slug" value={project.slug}/><label>Título<input name="title" minLength={2} maxLength={160} required placeholder="Ex.: MVP v0.2 publicado"/></label><label>O que mudou<textarea name="body" maxLength={4000} placeholder="Mudanças, aprendizados, métricas, próximos passos..."/></label><button className="primary" type="submit">Publicar atualização</button></form>
        {updates.length ? <div className={styles.activityList}>{updates.map((item:any)=>{const author:any=authors.get(item.author_id);return <article className={styles.activityItem} key={item.id}><span className={styles.activityDot}/><span><strong>{item.title}</strong><small>{item.body || "Atualização do projeto."}<br/>{author?.display_name || author?.username || "Equipe"} · {new Date(item.created_at).toLocaleString("pt-BR")}</small></span><form action={deleteProjectUpdateAction}><input type="hidden" name="update_id" value={item.id}/><input type="hidden" name="slug" value={project.slug}/><button className="secondary" type="submit">Remover</button></form></article>})}</div> : <div className="empty"><h3>Sem atualizações ainda</h3><p>Use o changelog para mostrar que o projeto está vivo e evoluindo.</p></div>}
      </section>
    </LegacySocialShell>
  );
}
