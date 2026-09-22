import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban, MapPin, Plus } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/lib/projects/actions";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  problem: string;
  solution: string;
  stage: string;
  category: string;
  location: string;
  tags: string[];
  readme: string;
  visibility: "private" | "platform";
  owner_user_id: string | null;
  owner_team_id: string | null;
  created_by: string;
  owner_user?: unknown;
  owner_team?: unknown;
};

const projectFields = "id,slug,title,short_description,problem,solution,stage,category,location,tags,readme,visibility,owner_user_id,owner_team_id,created_by,owner_user:profiles!projects_owner_user_id_fkey(display_name,username),owner_team:teams!projects_owner_team_id_fkey(name,slug)";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function base(role: ProductRole) {
  return role === "investor" ? "/investor/projects" : "/app/projects";
}

function ownerLabel(project: ProjectRow) {
  const team = one<any>(project.owner_team as any);
  const user = one<any>(project.owner_user as any);
  return team?.name ? `Equipe ${team.name}` : user?.display_name || user?.username || "Autoria pessoal";
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "P";
}

function statusMessage(status?: string) {
  if (status === "created") return "Projeto criado e salvo no Envista.";
  if (status === "saved") return "Projeto atualizado. Seguidores verão a nova atualização no Social.";
  if (status === "deleted") return "Projeto excluído.";
  return null;
}

function errorMessage(error?: string) {
  if (!error) return null;
  if (error === "owner") return "Você não pode publicar em nome dessa equipe.";
  if (error === "title") return "Informe um título válido.";
  return "Não foi possível concluir a ação.";
}

function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? "form-error" : "form-feedback"} role={error ? "alert" : "status"}>{message}</div>;
}

export async function LegacyProjectsIndexPage({
  expectedRole,
  pathname,
  searchParams,
}: {
  expectedRole: ProductRole;
  pathname: string;
  searchParams: SearchParams;
}) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const { data: memberships } = await supabase.from("team_members").select("team_id").eq("user_id", userId);
  const teamIds = (memberships ?? []).map((item: any) => item.team_id);

  const personalPromise = supabase
    .from("projects")
    .select(projectFields)
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });
  const teamPromise = teamIds.length
    ? supabase.from("projects").select(projectFields).in("owner_team_id", teamIds).order("updated_at", { ascending: false })
    : Promise.resolve({ data: [] as ProjectRow[] });

  const [{ data: personal }, { data: teamProjects }] = await Promise.all([personalPromise, teamPromise]);
  const unique = new Map<string, ProjectRow>();
  for (const project of [...((personal ?? []) as ProjectRow[]), ...((teamProjects ?? []) as ProjectRow[])]) unique.set(project.id, project);
  const projects = [...unique.values()];
  const projectBase = base(expectedRole);
  const notice = statusMessage(first(query.status));
  const failure = errorMessage(first(query.error));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div>
          <h1>Meus Projetos</h1>
          <p>Seu portfólio vivo de construção e evolução, agora salvo no Supabase.</p>
        </div>
        <div className="actions">
          <Link className="primary" href={`${projectBase}/new`}><Plus size={16} /> Novo projeto</Link>
        </div>
      </div>

      {notice && <Notice message={notice} />}
      {failure && <Notice message={failure} error />}

      <div className="project-grid section-block">
        {projects.map((project) => (
          <Link className="project-card" href={`${projectBase}/${project.slug}`} key={project.id}>
            <div className="project-cover">
              <span className="project-initial">{initials(project.title)}</span>
              <span className="stage">{project.stage}</span>
            </div>
            <div className="card-body">
              <div className="card-meta">
                <span>{project.category || "Projeto"}</span>
                <span>{project.location?.split(",")[0] || "Envista"}</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.short_description || "Sem descrição curta."}</p>
              <small>{ownerLabel(project)}</small>
              <div className="chips compact">
                {project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="empty">
            <div><FolderKanban size={20} /></div>
            <h3>Nenhum projeto ainda</h3>
            <p>Crie o primeiro projeto. Ele ficará ligado à sua conta real e poderá aparecer no Social.</p>
            <Link className="primary" href={`${projectBase}/new`}>Criar primeiro projeto</Link>
          </div>
        )}
      </div>
    </LegacySocialShell>
  );
}

