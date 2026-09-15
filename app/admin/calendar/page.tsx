import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { createCalendarEventAdminAction, deleteCalendarEventAdminAction, toggleCalendarEventAdminAction } from "@/lib/admin/calendar-actions";

function fmt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { supabase, profile } = await requireAdminUser();
  const { data: events, error } = await supabase
    .from("platform_calendar_events")
    .select("id,title,description,kind,audience,starts_at,ends_at,location,href,is_published,created_at")
    .order("starts_at", { ascending: true })
    .limit(200);

  return <AdminShell profile={profile} title="Calendário e avisos">
    <div className={styles.head}><div><h1>Calendário e avisos</h1><p className={styles.muted}>Publique eventos, prazos e comunicados que aparecem no calendário e entram no resumo semanal dos usuários.</p></div></div>
    {query.status ? <div className={styles.notice}>Calendário atualizado.</div> : null}
    {query.error || error ? <div className={styles.error}>Não foi possível concluir a operação no calendário.</div> : null}

    <section className={styles.request}>
      <h2>Novo item</h2>
      <form className={styles.form} action={createCalendarEventAdminAction}>
        <label>Título<input name="title" minLength={2} maxLength={160} required placeholder="Ex.: Inscrições da OBR encerram nesta semana" /></label>
        <label>Descrição<textarea name="description" maxLength={3000} rows={4} placeholder="O que o usuário precisa saber?" /></label>
        <div className={styles.actions}>
          <label>Tipo<select name="kind" defaultValue="event"><option value="event">Evento</option><option value="announcement">Aviso</option><option value="competition">Competição</option><option value="deadline">Prazo</option></select></label>
          <label>Audiência<select name="audience" defaultValue="all"><option value="all">Todos</option><option value="participant">Participantes</option><option value="investor">Investidores</option></select></label>
        </div>
        <div className={styles.actions}>
          <label>Início<input type="datetime-local" name="starts_at" required /></label>
          <label>Fim <span className={styles.muted}>(opcional)</span><input type="datetime-local" name="ends_at" /></label>
        </div>
        <div className={styles.actions}>
          <label>Local <span className={styles.muted}>(opcional)</span><input name="location" maxLength={180} placeholder="Online, Rio de Janeiro, São Paulo..." /></label>
          <label>Link interno<input name="href" maxLength={500} defaultValue="/calendar" placeholder="/competitions" /></label>
        </div>
        <label><input type="checkbox" name="is_published" /> Publicar imediatamente</label>
        <button className={styles.primary}>Criar item</button>
      </form>
    </section>

    <div className={styles.stack}>
      {(events ?? []).length === 0 ? <div className={styles.empty}>Nenhum evento cadastrado ainda.</div> : (events ?? []).map((event: any) => <article className={styles.request} key={event.id}>
        <div className={styles.actions}><span className={styles.pill}>{event.kind}</span><span className={styles.pill}>{event.audience}</span><span className={styles.pill}>{event.is_published ? "Publicado" : "Rascunho"}</span></div>
        <h3>{event.title}</h3>
        <p className={styles.muted}>{fmt(event.starts_at)}{event.ends_at ? ` → ${fmt(event.ends_at)}` : ""}{event.location ? ` · ${event.location}` : ""}</p>
        {event.description ? <p>{event.description}</p> : null}
        <p className={styles.muted}>Destino: {event.href}</p>
        <div className={styles.actions}>
          <form action={toggleCalendarEventAdminAction}><input type="hidden" name="event_id" value={event.id} /><input type="hidden" name="publish" value={event.is_published ? "false" : "true"} /><button className={styles.primary}>{event.is_published ? "Despublicar" : "Publicar"}</button></form>
          <form action={deleteCalendarEventAdminAction}><input type="hidden" name="event_id" value={event.id} /><button>Excluir</button></form>
        </div>
      </article>)}
    </div>
  </AdminShell>;
}
