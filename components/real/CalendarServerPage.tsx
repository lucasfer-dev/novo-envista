import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import styles from "./Calendar.module.css";

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  kind: "event" | "announcement" | "competition" | "deadline";
  starts_at: string;
  ends_at: string | null;
  location: string;
  href: string;
};

const kindLabels: Record<CalendarEvent["kind"], string> = {
  event: "Evento",
  announcement: "Aviso",
  competition: "Competição",
  deadline: "Prazo",
};

function mondayFor(date: Date) {
  const value = new Date(date);
  const day = value.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + diff);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function weekKey(value: string) {
  return mondayFor(new Date(value)).toISOString().slice(0, 10);
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function weekLabel(key: string, currentKey: string, nextKey: string) {
  if (key === currentKey) return "Esta semana";
  if (key === nextKey) return "Próxima semana";
  const date = new Date(`${key}T12:00:00Z`);
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });
  return `${fmt.format(date)} — ${fmt.format(end)}`;
}

export async function CalendarServerPage({ expectedRole }: { expectedRole: ProductRole }) {
  const { appUser, supabase } = await requireProductUser(expectedRole);
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + 120);

  const { data } = await supabase
    .from("platform_calendar_events")
    .select("id,title,description,kind,starts_at,ends_at,location,href")
    .gte("starts_at", new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at", { ascending: true });

  const events = (data || []) as CalendarEvent[];
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = weekKey(event.starts_at);
    grouped.set(key, [...(grouped.get(key) || []), event]);
  }

  const currentMonday = mondayFor(now);
  const nextMonday = new Date(currentMonday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  const currentKey = currentMonday.toISOString().slice(0, 10);
  const nextKey = nextMonday.toISOString().slice(0, 10);
  const pathname = expectedRole === "investor" ? "/investor/calendar" : "/calendar";

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <h1>Calendário</h1>
            <p>Acompanhe avisos, eventos, competições e prazos importantes. O Envista também envia um resumo semanal dos compromissos que estão chegando.</p>
          </div>
        </section>

        <div className={styles.weekNotice}>
          <strong>Resumo semanal ativo.</strong> Eventos das próximas semanas podem aparecer nas suas notificações às segundas-feiras. Você pode ajustar isso nas configurações de notificações.
        </div>

        {events.length ? (
          <div className={styles.groups}>
            {Array.from(grouped.entries()).map(([key, weekEvents]) => (
              <section className={styles.group} key={key}>
                <div className={styles.groupHeader}>
                  <h2>{weekLabel(key, currentKey, nextKey)}</h2>
                  <span className={styles.count}>{weekEvents.length} {weekEvents.length === 1 ? "item" : "itens"}</span>
                </div>
                <div className={styles.grid}>
                  {weekEvents.map((event) => (
                    <article className={styles.card} key={event.id}>
                      <div className={styles.cardTop}>
                        <span className={styles.badge}>{kindLabels[event.kind] || "Evento"}</span>
                        <span className={styles.date}>{dateTime(event.starts_at)}</span>
                      </div>
                      <h3>{event.title}</h3>
                      {event.description ? <p>{event.description}</p> : null}
                      <div className={styles.meta}>
                        {event.location ? <span>📍 {event.location}</span> : null}
                        {event.ends_at ? <span>Até {dateTime(event.ends_at)}</span> : null}
                      </div>
                      {event.href && event.href !== "/calendar" && event.href !== "/investor/calendar" ? <Link className={styles.link} href={event.href} prefetch={false}>Ver detalhes →</Link> : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><strong>Nenhum evento próximo por enquanto.</strong>Novos avisos e oportunidades aparecerão aqui assim que forem publicados.</div>
        )}
      </div>
    </LegacySocialShell>
  );
}