export async function LegacyNewProjectPage({
  expectedRole,
  pathname,
  searchParams,
}: {
  expectedRole: ProductRole;
  pathname: string;
  searchParams: SearchParams;
}) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  const teams = (memberships ?? []).map((item: any) => one<any>(item.teams)).filter(Boolean) as Array<{ id: string; name: string }>;
  const projectBase = base(expectedRole);
  const failure = errorMessage(first(query.error));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div>
          <h1>Novo projeto</h1>
          <p>Publique em seu nome ou represente uma equipe da qual você faz parte.</p>
        </div>
        <Link className="secondary" href={projectBase}><ArrowLeft size={16} /> Voltar</Link>
      </div>
      {failure && <Notice message={failure} error />}

      <form className="form-page panel" action={createProjectAction}>
        <h2>Quem está publicando este projeto?</h2>
        <label>
          Autoria
          <select name="owner" defaultValue="personal">
            <option value="personal">Meu perfil · {appUser.name}</option>
            {teams.map((team) => <option value={team.id} key={team.id}>Equipe · {team.name}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label>Nome do projeto<input required minLength={2} maxLength={140} name="title" placeholder="Ex.: Aqua" /></label>
          <label>Estágio<select name="stage" defaultValue="Ideia"><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
        </div>
        <label>Descrição curta<textarea name="short_description" maxLength={320} placeholder="Explique o projeto em uma frase clara." /></label>
        <label>Problema<textarea name="problem" maxLength={4000} placeholder="Que problema real você observou?" /></label>
        <label>Solução proposta<textarea name="solution" maxLength={4000} placeholder="Como o projeto responde ao problema?" /></label>
        <div className="form-grid">
          <label>Categoria<input name="category" maxLength={100} placeholder="Tecnologia" /></label>
          <label>Localização<input name="location" maxLength={160} placeholder="Rio de Janeiro, RJ" /></label>
        </div>
        <label>Tags<input name="tags" maxLength={700} placeholder="Arduino, IoT, Educação" /></label>
        <label>README / descrição completa<textarea name="readme" maxLength={20000} placeholder="Detalhes, contexto, próximos passos..." /></label>
        <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privado</option></select></label>
        <div className="form-actions">
          <Link className="secondary" href={projectBase}>Cancelar</Link>
          <button className="primary">Publicar projeto</button>
        </div>
      </form>
    </LegacySocialShell>
  );
}

export async function LegacyProjectDetailPage({
  expectedRole,
  pathname,
  slug,
  backHref,
  publicView = false,
  searchParams,
}: {
  expectedRole: ProductRole;
  pathname: string;
  slug: string;
  backHref: string;
  publicView?: boolean;
  searchParams: SearchParams;
}) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const { data: raw } = await supabase.from("projects").select(projectFields).eq("slug", slug).maybeSingle();
  if (!raw) notFound();
  const project = raw as ProjectRow;

  let canEdit = project.owner_user_id === userId;
  let canDelete = canEdit;
  if (project.owner_team_id) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("access_level")
      .eq("team_id", project.owner_team_id)
      .eq("user_id", userId)
      .maybeSingle();
    canEdit = Boolean(membership);
    canDelete = membership?.access_level === "owner" || membership?.access_level === "admin";
  }

  const notice = statusMessage(first(query.status));
  const failure = errorMessage(first(query.error));
  const projectBase = base(expectedRole);

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <Link className="back" href={backHref}><ArrowLeft size={16} /> Voltar</Link>
      <div className="project-hero panel">
        <div>
          <div className="project-icon">{initials(project.title)}</div>
          <div>
            <div className="meta-row">
              <span className="stage">{project.stage}</span>
              {project.category && <span>{project.category}</span>}
              {project.location && <span><MapPin size={14} /> {project.location}</span>}
            </div>
            <h1>{project.title}</h1>
            <p>{project.short_description || "Sem descrição curta."}</p>
            <div className="chips">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </div>
        <div className="actions">
          {publicView && project.visibility === "platform" && project.owner_user_id !== userId && (
            <FollowEntityButton targetType="project" targetId={project.id} returnTo={pathname} />
          )}
          {canEdit && <Link className="secondary" href={`${projectBase}/${project.slug}#editar`}>Editar projeto</Link>}
        </div>
      </div>

      {notice && <Notice message={notice} />}
      {failure && <Notice message={failure} error />}

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
          <h3>Arquivos</h3>
          <ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={canEdit} />
        </section>

        <aside className="panel project-side">
          <h3>Autoria</h3>
          <div className="mini-author">
            <span className="avatar">{initials(ownerLabel(project))}</span>
            <div><b>{ownerLabel(project)}</b><small>{project.owner_team_id ? "Equipe" : "Projeto pessoal"}</small></div>
          </div>
          <hr />
          <p><b>Visibilidade</b><br />{project.visibility === "private" ? "Privado" : "Na plataforma"}</p>

          {canEdit && (
            <div id="editar">
              <hr />
              <h3>Editar projeto</h3>
              <form className="form-page" style={{ padding: 0 }} action={updateProjectAction}>
                <input type="hidden" name="project_id" value={project.id} />
                <input type="hidden" name="slug" value={project.slug} />
                <label>Título<input required name="title" defaultValue={project.title} maxLength={140} /></label>
                <label>Descrição curta<textarea name="short_description" defaultValue={project.short_description} maxLength={320} /></label>
                <label>Problema<textarea name="problem" defaultValue={project.problem} maxLength={4000} /></label>
                <label>Solução<textarea name="solution" defaultValue={project.solution} maxLength={4000} /></label>
                <label>Estágio<select name="stage" defaultValue={project.stage}><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
                <label>Categoria<input name="category" defaultValue={project.category} maxLength={100} /></label>
                <label>Localização<input name="location" defaultValue={project.location} maxLength={160} /></label>
                <label>Tags<input name="tags" defaultValue={project.tags.join(", ")} maxLength={700} /></label>
                <label>README<textarea name="readme" defaultValue={project.readme} maxLength={20000} /></label>
                <label>Visibilidade<select name="visibility" defaultValue={project.visibility}><option value="platform">Na plataforma</option><option value="private">Privado</option></select></label>
                <button className="primary full">Salvar alterações</button>
              </form>
            </div>
          )}

          {canDelete && (
            <>
              <hr />
              <form action={deleteProjectAction}>
                <input type="hidden" name="project_id" value={project.id} />
                <button className="danger">Excluir projeto</button>
              </form>
            </>
          )}
        </aside>
      </div>
    </LegacySocialShell>
  );
}
