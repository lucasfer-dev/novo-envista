import Link from "next/link";
import TeamLogoPanel from "@/components/storage/TeamLogoPanel";
import type { User } from "@/types";
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
import styles from "./Teams.module.css";

type Role = "participant" | "investor";

type TeamSummary = {
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

type Membership = {
  role_label: string;
  access_level: "owner" | "admin" | "member";
  joined_at: string;
  teams: TeamSummary | TeamSummary[] | null;
};

type InvitationSummary = {
  id: string;
  role_label: string;
  access_level: "admin" | "member";
  teams: { id: string; slug: string; name: string } | { id: string; slug: string; name: string }[] | null;
};

type Member = {
  user_id: string;
  role_label: string;
  access_level: "owner" | "admin" | "member";
  joined_at: string;
  profiles: { id: string; username: string; display_name: string; avatar_path: string | null } | { id: string; username: string; display_name: string; avatar_path: string | null }[] | null;
};

type PendingInvitation = {
  id: string;
  invitee_id: string;
  role_label: string;
  access_level: "admin" | "member";
  created_at: string;
  profiles: { username: string; display_name: string } | { username: string; display_name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function prefix(role: Role) {
  return role === "investor" ? "/investor" : "/app";
}

function statusMessage(status?: string) {
  if (!status) return null;
  const messages: Record<string, string> = {
    created: "Equipe criada com sucesso.",
    saved: "Equipe atualizada.",
    invited: "Convite enviado.",
    accepted: "Convite aceito. Você entrou na equipe.",
    declined: "Convite recusado.",
    left: "Você saiu da equipe.",
    deleted: "Equipe excluída.",
    "member-removed": "Membro removido.",
    "invite-cancelled": "Convite cancelado.",
  };
  return messages[status] ?? null;
}

function errorMessage(error?: string) {
  if (!error) return null;
  const messages: Record<string, string> = {
    name: "Informe um nome válido para a equipe.",
    create: "Não foi possível criar a equipe.",
    invalid: "Revise os dados enviados.",
    save: "Não foi possível salvar a equipe.",
    invite: "Não foi possível enviar o convite.",
    "member-not-found": "Usuário não encontrado ou não disponível para convite.",
  };
  return messages[error] ?? "Não foi possível concluir a ação.";
}

export function TeamsIndex({ role, memberships, invitations, status, error }: { role: Role; memberships: Membership[]; invitations: InvitationSummary[]; status?: string; error?: string }) {
  const base = `${prefix(role)}/teams`;
  const notice = statusMessage(status);
  const failure = errorMessage(error);
  return (
    <>
      <div className={styles.head}>
        <div><h1>Minhas equipes</h1><p className={styles.muted}>Equipes ligadas à sua conta real no Envista.</p></div>
        <Link className={styles.primary} href={`${base}/new`}>Criar equipe</Link>
      </div>
      {notice && <div className={styles.notice}>{notice}</div>}
      {failure && <div className={styles.error}>{failure}</div>}

      {invitations.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Convites pendentes</h2>
          <div className={styles.grid}>
            {invitations.map((invite) => {
              const team = one(invite.teams);
              if (!team) return null;
              return (
                <article className={styles.card} key={invite.id}>
                  <h3>{team.name}</h3>
                  <p className={styles.muted}>Função proposta: {invite.role_label}</p>
                  <div className={styles.actions}>
                    <form action={respondTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id}/><input type="hidden" name="response" value="accepted"/><button className={styles.primary}>Aceitar</button></form>
                    <form action={respondTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id}/><input type="hidden" name="response" value="declined"/><button className={styles.secondary}>Recusar</button></form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Equipes</h2>
        {memberships.length === 0 ? <div className={styles.empty}>Você ainda não participa de nenhuma equipe real. Crie uma equipe para começar.</div> : (
          <div className={styles.grid}>
            {memberships.map((membership) => {
              const team = one(membership.teams);
              if (!team) return null;
              return (
                <article className={styles.card} key={team.id}>
                  <Link href={`${base}/${team.slug}`}><h2>{team.name}</h2></Link>
                  <p className={styles.muted}>{team.description || "Sem descrição."}</p>
                  <div className={styles.meta}>
                    <span className={styles.pill}>{membership.role_label}</span>
                    {team.category && <span className={styles.pill}>{team.category}</span>}
                    {team.city && <span className={styles.pill}>{team.city}</span>}
                    <span className={styles.pill}>{team.visibility === "private" ? "Privada" : "Na plataforma"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export function NewTeamView({ role, error }: { role: Role; error?: string }) {
  const base = `${prefix(role)}/teams`;
  const failure = errorMessage(error);
  return (
    <>
      <div className={styles.head}><div><h1>Criar equipe</h1><p className={styles.muted}>A equipe será persistida no Supabase e você será o responsável inicial.</p></div><Link className={styles.secondary} href={base}>Voltar</Link></div>
      {failure && <div className={styles.error}>{failure}</div>}
      <form className={`${styles.card} ${styles.form}`} action={createTeamAction}>
        <label>Nome<input required minLength={2} maxLength={120} name="name" placeholder="Ex.: Equipe Atlas"/></label>
        <label>Descrição<textarea maxLength={1200} name="description" placeholder="O que a equipe está construindo?"/></label>
        <label>Categoria<input maxLength={100} name="category" placeholder="Ex.: Sustentabilidade"/></label>
        <label>Instituição<input maxLength={160} name="institution" placeholder="Escola, universidade ou organização"/></label>
        <label>Cidade<input maxLength={100} name="city"/></label>
        <label>Tags<input maxLength={500} name="tags" placeholder="IA, educação, impacto social"/></label>
        <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privada — somente membros</option></select></label>
        <div className={styles.actions}><button className={styles.primary}>Criar equipe</button><Link className={styles.secondary} href={base}>Cancelar</Link></div>
      </form>
    </>
  );
}

export function TeamDetailView({ role, user, team, members, invitations, canManage, status, error }: { role: Role; user: User; team: TeamSummary; members: Member[]; invitations: PendingInvitation[]; canManage: boolean; status?: string; error?: string }) {
  const base = `${prefix(role)}/teams`;
  const notice = statusMessage(status);
  const failure = errorMessage(error);
  const isOwner = team.owner_id === user.id;
  return (
    <>
      <div className={styles.head}>
        <div><Link className={styles.code} href={base}>← Minhas equipes</Link><h1>{team.name}</h1><p className={styles.muted}>{team.description || "Sem descrição."}</p></div>
        <span className={styles.pill}>{team.visibility === "private" ? "Privada" : "Na plataforma"}</span>
      </div>
      {notice && <div className={styles.notice}>{notice}</div>}
      {failure && <div className={styles.error}>{failure}</div>}
      <div className={styles.twoCol}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Sobre</h2>
            <p><strong>Categoria:</strong> {team.category || "Não informada"}</p>
            <p><strong>Instituição:</strong> {team.institution || "Não informada"}</p>
            <p><strong>Cidade:</strong> {team.city || "Não informada"}</p>
            <div className={styles.meta}>{team.tags.map((tag) => <span className={styles.pill} key={tag}>{tag}</span>)}</div>
          </section>

          <section className={styles.card}>
            <h2>Membros</h2>
            {members.map((member) => {
              const profile = one(member.profiles);
              if (!profile) return null;
              return (
                <div className={styles.member} key={member.user_id}>
                  <div className={styles.memberInfo}><span className={styles.avatar}>{profile.display_name.slice(0,1).toUpperCase()}</span><div><strong>{profile.display_name}</strong><small>@{profile.username} · {member.role_label}</small></div></div>
                  {canManage && member.access_level !== "owner" && <form action={removeTeamMemberAction}><input type="hidden" name="team_id" value={team.id}/><input type="hidden" name="member_id" value={member.user_id}/><input type="hidden" name="slug" value={team.slug}/><button className={styles.danger}>Remover</button></form>}
                </div>
              );
            })}
          </section>
        </div>

        <aside className={styles.stack}>
          <TeamLogoPanel teamId={team.id} currentPath={team.logo_path} canManage={canManage} />
          {canManage && <section className={styles.card}>
            <h3>Convidar membro</h3>
            <p className={styles.muted}>Por privacidade, o convite usa o @username de uma conta visível na plataforma — não e-mail.</p>
            <form className={styles.form} action={inviteTeamMemberAction}>
              <input type="hidden" name="team_id" value={team.id}/><input type="hidden" name="slug" value={team.slug}/>
              <label>Usuário<input required name="username" placeholder="@usuario" maxLength={50}/></label>
              <label>Função<input required name="role_label" defaultValue="Membro" maxLength={80}/></label>
              <label>Permissão<select name="access_level" defaultValue="member"><option value="member">Membro</option><option value="admin">Administrador da equipe</option></select></label>
              <button className={styles.primary}>Enviar convite</button>
            </form>
            {invitations.length > 0 && <div className={styles.section}><h3>Convites pendentes</h3>{invitations.map((invite) => { const profile = one(invite.profiles); return <div className={styles.member} key={invite.id}><div><strong>{profile?.display_name || "Usuário"}</strong><small>@{profile?.username || "—"} · {invite.role_label}</small></div><form action={cancelTeamInvitationAction}><input type="hidden" name="invitation_id" value={invite.id}/><input type="hidden" name="slug" value={team.slug}/><button className={styles.secondary}>Cancelar</button></form></div>; })}</div>}
          </section>}

          {canManage && <section className={styles.card}>
            <h3>Editar equipe</h3>
            <form className={styles.form} action={updateTeamAction}>
              <input type="hidden" name="team_id" value={team.id}/><input type="hidden" name="slug" value={team.slug}/>
              <label>Nome<input required name="name" defaultValue={team.name} maxLength={120}/></label>
              <label>Descrição<textarea name="description" defaultValue={team.description} maxLength={1200}/></label>
              <label>Categoria<input name="category" defaultValue={team.category} maxLength={100}/></label>
              <label>Instituição<input name="institution" defaultValue={team.institution} maxLength={160}/></label>
              <label>Cidade<input name="city" defaultValue={team.city} maxLength={100}/></label>
              <label>Tags<input name="tags" defaultValue={team.tags.join(", ")} maxLength={500}/></label>
              <label>Visibilidade<select name="visibility" defaultValue={team.visibility}><option value="platform">Na plataforma</option><option value="private">Privada</option></select></label>
              <button className={styles.primary}>Salvar alterações</button>
            </form>
          </section>}

          <section className={styles.card}>
            <h3>Zona de controle</h3>
            {isOwner ? <form action={deleteTeamAction}><input type="hidden" name="team_id" value={team.id}/><button className={styles.danger}>Excluir equipe</button></form> : <form action={leaveTeamAction}><input type="hidden" name="team_id" value={team.id}/><button className={styles.danger}>Sair da equipe</button></form>}
          </section>
        </aside>
      </div>
    </>
  );
}
