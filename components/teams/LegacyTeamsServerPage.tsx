import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Plus, Users } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import TeamLogoPanel from "@/components/storage/TeamLogoPanel";
import EntityPostsPanel from "@/components/real/EntityPostsPanel";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import {
  cancelTeamInvitationAction,
  createTeamAction,
  deleteTeamAction,
  inviteTeamMemberAction,
  leaveTeamAction,
  removeTeamMemberAction,
  respondTeamInvitationAction,
  updateTeamAction,
} from "@/lib/teams/actions";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type TeamRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  city: string;
  institution: string;
  tags: string[];
  visibility: "private" | "platform";
  owner_id: string;
  logo_path: string | null;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function root(role: ProductRole) {
  return role === "investor" ? "/investor" : "/app";
}

function teamsBase(role: ProductRole) {
  return `${root(role)}/teams`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "E";
}

function statusMessage(status?: string) {
  const messages: Record<string, string> = {
    created: "Equipe criada e salva no Envista.",
    saved: "Equipe atualizada.",
    invited: "Convite enviado.",
    accepted: "Convite aceito. Você entrou na equipe.",
    declined: "Convite recusado.",
    left: "Você saiu da equipe.",
    deleted: "Equipe excluída.",
    "member-removed": "Membro removido.",
    "invite-cancelled": "Convite cancelado.",
  };
  return status ? messages[status] || null : null;
}

function errorMessage(error?: string) {
  if (!error) return null;
  const messages: Record<string, string> = {
    name: "Informe um nome válido para a equipe.",
    create: "Não foi possível criar a equipe.",
    invalid: "Revise os dados enviados.",
    save: "Não foi possível salvar a equipe.",
    invite: "Não foi possível enviar o convite.",
    "member-not-found": "Usuário não encontrado ou indisponível para convite.",
  };
  return messages[error] || "Não foi possível concluir a ação.";
}

function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? "form-error" : "form-feedback"} role={error ? "alert" : "status"}>{message}</div>;
}

