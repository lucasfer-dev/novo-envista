import Link from "next/link";
import ProductShell from "@/components/real/ProductShell";
import FirstSteps from "@/components/real/FirstSteps";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import styles from "./Dashboard.module.css";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function uniqueById(items: any[]) {
  const map = new Map<string, any>();
  for (const item of items) if (item?.id) map.set(item.id, item);
  return [...map.values()];
}

export async function ParticipantDashboardServerPage() {
  const { supabase, userId, appUser, profile } = await requireProductUser("participant");
  const [{ data: memberships }, { data: personalProjects }, { data: notifications }, { count: completedLessons }, { data: enrollments }] = await Promise.all([
    supabase.from("team_members").select("team_id,teams(id,slug,name)").eq("user_id", userId).order("joined_at", { ascending: false }).limit(8),
    supabase.from("projects").select("id,slug,title,short_description,stage,updated_at").eq("owner_user_id", userId).order("updated_at", { ascending: false }).limit(8),
    supabase.from("notifications").select("id,title,body,href,read_at,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("course_enrollments").select("course_id,courses(id,slug,title)").eq("user_id", userId).limit(4),
  ]);

  const teamIds = (memberships ?? []).map((item: any) => item.team_id);
  let teamProjects: any[] = [];
  if (teamIds.length) {
    const result = await supabase.from("projects").select("id,slug,title,short_description,stage,updated_at").in("owner_team_id", teamIds).order("updated_at", { ascending: false }).limit(8);
    teamProjects = result.data ?? [];
  }
  const projects = uniqueById([...(personalProjects ?? []), ...teamProjects]).slice(0, 6);
  const unread = (notifications ?? []).filter((item: any) => !item.read_at).length;
  const teams = (memberships ?? []).map((item: any) => Array.isArray(item.teams) ? item.teams[0] : item.teams).filter(Boolean);
  const courses = (enrollments ?? []).map((item: any) => Array.isArray(item.courses) ? item.courses[0] : item.courses).filter(Boolean);
  const profileReady = Boolean(profile.bio && (profile.public_school || profile.public_city));

  return (
    <ProductShell user={appUser} title="Início">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div><h1>Olá, {firstName(appUser.name)}.</h1><p>Veja seus projetos, equipes e atividades recentes.</p></div>
          <div className={styles.actions}><Link className={styles.primary} href="/app/projects/new">Criar projeto</Link><Link className={styles.secondary} href="/app/teams/new">Criar equipe</Link></div>
        </section>

        <FirstSteps steps={[
          { label: "Complete seu perfil", description: "Adicione uma bio e informe sua escola ou cidade.", href: "/account/profile", done: profileReady },
          { label: "Entre ou crie uma equipe", description: "Entre em uma equipe ou crie uma nova.", href: "/app/teams", done: teams.length > 0 },
          { label: "Publique seu primeiro projeto", description: "Adicione um projeto ao seu portfólio.", href: "/app/projects/new", done: projects.length > 0 },
          { label: "Comece uma trilha", description: "Escolha um curso e acompanhe seu progresso.", href: "/app/learn", done: courses.length > 0 },
        ]} />

        <section className={styles.metrics}>
          <div className={styles.metric}><strong>{projects.length}</strong><span>Projetos</span></div>
          <div className={styles.metric}><strong>{teams.length}</strong><span>Equipes</span></div>
          <div className={styles.metric}><strong>{unread}</strong><span>Notificações não lidas</span></div>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Seus projetos</h2><Link href="/app/projects">Ver todos</Link></div>
            {projects.length ? <div className={styles.stack}>{projects.map((project: any) => <Link key={project.id} className={styles.item} href={`/app/projects/${project.slug}`}><div><strong>{project.title}</strong><p>{project.short_description || "Sem descrição adicionada."}</p></div><span className={styles.pill}>{project.stage || "Em desenvolvimento"}</span></Link>)}</div> : <div className={styles.empty}>Nenhum projeto ainda.</div>}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Agora</h2><Link href="/app/notifications">Notificações</Link></div>
            {(notifications ?? []).length ? <div className={styles.stack}>{(notifications ?? []).slice(0, 5).map((item: any) => <Link key={item.id} className={styles.item} href={item.href || "/app/notifications"}><div><strong>{item.title}</strong><p>{item.body || "Nova atividade."}</p></div>{!item.read_at ? <span className={styles.pill}>Nova</span> : null}</Link>)}</div> : <div className={styles.empty}>Nenhuma novidade por enquanto.</div>}
          </section>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Equipes</h2><Link href="/app/teams">Abrir equipes</Link></div>
            {teams.length ? <div className={styles.stack}>{teams.slice(0, 5).map((team: any) => <Link key={team.id} className={styles.item} href={`/app/teams/${team.slug}`}><strong>{team.name}</strong><span className={styles.muted}>Abrir</span></Link>)}</div> : <div className={styles.empty}>Nenhuma equipe ainda.</div>}
          </section>
          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Aprendizado</h2><Link href="/app/learn">Continuar aprendendo</Link></div>
            <p className={styles.muted}>{completedLessons ?? 0} aulas concluídas.</p>
            {courses.length ? <div className={styles.stack}>{courses.map((course: any) => <Link key={course.id} className={styles.item} href={`/app/learn/${course.slug}`}><strong>{course.title}</strong><span className={styles.muted}>Continuar</span></Link>)}</div> : <div className={styles.empty}>Nenhum curso iniciado.</div>}
          </section>
        </div>
      </div>
    </ProductShell>
  );
}

async function projectIdsFromRows(rows: any[] | null, key: "target_project_id" | "project_id") {
  return [...new Set((rows ?? []).map((row: any) => row[key]).filter(Boolean))] as string[];
}

async function fetchProjectsByIds(supabase: any, ids: string[]) {
  if (!ids.length) return [];
  const { data } = await supabase.from("projects").select("id,slug,title,short_description,stage,category,updated_at").in("id", ids);
  const order = new Map(ids.map((id, index) => [id, index]));
  return (data ?? []).sort((a: any, b: any) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

export async function InvestorDashboardServerPage() {
  const { supabase, userId, appUser, profile } = await requireProductUser("investor");
  const [{ data: saves }, { data: follows }, { data: recommendations }, { data: notifications }, { count: interests }] = await Promise.all([
    supabase.from("project_saves").select("project_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("follows").select("target_project_id,created_at").eq("follower_id", userId).not("target_project_id", "is", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("projects").select("id,slug,title,short_description,stage,category,updated_at").eq("visibility", "platform").order("updated_at", { ascending: false }).limit(8),
    supabase.from("notifications").select("id,title,body,href,read_at,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("project_interests").select("id", { count: "exact", head: true }).eq("investor_id", userId).eq("status", "active"),
  ]);
  const savedIds = await projectIdsFromRows(saves, "project_id");
  const followedIds = await projectIdsFromRows(follows, "target_project_id");
  const savedProjects = await fetchProjectsByIds(supabase, savedIds.slice(0, 5));
  const unread = (notifications ?? []).filter((item: any) => !item.read_at).length;
  const profileReady = Boolean(profile.bio && profile.organization);

  return (
    <ProductShell user={appUser} title="Início">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div><h1>Olá, {firstName(appUser.name)}.</h1><p>Veja projetos, salvos e atividades recentes.</p></div>
          <div className={styles.actions}><Link className={styles.primary} href="/investor/explore">Explorar projetos</Link><Link className={styles.secondary} href="/investor/saved">Projetos salvos</Link></div>
        </section>

        <FirstSteps steps={[
          { label: "Complete seu perfil", description: "Adicione uma bio e sua organização.", href: "/account/profile", done: profileReady },
          { label: "Salve um projeto", description: "Guarde projetos para revisar depois.", href: "/investor/explore", done: savedIds.length > 0 },
          { label: "Acompanhe um projeto", description: "Siga projetos para acompanhar atualizações.", href: "/investor/explore", done: followedIds.length > 0 },
          { label: "Demonstre interesse", description: "Envie interesse ao responsável pelo projeto.", href: "/investor/explore", done: (interests ?? 0) > 0 },
        ]} />

        <section className={styles.metrics}>
          <div className={styles.metric}><strong>{savedIds.length}</strong><span>Projetos salvos</span></div>
          <div className={styles.metric}><strong>{followedIds.length}</strong><span>Projetos acompanhados</span></div>
          <div className={styles.metric}><strong>{unread}</strong><span>Notificações não lidas</span></div>
        </section>
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Projetos para descobrir</h2><Link href="/investor/explore">Explorar</Link></div>
            {(recommendations ?? []).length ? <div className={styles.stack}>{(recommendations ?? []).slice(0, 6).map((project: any) => <Link key={project.id} className={styles.item} href={`/investor/projects/${project.slug}`}><div><strong>{project.title}</strong><p>{project.short_description || project.category || "Sem descrição adicionada."}</p></div><span className={styles.pill}>{project.stage || "Projeto"}</span></Link>)}</div> : <div className={styles.empty}>Nenhum projeto público disponível agora.</div>}
          </section>
          <section className={styles.card}>
            <div className={styles.sectionHead}><h2>Atualizações</h2><Link href="/investor/notifications">Notificações</Link></div>
            {(notifications ?? []).length ? <div className={styles.stack}>{(notifications ?? []).slice(0, 5).map((item: any) => <Link key={item.id} className={styles.item} href={item.href || "/investor/notifications"}><div><strong>{item.title}</strong><p>{item.body || "Nova atividade."}</p></div>{!item.read_at ? <span className={styles.pill}>Nova</span> : null}</Link>)}</div> : <div className={styles.empty}>Nenhuma atualização por enquanto.</div>}
          </section>
        </div>
        <section className={styles.card}>
          <div className={styles.sectionHead}><h2>Salvos recentemente</h2><Link href="/investor/saved">Ver salvos</Link></div>
          {savedProjects.length ? <div className={styles.stack}>{savedProjects.map((project: any) => <Link key={project.id} className={styles.item} href={`/investor/projects/${project.slug}`}><div><strong>{project.title}</strong><p>{project.short_description || "Sem descrição adicionada."}</p></div><span className={styles.muted}>Abrir</span></Link>)}</div> : <div className={styles.empty}>Nenhum projeto salvo ainda.</div>}
        </section>
      </div>
    </ProductShell>
  );
}

export async function InvestorProjectCollectionServerPage({ mode }: { mode: "saved" | "following" }) {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const rows = mode === "saved"
    ? await supabase.from("project_saves").select("project_id,created_at").eq("user_id", userId).order("created_at", { ascending: false })
    : await supabase.from("follows").select("target_project_id,created_at").eq("follower_id", userId).not("target_project_id", "is", null).order("created_at", { ascending: false });
  const ids = mode === "saved" ? await projectIdsFromRows(rows.data, "project_id") : await projectIdsFromRows(rows.data, "target_project_id");
  const projects = await fetchProjectsByIds(supabase, ids);
  const title = mode === "saved" ? "Projetos salvos" : "Projetos acompanhados";
  const empty = mode === "saved" ? "Você ainda não salvou nenhum projeto." : "Você ainda não está acompanhando nenhum projeto.";

  return <ProductShell user={appUser} title={title}><div className={styles.page}><section className={styles.hero}><div><h1>{title}</h1><p>{mode === "saved" ? "Projetos que você guardou para revisar depois." : "Projetos que você segue."}</p></div><Link className={styles.primary} href="/investor/explore">Explorar</Link></section><section className={styles.card}>{projects.length ? <div className={styles.stack}>{projects.map((project: any) => <Link key={project.id} className={styles.item} href={`/investor/projects/${project.slug}`}><div><strong>{project.title}</strong><p>{project.short_description || project.category || "Sem descrição adicionada."}</p></div><span className={styles.pill}>{project.stage || "Projeto"}</span></Link>)}</div> : <div className={styles.empty}>{empty}</div>}</section></div></ProductShell>;
}
