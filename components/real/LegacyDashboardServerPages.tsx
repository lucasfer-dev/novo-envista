import Link from "next/link";
import { Bookmark, Eye, FolderKanban, GraduationCap, MessageCircle, Trophy, Users } from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import FollowEntityButton from "@/components/real/FollowEntityButton";
import { toggleProjectSaveAction } from "@/lib/projects/investor-actions";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProjectCardRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  stage: string;
  category: string;
  location: string;
  tags: string[];
};

type TeamCardRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  city: string;
  tags: string[];
};

function root(role: ProductRole) {
  return role === "investor" ? "/investor" : "/app";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function ProjectCard({ project, role, action }: { project: ProjectCardRow; role: ProductRole; action?: React.ReactNode }) {
  const base = root(role);
  return (
    <article className="project-card">
      <div className="project-cover">
        <span className="project-initial">{project.title.slice(0, 1).toUpperCase()}</span>
        <span className="stage">{project.stage}</span>
      </div>
      <div className="card-body">
        <div className="card-meta"><span>{project.category || "Projeto"}</span><span>{project.location || "Envista"}</span></div>
        <h3><Link href={`${base}/projects/${encodeURIComponent(project.slug)}?from=explore`}>{project.title}</Link></h3>
        <p>{project.short_description || "Projeto publicado no Envista."}</p>
        <div className="chips compact">{(project.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
        {action ? <div className="actions" style={{ marginTop: 12 }}>{action}</div> : null}
      </div>
    </article>
  );
}

function TeamCard({ team, role }: { team: TeamCardRow; role: ProductRole }) {
  const base = root(role);
  return (
    <article className="team-card">
      <span className="avatar">{team.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
      <h3><Link href={`${base}/teams/${encodeURIComponent(team.slug)}?from=explore`}>{team.name}</Link></h3>
      <p>{team.description || "Equipe do ecossistema Envista."}</p>
      <div className="chips compact">{(team.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <small>{team.city || team.category || "Envista"}</small>
    </article>
  );
}

function FirstRunChecklist({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ done: boolean; label: string; description: string; href: string; Icon: typeof FolderKanban }>;
}) {
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  return (
    <section className="panel activity section-block" aria-labelledby="first-run-title">
      <div className="panel-title"><span id="first-run-title">{title}</span><small>{done}/{steps.length} concluídos</small></div>
      {steps.map(({ done: complete, label, description, href, Icon }) => (
        <Link className="activity-item" href={href} key={label}>
          <i aria-hidden="true">{complete ? "✓" : <Icon />}</i>
          <div><b>{label}</b><small>{complete ? "Concluído" : description}</small></div>
        </Link>
      ))}
    </section>
  );
}

export async function RealHomeServerPage({ expectedRole, pathname }: { expectedRole: ProductRole; pathname: string }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const base = root(expectedRole);

  if (expectedRole === "participant") {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id,role_label,teams(id,slug,name,description,category,city,tags)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });
    const teamIds = (memberships ?? []).map((item: any) => item.team_id);

    const [personalResult, teamProjectsResult, enrollmentResult, notificationsResult] = await Promise.all([
      supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").eq("owner_user_id", userId).order("updated_at", { ascending: false }).limit(6),
      teamIds.length
        ? supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").in("owner_team_id", teamIds).order("updated_at", { ascending: false }).limit(8)
        : Promise.resolve({ data: [] as ProjectCardRow[] }),
      supabase.from("course_enrollments").select("course_id,enrolled_at,courses(id,slug,title,description)").eq("user_id", userId).order("enrolled_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("notifications").select("id,title,body,href,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(4),
    ]);

    const projects = new Map<string, ProjectCardRow>();
    for (const project of [...(personalResult.data ?? []), ...(teamProjectsResult.data ?? [])]) projects.set(project.id, project as ProjectCardRow);
    const teams = (memberships ?? []).map((membership: any) => one<TeamCardRow>(membership.teams)).filter(Boolean) as TeamCardRow[];
    const enrollment = enrollmentResult.data;
    const course = one<any>(enrollment?.courses);
    let courseProgress = 0;
    if (course?.id) {
      const [{ data: modules }, { data: progress }] = await Promise.all([
        supabase.from("course_modules").select("id,course_lessons(id)").eq("course_id", course.id),
        supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId),
      ]);
      const lessonIds = (modules ?? []).flatMap((module: any) => (module.course_lessons ?? []).map((lesson: any) => lesson.id));
      const done = new Set((progress ?? []).map((item: any) => item.lesson_id));
      courseProgress = lessonIds.length ? Math.round(lessonIds.filter((id: string) => done.has(id)).length / lessonIds.length * 100) : 0;
    }

    const firstSteps = [
      { done: projects.size > 0, label: "Crie seu primeiro projeto", description: "Registre algo que você está construindo.", href: "/app/projects/new", Icon: FolderKanban },
      { done: teams.length > 0, label: "Entre ou crie uma equipe", description: "Organize pessoas em torno de um projeto.", href: "/app/teams", Icon: Users },
      { done: Boolean(course), label: "Comece um curso", description: "Escolha uma trilha e salve seu progresso.", href: "/app/learn", Icon: GraduationCap },
    ];

    return (
      <LegacySocialShell user={appUser} role="participant" pathname={pathname}>
        <div className="page-head"><div><h1>Olá, {appUser.name.split(" ")[0]}.</h1><p>Continue construindo a partir do que está salvo na sua conta.</p></div></div>
        <FirstRunChecklist title="Primeiros passos" steps={firstSteps} />
        <div className="home-grid">
          <section className="panel continue-card">
            <div className="panel-title"><span>Continuar aprendendo</span><GraduationCap size={18} /></div>
            {course ? <div><h2>{course.title}</h2><p>{course.description || "Curso em andamento."}</p><div className="progress"><i style={{ width: `${courseProgress}%` }} /></div><small>{courseProgress}% concluído</small><div className="actions" style={{ marginTop: 14 }}><Link className="primary" href={`/app/learn/${course.slug}`}>Continuar curso</Link></div></div> : <div><h2>Comece uma trilha</h2><p>Seus cursos e progresso ficam vinculados à sua conta.</p><Link className="primary" href="/app/learn">Ver cursos</Link></div>}
          </section>
          <section className="panel opportunity">
            <div className="panel-title"><span>Competições</span><Trophy size={18} /></div>
            <h2>Encontre a próxima oportunidade</h2><p>O catálogo é verificado em fontes oficiais e cruza oportunidades com seus projetos e equipes.</p><Link className="secondary" href="/app/competitions">Ver competições</Link>
          </section>
        </div>

        <section className="section-block">
          <div className="section-row"><div><h2>Meus projetos</h2><p>Projetos pessoais e das suas equipes.</p></div><Link className="text-btn" href="/app/projects">Ver todos</Link></div>
          {[...projects.values()].length ? <div className="project-grid">{[...projects.values()].slice(0, 6).map((project) => <ProjectCard key={project.id} project={project} role="participant" />)}</div> : <div className="empty"><div><FolderKanban /></div><h3>Seu primeiro projeto começa aqui</h3><p>Crie um projeto para organizar a ideia, montar uma equipe e compartilhar evolução.</p><Link className="secondary" href="/app/projects/new">Criar projeto</Link></div>}
        </section>

        <section className="section-block">
          <div className="section-row"><div><h2>Minhas equipes</h2><p>Equipes das quais você realmente faz parte.</p></div><Link className="text-btn" href="/app/teams">Gerenciar equipes</Link></div>
          {teams.length ? <div className="team-row">{teams.slice(0, 6).map((team) => <TeamCard key={team.id} team={team} role="participant" />)}</div> : <div className="empty"><div><Users /></div><h3>Você ainda não está em uma equipe</h3><p>Crie uma equipe para colaborar ou explore o ecossistema para conhecer outros projetos.</p><div className="actions"><Link className="secondary" href="/app/teams/new">Criar equipe</Link><Link className="secondary" href="/app/explore">Explorar</Link></div></div>}
        </section>

        <section className="panel activity">
          <div className="panel-title"><span>Atividade recente</span></div>
          {(notificationsResult.data ?? []).length ? (notificationsResult.data ?? []).map((notification: any) => <Link className="activity-item" href={notification.href || "/app/notifications"} key={notification.id}><i><MessageCircle /></i><div><b>{notification.title}</b><small>{notification.body || new Date(notification.created_at).toLocaleString("pt-BR")}</small></div></Link>) : <div><p>Nenhuma notificação recente.</p><Link className="secondary" href="/app/explore">Explorar o Envista</Link></div>}
        </section>
      </LegacySocialShell>
    );
  }

  const [projectsResult, teamsResult, savesResult, followsResult, interestsResult] = await Promise.all([
    supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").eq("visibility", "platform").order("updated_at", { ascending: false }).limit(9),
    supabase.from("teams").select("id,slug,name,description,category,city,tags").eq("visibility", "platform").order("updated_at", { ascending: false }).limit(6),
    supabase.from("project_saves").select("project_id").eq("user_id", userId),
    supabase.from("follows").select("id").eq("follower_id", userId),
    supabase.from("project_interests").select("id").eq("investor_id", userId).eq("status", "active"),
  ]);
  const savedIds = new Set((savesResult.data ?? []).map((item: any) => item.project_id));
  const firstSteps = [
    { done: savedIds.size > 0, label: "Salve um projeto", description: "Monte uma lista privada para revisar depois.", href: "/investor/explore", Icon: Bookmark },
    { done: (followsResult.data?.length ?? 0) > 0, label: "Acompanhe alguém", description: "Siga projetos, equipes ou pessoas relevantes.", href: "/investor/explore", Icon: Eye },
    { done: (interestsResult.data?.length ?? 0) > 0, label: "Demonstre interesse", description: "Abra um projeto e registre interesse quando fizer sentido.", href: "/investor/explore", Icon: FolderKanban },
  ];

  return (
    <LegacySocialShell user={appUser} role="investor" pathname={pathname}>
      <div className="page-head"><div><h1>Descubra projetos com potencial.</h1><p>Projetos e equipes reais publicados no ecossistema.</p></div></div>
      <div className="admin-stats">
        <div className="panel"><b>{savesResult.data?.length ?? 0}</b><span>projetos salvos</span></div>
        <div className="panel"><b>{followsResult.data?.length ?? 0}</b><span>acompanhamentos</span></div>
        <div className="panel"><b>{interestsResult.data?.length ?? 0}</b><span>interesses enviados</span></div>
      </div>
      <FirstRunChecklist title="Comece por aqui" steps={firstSteps} />
      <section className="section-block">
        <div className="section-row"><div><h2>Projetos recentes</h2><p>Conteúdo público salvo no Supabase.</p></div><Link className="text-btn" href="/investor/explore">Explorar tudo</Link></div>
        {(projectsResult.data ?? []).length ? <div className="project-grid">{(projectsResult.data ?? []).map((project: any) => <ProjectCard key={project.id} project={project} role="investor" action={<><form action={toggleProjectSaveAction}><input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="return_to" value="/investor" /><button className="secondary" type="submit"><Bookmark size={15} /> {savedIds.has(project.id) ? "Salvo" : "Salvar"}</button></form><FollowEntityButton targetType="project" targetId={project.id} returnTo="/investor" /></>} />)}</div> : <div className="empty"><div><FolderKanban /></div><h3>Nenhum projeto público ainda</h3><p>Quando projetos forem publicados, eles aparecerão aqui.</p><Link className="secondary" href="/investor/explore">Abrir descoberta</Link></div>}
      </section>
      <section className="section-block">
        <div className="section-row"><div><h2>Equipes em destaque</h2><p>Equipes públicas reais.</p></div></div>
        {(teamsResult.data ?? []).length ? <div className="team-row">{(teamsResult.data ?? []).map((team: any) => <TeamCard key={team.id} team={team} role="investor" />)}</div> : <div className="empty"><div><Users /></div><h3>Nenhuma equipe pública ainda</h3><p>Use a descoberta para acompanhar novos perfis e projetos enquanto o ecossistema cresce.</p><Link className="secondary" href="/investor/explore">Explorar</Link></div>}
      </section>
    </LegacySocialShell>
  );
}

export async function InvestorSavedServerPage({ pathname, searchParams }: { pathname: string; searchParams: SearchParams }) {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const query = await searchParams;
  const { data: saves } = await supabase.from("project_saves").select("project_id,created_at").eq("user_id", userId).order("created_at", { ascending: false });
  const ids = (saves ?? []).map((item: any) => item.project_id);
  const { data: projects } = ids.length
    ? await supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").in("id", ids).eq("visibility", "platform")
    : { data: [] as ProjectCardRow[] };
  const order = new Map(ids.map((id: string, index: number) => [id, index]));
  const sorted = [...(projects ?? [])].sort((a: any, b: any) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  return (
    <LegacySocialShell user={appUser} role="investor" pathname={pathname}>
      <div className="page-head"><div><h1>Projetos salvos</h1><p>Sua lista privada de projetos para revisar depois.</p></div></div>
      {first(query.error) === "save" ? <div className="form-error">Não foi possível atualizar o projeto salvo.</div> : null}
      {sorted.length ? <div className="project-grid section-block">{sorted.map((project: any) => <ProjectCard key={project.id} project={project} role="investor" action={<form action={toggleProjectSaveAction}><input type="hidden" name="project_id" value={project.id} /><input type="hidden" name="return_to" value="/investor/saved" /><button className="secondary" type="submit">Remover dos salvos</button></form>} />)}</div> : <div className="empty"><div><Bookmark /></div><h3>Nenhum projeto salvo</h3><p>Salve projetos durante a descoberta para encontrá-los aqui.</p><Link className="secondary" href="/investor/explore">Explorar projetos</Link></div>}
    </LegacySocialShell>
  );
}

export async function FollowingServerPage({ expectedRole, pathname }: { expectedRole: ProductRole; pathname: string }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const { data: follows } = await supabase.from("follows").select("target_profile_id,target_team_id,target_project_id,created_at").eq("follower_id", userId).order("created_at", { ascending: false });
  const projectIds = (follows ?? []).map((item: any) => item.target_project_id).filter(Boolean);
  const teamIds = (follows ?? []).map((item: any) => item.target_team_id).filter(Boolean);
  const profileIds = (follows ?? []).map((item: any) => item.target_profile_id).filter(Boolean);
  const [projectsResult, teamsResult, profilesResult] = await Promise.all([
    projectIds.length ? supabase.from("projects").select("id,slug,title,short_description,stage,category,location,tags").in("id", projectIds).eq("visibility", "platform") : Promise.resolve({ data: [] }),
    teamIds.length ? supabase.from("teams").select("id,slug,name,description,category,city,tags").in("id", teamIds).eq("visibility", "platform") : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from("profiles").select("id,username,display_name,bio,role,organization,public_city").in("id", profileIds).eq("profile_visibility", "platform") : Promise.resolve({ data: [] }),
  ]);
  const base = root(expectedRole);
  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head"><div><h1>Seguindo</h1><p>Pessoas, equipes e projetos que você acompanha de verdade no Envista.</p></div></div>
      {(projectsResult.data ?? []).length ? <section className="section-block"><h2>Projetos</h2><div className="project-grid">{(projectsResult.data ?? []).map((project: any) => <ProjectCard key={project.id} project={project} role={expectedRole} action={<FollowEntityButton targetType="project" targetId={project.id} returnTo={`${base}/following`} />} />)}</div></section> : null}
      {(teamsResult.data ?? []).length ? <section className="section-block"><h2>Equipes</h2><div className="team-row">{(teamsResult.data ?? []).map((team: any) => <TeamCard key={team.id} team={team} role={expectedRole} />)}</div></section> : null}
      {(profilesResult.data ?? []).length ? <section className="section-block"><h2>Pessoas</h2><div className="team-row">{(profilesResult.data ?? []).map((profile: any) => <article className="team-card" key={profile.id}><span className="avatar">{profile.display_name.split(" ").slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()}</span><h3><Link href={`${base}/${profile.role === "investor" ? "investors" : "participants"}/${profile.username}`}>{profile.display_name}</Link></h3><p>{profile.bio || profile.organization || "Perfil Envista"}</p><small>@{profile.username}</small><div className="actions" style={{ marginTop: 10 }}><FollowEntityButton targetType="profile" targetId={profile.id} returnTo={`${base}/following`} /></div></article>)}</div></section> : null}
      {!(projectsResult.data ?? []).length && !(teamsResult.data ?? []).length && !(profilesResult.data ?? []).length ? <div className="empty"><div><Eye /></div><h3>Você ainda não segue ninguém</h3><p>Use o Social ou o Explorar para acompanhar projetos, equipes e pessoas.</p><Link className="secondary" href={`${base}/explore`}>Explorar</Link></div> : null}
    </LegacySocialShell>
  );
}