export async function LegacyTeamsIndexPage({
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
  const [{ data: memberships }, { data: invitations }] = await Promise.all([
    supabase
      .from("team_members")
      .select("role_label,access_level,joined_at,teams(id,slug,name,description,category,city,institution,tags,visibility,owner_id,logo_path)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false }),
    supabase
      .from("team_invitations")
      .select("id,role_label,access_level,teams(id,slug,name)")
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const base = teamsBase(expectedRole);
  const notice = statusMessage(first(query.status));
  const failure = errorMessage(first(query.error));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div><h1>Minhas equipes</h1><p>Participe de vários contextos sem perder sua função em cada um.</p></div>
        <Link className="primary" href={`${base}/new`}><Plus size={16} /> Criar equipe</Link>
      </div>
      {notice && <Notice message={notice} />}
      {failure && <Notice message={failure} error />}

      {(invitations ?? []).length > 0 && (
        <section className="section-block">
          <h2>Convites pendentes</h2>
          <div className="team-row">
            {(invitations ?? []).map((invite: any) => {
              const team = one<any>(invite.teams);
              if (!team) return null;
              return (
                <article className="panel" style={{ padding: 16 }} key={invite.id}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="avatar">{initials(team.name)}</span>
                    <div><b>{team.name}</b><p style={{ margin: 0 }}>Função proposta: {invite.role_label}</p></div>
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <form action={respondTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id} /><input type="hidden" name="response" value="accepted" /><button className="primary">Aceitar</button></form>
                    <form action={respondTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id} /><input type="hidden" name="response" value="declined" /><button className="secondary">Recusar</button></form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="team-row section-block">
        {(memberships ?? []).map((membership: any) => {
          const team = one<TeamRow>(membership.teams);
          if (!team) return null;
          return (
            <Link className="team-card" href={`${base}/${team.slug}`} key={team.id}>
              <span className="avatar">{initials(team.name)}</span>
              <div>
                <h3>{team.name}</h3>
                <p>{team.description || "Sem descrição."}</p>
                <div className="chips compact">
                  <span>{membership.role_label}</span>
                  {team.category && <span>{team.category}</span>}
                  {team.city && <span>{team.city}</span>}
                </div>
              </div>
            </Link>
          );
        })}
        {(memberships ?? []).length === 0 && (
          <div className="empty">
            <div><Users size={20} /></div>
            <h3>Você ainda não participa de nenhuma equipe</h3>
            <p>Crie uma equipe real ou aceite um convite para começar.</p>
            <Link className="primary" href={`${base}/new`}>Criar primeira equipe</Link>
          </div>
        )}
      </div>
    </LegacySocialShell>
  );
}

export async function LegacyNewTeamPage({
  expectedRole,
  pathname,
  searchParams,
}: {
  expectedRole: ProductRole;
  pathname: string;
  searchParams: SearchParams;
}) {
  const { appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const base = teamsBase(expectedRole);
  const failure = errorMessage(first(query.error));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div><h1>Criar equipe</h1><p>Monte um espaço de trabalho para pessoas, projetos e próximos objetivos.</p></div>
        <Link className="secondary" href={base}><ArrowLeft size={16} /> Voltar</Link>
      </div>
      {failure && <Notice message={failure} error />}
      <form className="form-page panel" action={createTeamAction}>
        <label>Nome<input required minLength={2} maxLength={120} name="name" placeholder="Nome da equipe" /></label>
        <label>Descrição<textarea maxLength={1200} name="description" placeholder="Que tipo de problema essa equipe quer resolver?" /></label>
        <div className="form-grid">
          <label>Categoria<input maxLength={100} name="category" placeholder="Tecnologia" /></label>
          <label>Cidade<input maxLength={100} name="city" placeholder="Rio de Janeiro" /></label>
          <label>Instituição<input maxLength={160} name="institution" placeholder="Escola ou organização" /></label>
          <label>Tags<input maxLength={500} name="tags" placeholder="Robótica, IA, Educação" /></label>
        </div>
        <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privada — somente membros</option></select></label>
        <div className="form-actions"><Link className="secondary" href={base}>Cancelar</Link><button className="primary">Criar equipe</button></div>
      </form>
    </LegacySocialShell>
  );
}

export async function LegacyTeamDetailPage({
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
  const { data: rawTeam } = await supabase
    .from("teams")
    .select("id,slug,name,description,category,city,institution,tags,visibility,owner_id,logo_path")
    .eq("slug", slug)
    .maybeSingle();
  if (!rawTeam) notFound();
  const team = rawTeam as TeamRow;

  const { data: membership } = await supabase
    .from("team_members")
    .select("access_level,role_label")
    .eq("team_id", team.id)
    .eq("user_id", userId)
    .maybeSingle();
  const canManage = team.owner_id === userId || membership?.access_level === "owner" || membership?.access_level === "admin";
  const isOwner = team.owner_id === userId;

  const membersPromise = supabase
    .from("team_members")
    .select("user_id,role_label,access_level,joined_at,profiles!team_members_user_id_fkey(id,username,display_name,avatar_path)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });
  const invitationsPromise = canManage
    ? supabase
        .from("team_invitations")
        .select("id,invitee_id,role_label,access_level,created_at,profiles!team_invitations_invitee_id_fkey(username,display_name)")
        .eq("team_id", team.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as any[] });
  const projectsPromise = supabase
    .from("projects")
    .select("id,slug,title,short_description,stage,category")
    .eq("owner_team_id", team.id)
    .order("updated_at", { ascending: false });

  const [{ data: members }, { data: invitations }, { data: projects }] = await Promise.all([membersPromise, invitationsPromise, projectsPromise]);
  const base = teamsBase(expectedRole);
  const projectBase = `${root(expectedRole)}/projects`;
  const notice = statusMessage(first(query.status));
  const failure = errorMessage(first(query.error));

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <Link className="back" href={backHref}><ArrowLeft size={16} /> Voltar</Link>
      <div className="team-hero panel">
        <div className="team-hero-main">
          <span className="avatar" style={{ width: 70, height: 70, fontSize: 18 }}>{initials(team.name)}</span>
          <div>
            <span className="eyebrow">EQUIPE</span>
            <h1>{team.name}</h1>
            <p>{team.description || "Sem descrição."}</p>
            <div className="meta-row">
              {team.institution && <span><Building2 size={14} /> {team.institution}</span>}
              {team.city && <span><MapPin size={14} /> {team.city}</span>}
            </div>
            <div className="chips">{team.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </div>
        <div className="actions">
          {publicView && team.visibility === "platform" && !membership && (
            <FollowEntityButton targetType="team" targetId={team.id} returnTo={pathname} />
          )}
          {canManage && <Link className="secondary" href={`${base}/${team.slug}#editar`}>Editar equipe</Link>}
        </div>
      </div>

      {notice && <Notice message={notice} />}
      {failure && <Notice message={failure} error />}

      <div className="detail-grid">
        <section className="panel prose">
          <h2>Projetos da equipe</h2>
          <div className="project-grid">
            {(projects ?? []).map((project: any) => (
              <Link className="project-card" href={`${projectBase}/${project.slug}`} key={project.id}>
                <div className="project-cover"><span className="project-initial">{project.title?.slice(0, 1)?.toUpperCase() || "P"}</span><span className="stage">{project.stage}</span></div>
                <div className="card-body"><h3>{project.title}</h3><p>{project.short_description || "Sem descrição."}</p><div className="chips compact">{project.category && <span>{project.category}</span>}</div></div>
              </Link>
            ))}
            {(projects ?? []).length === 0 && <p>Nenhum projeto publicado por esta equipe ainda.</p>}
          </div>

          <h2 style={{ marginTop: 28 }}>Membros</h2>
          {(members ?? []).map((member: any) => {
            const profile = one<any>(member.profiles);
            if (!profile) return null;
            return (
              <div className="member" key={member.user_id}>
                <span className="avatar">{initials(profile.display_name || profile.username)}</span>
                <div style={{ flex: 1 }}><b>{profile.display_name || profile.username}</b><small>{member.role_label}</small></div>
                {canManage && member.access_level !== "owner" && (
                  <form action={removeTeamMemberAction}>
                    <input type="hidden" name="team_id" value={team.id} />
                    <input type="hidden" name="member_id" value={member.user_id} />
                    <input type="hidden" name="slug" value={team.slug} />
                    <button className="danger">Remover</button>
                  </form>
                )}
              </div>
            );
          })}

          <h2 style={{ marginTop: 28 }}>Publicações</h2>
          <EntityPostsPanel teamId={team.id} />
        </section>

        <aside className="panel project-side">
          <TeamLogoPanel teamId={team.id} currentPath={team.logo_path} canManage={Boolean(canManage)} />
          <hr />
          <h3>Informações</h3>
          <p><b>Categoria</b><br />{team.category || "Não informada"}</p>
          <p><b>Visibilidade</b><br />{team.visibility === "private" ? "Privada" : "Na plataforma"}</p>

          {canManage && (
            <>
              <hr />
              <h3>Convidar membro</h3>
              <form className="form-page" style={{ padding: 0 }} action={inviteTeamMemberAction}>
                <input type="hidden" name="team_id" value={team.id} />
                <input type="hidden" name="slug" value={team.slug} />
                <label>Usuário<input required name="username" placeholder="@usuario" maxLength={50} /></label>
                <label>Função<input required name="role_label" defaultValue="Membro" maxLength={80} /></label>
                <label>Permissão<select name="access_level" defaultValue="member"><option value="member">Membro</option><option value="admin">Administrador</option></select></label>
                <button className="primary full">Enviar convite</button>
              </form>
              {(invitations ?? []).map((invite: any) => {
                const profile = one<any>(invite.profiles);
                return (
                  <div className="member" key={invite.id}>
                    <div style={{ flex: 1 }}><b>{profile?.display_name || "Usuário"}</b><small>@{profile?.username || "—"} · {invite.role_label}</small></div>
                    <form action={cancelTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id} /><input type="hidden" name="slug" value={team.slug} /><button className="secondary">Cancelar</button></form>
                  </div>
                );
              })}
            </>
          )}

          {canManage && (
            <div id="editar">
              <hr />
              <h3>Editar equipe</h3>
              <form className="form-page" style={{ padding: 0 }} action={updateTeamAction}>
                <input type="hidden" name="team_id" value={team.id} />
                <input type="hidden" name="slug" value={team.slug} />
                <label>Nome<input required name="name" defaultValue={team.name} maxLength={120} /></label>
                <label>Descrição<textarea name="description" defaultValue={team.description} maxLength={1200} /></label>
                <label>Categoria<input name="category" defaultValue={team.category} maxLength={100} /></label>
                <label>Instituição<input name="institution" defaultValue={team.institution} maxLength={160} /></label>
                <label>Cidade<input name="city" defaultValue={team.city} maxLength={100} /></label>
                <label>Tags<input name="tags" defaultValue={team.tags.join(", ")} maxLength={500} /></label>
                <label>Visibilidade<select name="visibility" defaultValue={team.visibility}><option value="platform">Na plataforma</option><option value="private">Privada</option></select></label>
                <button className="primary full">Salvar alterações</button>
              </form>
            </div>
          )}

          <hr />
          {isOwner ? (
            <form action={deleteTeamAction}><input type="hidden" name="team_id" value={team.id} /><button className="danger">Excluir equipe</button></form>
          ) : membership ? (
            <form action={leaveTeamAction}><input type="hidden" name="team_id" value={team.id} /><button className="danger">Sair da equipe</button></form>
          ) : null}
        </aside>
      </div>
    </LegacySocialShell>
  );
}
