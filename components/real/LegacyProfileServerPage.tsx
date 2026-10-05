import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, GitCommitHorizontal, Github, GitFork, MapPin, MessageCircle, School, Star } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import ReportContentForm from "@/components/moderation/ReportContentForm";
import { startConversationAction } from "@/lib/messages/actions";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import styles from "@/components/product/ProfessionalSuite.module.css";

function root(role: ProductRole) { return role === "investor" ? "/investor" : ""; }
function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }

export async function LegacyPublicProfileServerPage({ expectedRole, username, pathname }: { expectedRole: ProductRole; username: string; pathname: string }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,role,avatar_path,public_city,public_state,public_school,organization,organization_type,profile_visibility,allow_messages,headline,skills,github_url,linkedin_url,website_url")
    .eq("username", username)
    .maybeSingle();

  if (!profile || (profile.id !== userId && profile.profile_visibility !== "platform")) notFound();

  const [{ data: posts }, { data: projects }, { data: memberships }] = await Promise.all([
    supabase.from("posts").select("id,body,created_at").eq("author_user_id", profile.id).eq("visibility", "platform").order("created_at", { ascending: false }).limit(20),
    supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").eq("owner_user_id", profile.id).eq("visibility", "platform").order("updated_at", { ascending: false }).limit(20),
    supabase.from("team_members").select("role_label,teams(id,slug,name,description,category,city,tags,visibility)").eq("user_id", profile.id).order("joined_at", { ascending: false }),
  ]);

  const teams = (memberships ?? []).map((membership: any) => Array.isArray(membership.teams) ? membership.teams[0] : membership.teams).filter((team: any) => team?.visibility === "platform");
  const base = root(expectedRole);
  const own = profile.id === userId;
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="profile-head panel">
        <span className="avatar" style={{ width: 76, height: 76, fontSize: 20 }}>{initials(profile.display_name)}</span>
        <div className="profile-main">
          <div className="profile-title-line"><h1>{profile.display_name}</h1><span className="role-status">{profile.role === "investor" ? "Investidor" : "Participante"}</span></div>
          <p className="profile-username">@{profile.username}</p>
          {profile.headline ? <p style={{ color: "#d7e3eb", fontWeight: 700, margin: "5px 0 8px" }}>{profile.headline}</p> : null}
          <p className="profile-bio">{profile.bio || "Este perfil ainda não adicionou uma bio."}</p>
          <div className="profile-meta">
            {profile.public_school ? <span><School size={14} /> {profile.public_school}</span> : null}
            {profile.public_city || profile.public_state ? <span><MapPin size={14} /> {[profile.public_city, profile.public_state].filter(Boolean).join(", ")}</span> : null}
            {profile.organization ? <span><Building2 size={14} /> {profile.organization}</span> : null}
            {profile.organization_type ? <span>{profile.organization_type}</span> : null}
          </div>
          {skills.length ? <div className={styles.readinessList}>{skills.slice(0, 12).map((skill: string) => <span key={skill} data-done="true">{skill}</span>)}</div> : null}
          <div className={styles.links} style={{ marginTop: 12 }}>
            {profile.github_url ? <a className={styles.linkChip} href={profile.github_url} target="_blank" rel="noreferrer"><Github size={14}/> GitHub{(githubRepos ?? []).length ? " conectado" : ""}</a> : null}
            {profile.linkedin_url ? <a className={styles.linkChip} href={profile.linkedin_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> LinkedIn</a> : null}
            {profile.website_url ? <a className={styles.linkChip} href={profile.website_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Portfólio</a> : null}
          </div>
        </div>
        <div className="profile-actions">
          {own ? <><Link className="secondary" href="/account/profile">Editar perfil</Link><Link className="secondary" href="/account/professional">Perfil profissional</Link></> : <><FollowEntityButton targetType="profile" targetId={profile.id} returnTo={pathname} />{profile.allow_messages ? <form action={startConversationAction}><input type="hidden" name="username" value={profile.username} /><button className="primary" type="submit"><MessageCircle size={16} /> Mensagem</button></form> : null}<ReportContentForm targetType="profile" targetId={profile.id} returnTo={pathname} /></>}
        </div>
      </div>

      <section className="section-block"><div className="section-row"><div><h2>Projetos</h2><p>Projetos públicos vinculados a este perfil.</p></div></div>{(projects ?? []).length ? <div className="project-grid">{(projects ?? []).map((project: any) => <article className="project-card" key={project.id}><div className="project-cover"><span className="project-initial">{project.title.slice(0, 1).toUpperCase()}</span><span className="stage">{project.stage}</span></div><div className="card-body"><div className="card-meta"><span>{project.category || "Projeto"}</span><span>{project.location || "Envista"}</span></div><h3><Link href={`${base}/projects/${project.slug}?from=explore`}>{project.title}</Link></h3><p>{project.short_description || "Projeto publicado no Envista."}</p><div className="chips compact">{(project.tags || []).slice(0, 3).map((tag: string) => <span key={tag}>{tag}</span>)}</div>{!own ? <ReportContentForm targetType="project" targetId={project.id} returnTo={pathname} /> : null}</div></article>)}</div> : <div className="panel" style={{ padding: 18 }}><p>Nenhum projeto público ainda.</p></div>}</section>

      {(githubRepos ?? []).length || (githubEvents ?? []).length ? <section className="section-block">
        <div className="section-row"><div><h2><Github size={18} style={{ verticalAlign: "-3px" }} /> GitHub</h2><p>Repositórios públicos e atividade técnica conectados ao Envista.</p></div>{own ? <Link className="secondary" href="/integrations/github">Gerenciar integração</Link> : null}</div>
        {(githubRepos ?? []).length ? <div className="project-grid">{(githubRepos ?? []).map((repo: any) => <article className="project-card" key={repo.github_repo_id}><div className="card-body"><div className="card-meta"><span>{repo.language || "Código"}</span><span>GitHub verificado</span></div><h3><a href={repo.html_url} target="_blank" rel="noreferrer">{repo.name} <ExternalLink size={13} style={{ verticalAlign: "-2px" }} /></a></h3><p>{repo.description || "Repositório conectado ao perfil Envista."}</p><div className="chips compact"><span><Star size={12} /> {repo.stargazers_count || 0}</span><span><GitFork size={12} /> {repo.forks_count || 0}</span></div></div></article>)}</div> : null}
        {(githubEvents ?? []).length ? <div className={styles.activityList} style={{ marginTop: 14 }}>{(githubEvents ?? []).map((event: any) => <a className={styles.activityItem} key={event.id} href={event.event_html_url || "#"} target={event.event_html_url ? "_blank" : undefined} rel="noreferrer"><span className={styles.activityDot} /><span><strong><GitCommitHorizontal size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />{event.title}</strong><small>{event.summary || event.repository_full_name || "Atividade sincronizada do GitHub."}</small></span><time>{new Date(event.occurred_at).toLocaleDateString("pt-BR")}</time></a>)}</div> : null}
      </section> : null}

      <section className="section-block"><div className="section-row"><div><h2>Equipes</h2><p>Equipes públicas das quais esta pessoa participa.</p></div></div>{teams.length ? <div className="team-row">{teams.map((team: any) => <article className="team-card" key={team.id}><span className="avatar">{initials(team.name)}</span><h3><Link href={`${base}/teams/${team.slug}?from=explore`}>{team.name}</Link></h3><p>{team.description || "Equipe Envista."}</p><div className="chips compact">{(team.tags || []).slice(0, 3).map((tag: string) => <span key={tag}>{tag}</span>)}</div><small>{team.city || team.category || "Envista"}</small>{!own ? <ReportContentForm targetType="team" targetId={team.id} returnTo={pathname} /> : null}</article>)}</div> : <div className="panel" style={{ padding: 18 }}><p>Nenhuma equipe pública.</p></div>}</section>

      <section className="section-block"><div className="section-row"><div><h2>Publicações</h2><p>Atualizações públicas deste perfil.</p></div></div>{(posts ?? []).length ? <div className="profile-feed">{(posts ?? []).map((post: any) => <article className="panel social-post profile-feed-post" key={post.id}><header><span className="avatar">{initials(profile.display_name)}</span><div><b>{profile.display_name}</b><small>@{profile.username} · {new Date(post.created_at).toLocaleDateString("pt-BR")}</small></div></header><p>{post.body}</p>{!own ? <ReportContentForm targetType="post" targetId={post.id} returnTo={pathname} /> : null}</article>)}</div> : <div className="panel" style={{ padding: 18 }}><p>Nenhuma publicação pública ainda.</p></div>}</section>
    </LegacySocialShell>
  );
}
