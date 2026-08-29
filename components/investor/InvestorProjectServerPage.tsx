import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Building2, MapPin } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { sendProjectInterestAction, toggleProjectSaveAction } from "@/lib/projects/investor-actions";
import { requireProductUser } from "@/lib/auth/require-product-user";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "P";
}

export async function InvestorPublicProjectServerPage({
  pathname,
  slug,
  backHref,
  searchParams,
}: {
  pathname: string;
  slug: string;
  backHref: string;
  searchParams: SearchParams;
}) {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const query = await searchParams;
  const { data: project } = await supabase
    .from("projects")
    .select("id,slug,title,short_description,problem,solution,stage,category,location,tags,readme,visibility,owner_user_id,owner_team_id,owner_user:profiles!projects_owner_user_id_fkey(id,username,display_name),owner_team:teams!projects_owner_team_id_fkey(id,slug,name)")
    .eq("slug", slug)
    .eq("visibility", "platform")
    .maybeSingle();
  if (!project) notFound();

  const [{ data: saved }, { data: interest }] = await Promise.all([
    supabase.from("project_saves").select("project_id").eq("user_id", userId).eq("project_id", project.id).maybeSingle(),
    supabase.from("project_interests").select("id,message,status,updated_at").eq("investor_id", userId).eq("project_id", project.id).maybeSingle(),
  ]);

  const ownerUser = one<any>(project.owner_user);
  const ownerTeam = one<any>(project.owner_team);
  const ownerLabel = ownerTeam?.name ? `Equipe ${ownerTeam.name}` : ownerUser?.display_name || ownerUser?.username || "Projeto Envista";
  const status = first(query.status);
  const error = first(query.error);
  const returnTo = pathname.startsWith("/investor/projects/") ? `${pathname}?from=explore` : pathname;

  return (
    <LegacySocialShell user={appUser} role="investor" pathname={pathname}>
      <Link className="back" href={backHref}>← Voltar</Link>
      <div className="project-hero panel">
        <div>
          <div className="project-icon">{initials(project.title)}</div>
          <div>
            <div className="meta-row">
              <span className="stage">{project.stage}</span>
              {project.category ? <span>{project.category}</span> : null}
              {project.location ? <span><MapPin size={14} /> {project.location}</span> : null}
            </div>
            <h1>{project.title}</h1>
            <p>{project.short_description || "Projeto publicado no Envista."}</p>
            <div className="chips">{(project.tags || []).map((tag: string) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </div>
        <div className="actions">
          <form action={toggleProjectSaveAction}>
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button className="secondary" type="submit"><Bookmark size={16} /> {saved ? "Salvo" : "Salvar projeto"}</button>
          </form>
          <FollowEntityButton targetType="project" targetId={project.id} returnTo={returnTo} />
        </div>
      </div>

      {status === "interest" ? <div className="form-feedback">Interesse registrado. A equipe ou responsável poderá acompanhar esse contato no Envista.</div> : null}
      {error === "interest" ? <div className="form-error">Não foi possível registrar seu interesse.</div> : null}
      {error === "save" ? <div className="form-error">Não foi possível atualizar seus projetos salvos.</div> : null}

      <div className="detail-grid">
        <section className="panel prose">
          <h2>Sobre o projeto</h2>
          <p>{project.short_description || "Ainda não descrito."}</p>
          <h3>Problema</h3>
          <p>{project.problem || "Ainda não descrito."}</p>
          <h3>Solução</h3>
          <p>{project.solution || "Ainda não descrita."}</p>
          <h3>README</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{project.readme || "Sem descrição completa."}</p>
          <h3>Arquivos públicos</h3>
          <ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={false} />
        </section>

        <aside className="panel project-side">
          <h3>Autoria</h3>
          <div className="mini-author"><span className="avatar">{initials(ownerLabel)}</span><div><b>{ownerLabel}</b><small>{ownerTeam ? "Equipe" : "Projeto pessoal"}</small></div></div>
          {ownerTeam ? <p><Building2 size={14} /> Equipe responsável</p> : null}
          <hr />
          <h3>Demonstrar interesse</h3>
          <p>Esse contato é salvo no Envista e fica vinculado à sua conta de investidor e a este projeto.</p>
          <form className="form-page" style={{ padding: 0 }} action={sendProjectInterestAction}>
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <label>Mensagem<textarea name="message" maxLength={1200} defaultValue={interest?.message || `Olá! Gostaria de conhecer melhor o projeto ${project.title} e entender os próximos passos.`} /></label>
            <button className="primary" type="submit">{interest?.status === "active" ? "Atualizar interesse" : "Tenho interesse"}</button>
          </form>
        </aside>
      </div>
    </LegacySocialShell>
  );
}
