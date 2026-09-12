import Link from "next/link";
import { ExternalLink, Eye, Bookmark, BriefcaseBusiness } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import styles from "@/components/product/ProfessionalSuite.module.css";

function completeness(project: any) {
  const checks = [
    [Boolean(project.short_description?.trim()), "Descrição"],
    [Boolean(project.category?.trim()), "Categoria"],
    [Boolean(project.stage?.trim()), "Estágio"],
    [Boolean(project.location?.trim()), "Localização"],
    [Array.isArray(project.tags) && project.tags.length >= 2, "Tecnologias/tags"],
    [project.visibility === "platform", "Publicado"],
  ] as const;
  const done = checks.filter(([ok]) => ok).length;
  return { score: Math.round(done / checks.length * 100), checks };
}

export async function ProjectInsightsServerPage({ pathname = "/app/insights" }: { pathname?: string }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const { data: memberships } = await supabase.from("team_members").select("team_id").eq("user_id", userId);
  const teamIds = (memberships ?? []).map((item: any) => item.team_id);

  const [personal, teamProjects] = await Promise.all([
    supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags,visibility,updated_at").eq("owner_user_id", userId).order("updated_at", { ascending: false }),
    teamIds.length
      ? supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags,visibility,updated_at").in("owner_team_id", teamIds).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const map = new Map<string, any>();
  for (const project of [...(personal.data ?? []), ...(teamProjects.data ?? [])]) map.set(project.id, project);
  const projects = [...map.values()];
  const ids = projects.map((project) => project.id);

  const [metricsResult, savesResult, interestsResult] = ids.length ? await Promise.all([
    supabase.from("project_metrics").select("project_id,view_count,last_viewed_at").in("project_id", ids),
    supabase.from("project_saves").select("project_id").in("project_id", ids),
    supabase.from("project_interests").select("project_id,status,owner_status").in("project_id", ids),
  ]) : [{ data: [] }, { data: [] }, { data: [] }] as any;

  const metrics = new Map((metricsResult.data ?? []).map((item: any) => [item.project_id, item]));
  const saveCounts = new Map<string, number>();
  for (const item of savesResult.data ?? []) saveCounts.set(item.project_id, (saveCounts.get(item.project_id) ?? 0) + 1);
  const interestCounts = new Map<string, number>();
  for (const item of interestsResult.data ?? []) interestCounts.set(item.project_id, (interestCounts.get(item.project_id) ?? 0) + 1);
  const totalViews = [...metrics.values()].reduce((sum: number, item: any) => sum + Number(item.view_count || 0), 0);
  const totalSaves = [...saveCounts.values()].reduce((sum, value) => sum + value, 0);
  const totalInterests = [...interestCounts.values()].reduce((sum, value) => sum + value, 0);

  return (
    <LegacySocialShell user={appUser} role="participant" pathname={pathname}>
      <div className="page-head"><div><h1>Insights dos projetos</h1><p>Qualidade do portfólio, alcance e sinais de interesse em um painel só.</p></div><Link className="primary" href="/app/projects/new">Novo projeto</Link></div>
      <div className={styles.grid}>
        <div className={styles.metric}><Eye size={18} /><b>{totalViews}</b><span>visualizações</span></div>
        <div className={styles.metric}><Bookmark size={18} /><b>{totalSaves}</b><span>salvamentos</span></div>
        <div className={styles.metric}><BriefcaseBusiness size={18} /><b>{totalInterests}</b><span>interesses recebidos</span></div>
      </div>

      <section className="section-block">
        <div className="section-row"><div><h2>Prontidão para oportunidades</h2><p>Quanto mais completo o projeto, melhor ele comunica valor para equipes e investidores.</p></div></div>
        {projects.length ? <div className="panel">
          {projects.map((project) => {
            const ready = completeness(project);
            const metric: any = metrics.get(project.id) ?? { view_count: 0 };
            return <article key={project.id} className={styles.projectRow}>
              <div>
                <div className={styles.score}><span className={styles.scoreRing}>{ready.score}%</span><span className={styles.scoreText}><strong>{project.title}</strong><span>{Number(metric.view_count || 0)} visualizações · {saveCounts.get(project.id) ?? 0} salvos · {interestCounts.get(project.id) ?? 0} interesses</span></span></div>
                <div className={styles.progress}><i style={{ width: `${ready.score}%` }} /></div>
                <div className={styles.readinessList}>{ready.checks.map(([done, label]) => <span key={label} data-done={done}>{done ? "✓" : "○"} {label}</span>)}</div>
              </div>
              <div className={styles.projectActions}><Link className="secondary" href={`/app/projects/${encodeURIComponent(project.slug)}`}>Abrir</Link>{project.visibility === "platform" ? <Link className="secondary" href={`/p/${encodeURIComponent(project.slug)}`} target="_blank">Compartilhar <ExternalLink size={14} /></Link> : null}</div>
            </article>;
          })}
        </div> : <div className="empty"><h3>Crie seu primeiro projeto</h3><p>Os indicadores de prontidão e alcance aparecem assim que você tiver um projeto.</p><Link className="primary" href="/app/projects/new">Criar projeto</Link></div>}
      </section>
    </LegacySocialShell>
  );
}
