import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { createTeamTaskAction, deleteTeamTaskAction, moveTeamTaskAction } from "@/lib/workspace/actions";
import styles from "@/components/product/ProfessionalSuite.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function TeamWorkspaceServerPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const params = await searchParams;
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,role_label,teams(id,slug,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  const teams = (memberships ?? []).map((membership: any) => {
    const team = Array.isArray(membership.teams) ? membership.teams[0] : membership.teams;
    return team ? { ...team, role_label: membership.role_label } : null;
  }).filter(Boolean) as any[];

  const selectedId = first(params.team) || teams[0]?.id || "";
  const selected = teams.find((team) => team.id === selectedId) ?? teams[0];
  const returnTo = selected ? `/app/workspace?team=${encodeURIComponent(selected.id)}` : "/app/workspace";
  const { data: tasks } = selected
    ? await supabase.from("team_tasks").select("id,title,description,status,due_date,created_at,updated_at").eq("team_id", selected.id).order("position", { ascending: true }).order("created_at", { ascending: false })
    : { data: [] as any[] };

  const groups = {
    todo: (tasks ?? []).filter((task: any) => task.status === "todo"),
    doing: (tasks ?? []).filter((task: any) => task.status === "doing"),
    done: (tasks ?? []).filter((task: any) => task.status === "done"),
  };

  const column = (status: "todo" | "doing" | "done", label: string) => (
    <section className={styles.column}>
      <div className={styles.columnTitle}><span>{label}</span><span>{groups[status].length}</span></div>
      {groups[status].map((task: any) => (
        <article className={styles.task} key={task.id}>
          <h4>{task.title}</h4>
          {task.description ? <p>{task.description}</p> : null}
          <div className={styles.taskFooter}>
            <small>{task.due_date ? `Prazo ${new Date(`${task.due_date}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo"}</small>
            <form action={status === "todo" ? moveTeamTaskAction : status === "doing" ? moveTeamTaskAction : deleteTeamTaskAction}>
              <input type="hidden" name="task_id" value={task.id} />
              <input type="hidden" name="return_to" value={returnTo} />
              {status === "todo" ? <><input type="hidden" name="status" value="doing" /><button type="submit">Iniciar</button></> : null}
              {status === "doing" ? <><input type="hidden" name="status" value="done" /><button type="submit">Concluir</button></> : null}
              {status === "done" ? <button type="submit">Arquivar</button> : null}
            </form>
          </div>
        </article>
      ))}
    </section>
  );

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/app/workspace">
      <div className="page-head"><div><h1>Workspace da equipe</h1><p>Tarefas, andamento e foco da equipe sem precisar sair do Envista.</p></div>{selected ? <Link className="secondary" href={`/app/teams/${encodeURIComponent(selected.slug)}`}>Abrir equipe</Link> : null}</div>
      {!teams.length ? <div className="empty"><h3>Você ainda não faz parte de uma equipe</h3><p>Crie ou entre em uma equipe para usar o workspace.</p><Link className="primary" href="/app/teams">Ver equipes</Link></div> : <>
        <div className={styles.workspaceHead}>
          <div><h2 style={{ marginBottom: 6 }}>{selected?.name}</h2><p style={{ margin: 0, color: "#8294a8" }}>Kanban simples para organizar o que precisa acontecer agora.</p></div>
          <div className={styles.teamSelect}>{teams.map((team) => <Link key={team.id} href={`/app/workspace?team=${encodeURIComponent(team.id)}`} data-active={team.id === selected?.id}>{team.name}</Link>)}</div>
        </div>
        {params.error ? <div className="form-error">Não foi possível salvar a tarefa. Confira os dados e tente novamente.</div> : null}
        <form action={createTeamTaskAction} className={styles.newTask}>
          <input type="hidden" name="team_id" value={selected.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <input name="title" placeholder="Nova tarefa" maxLength={140} required />
          <input name="description" placeholder="Descrição curta (opcional)" maxLength={700} />
          <button type="submit">Adicionar</button>
        </form>
        <div className={styles.kanban}>{column("todo", "A fazer")}{column("doing", "Fazendo")}{column("done", "Concluído")}</div>
      </>}
    </LegacySocialShell>
  );
}
