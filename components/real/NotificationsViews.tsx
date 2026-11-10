import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  MessageCircle,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  openNotificationAction,
} from "@/lib/notifications/actions";
import styles from "./Notifications.module.css";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

type NotificationFilter = "all" | "unread";

type Props = {
  notifications: Notification[];
  status?: string;
  unreadTotal: number;
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  filter: NotificationFilter;
};

function pageHref(basePath: string, page: number, filter: NotificationFilter) {
  const params = new URLSearchParams();
  if (filter === "unread") params.set("filter", "unread");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function notificationIcon(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized.includes("message") || normalized.includes("comment") || normalized.includes("reply")) return MessageCircle;
  if (normalized.includes("team") || normalized.includes("invite") || normalized.includes("member")) return Users;
  if (normalized.includes("competition") || normalized.includes("challenge")) return Trophy;
  if (normalized.includes("project") || normalized.includes("interest")) return FolderKanban;
  return Bell;
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EmptyNotifications({ basePath, filter }: { basePath: string; filter: NotificationFilter }) {
  const onlyUnread = filter === "unread";
  const exploreHref = basePath.startsWith("/investor/") ? "/investor/explore" : "/explore";
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon} aria-hidden="true">
        {onlyUnread ? <CheckCheck size={29} strokeWidth={1.55} /> : <Bell size={29} strokeWidth={1.55} />}
      </span>
      <h2>{onlyUnread ? "Tudo em dia!" : "Nenhuma notificação por enquanto"}</h2>
      <p>
        {onlyUnread
          ? "Você não tem notificações não lidas. As anteriores continuam disponíveis na aba Todas."
          : "Quando houver novidades sobre seus projetos, equipes e conexões, elas aparecerão aqui."}
      </p>
      <Link className={styles.emptyLink} href={onlyUnread ? basePath : exploreHref}>
        {onlyUnread ? "Ver todas as notificações" : "Explorar a comunidade"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function NotificationsView({
  notifications,
  status,
  unreadTotal,
  page,
  pageCount,
  total,
  basePath,
  filter,
}: Props) {
  const returnTo = pageHref(basePath, page, filter);
  const allSelected = filter === "all";

  return (
    <div className={styles.page} data-envista-notifications-clean>
      <header className={styles.head}>
        <div className={styles.headingText}>
          <h1>Notificações</h1>
          <p className={styles.muted}>
            {unreadTotal > 0
              ? `${unreadTotal} não lida${unreadTotal === 1 ? "" : "s"}`
              : "Acompanhe as novidades da sua rede."}
          </p>
        </div>
        {unreadTotal > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button className={styles.markAll} type="submit">
              <CheckCheck size={17} aria-hidden="true" />
              Marcar todas como lidas
            </button>
          </form>
        ) : null}
      </header>

      <nav className={styles.tabs} aria-label="Filtrar notificações">
        <Link href={basePath} aria-current={allSelected ? "page" : undefined} className={styles.tab}>
          Todas
        </Link>
        <Link href={pageHref(basePath, 1, "unread")} aria-current={!allSelected ? "page" : undefined} className={styles.tab}>
          Não lidas
          {unreadTotal > 0 ? <span className={styles.unreadCount}>{unreadTotal}</span> : null}
        </Link>
      </nav>

      {status === "read" ? (
        <p className={styles.notice} role="status">
          <Check size={17} aria-hidden="true" />
          Todas as notificações foram marcadas como lidas.
        </p>
      ) : null}

      <section className={styles.feed} aria-label={allSelected ? "Todas as notificações" : "Notificações não lidas"}>
        {notifications.length === 0 ? (
          <EmptyNotifications basePath={basePath} filter={filter} />
        ) : notifications.map(item => {
          const Icon = notificationIcon(item.kind);
          const unread = !item.read_at;
          return (
            <article className={styles.item} data-unread={unread} key={item.id}>
              <span className={styles.itemIcon} aria-hidden="true"><Icon size={20} strokeWidth={1.75} /></span>
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <h2>{item.title}</h2>
                  {unread ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
                  {unread ? <span className={styles.srOnly}>Não lida</span> : null}
                </div>
                {item.body ? <p>{item.body}</p> : null}
                <time dateTime={item.created_at}>{timeLabel(item.created_at)}</time>
                <div className={styles.actions}>
                  <form action={openNotificationAction}>
                    <input type="hidden" name="notification_id" value={item.id} />
                    <input type="hidden" name="href" value={item.href} />
                    <button className={styles.primary} type="submit">
                      {item.kind === "message" ? "Ver mensagem" : "Abrir"}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </form>
                  {unread ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={item.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button className={styles.secondary} type="submit">
                        <Check size={15} aria-hidden="true" />
                        Marcar como lida
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteNotificationAction}>
                    <input type="hidden" name="notification_id" value={item.id} />
                    <button className={styles.danger} type="submit" aria-label={`Excluir notificação: ${item.title}`} title="Excluir notificação">
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {pageCount > 1 ? (
        <nav className={styles.pagination} aria-label="Paginação de notificações">
          {page > 1 ? (
            <Link href={pageHref(basePath, page - 1, filter)}>
              <ChevronLeft size={16} aria-hidden="true" /> Anterior
            </Link>
          ) : <span />}
          <span>Página {page} de {pageCount}</span>
          {page < pageCount ? (
            <Link href={pageHref(basePath, page + 1, filter)}>
              Próxima <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : <span />}
        </nav>
      ) : null}
      <span className={styles.srOnly} aria-live="polite">
        {total} {total === 1 ? "notificação" : "notificações"} {filter === "unread" ? "não lidas" : "no total"}
      </span>
    </div>
  );
}
