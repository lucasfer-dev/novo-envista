"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Search, SquarePen, X } from "lucide-react";
import { startConversationAction } from "@/lib/messages/actions";
import styles from "./Messages.module.css";

export type InboxThread = {
  id: string;
  targetId: string;
  targetName: string;
  targetUsername: string | null;
  lastBody: string | null;
  lastAt: string | null;
  unreadCount: number;
};
export type InboxSuggestion = { id: string; username: string; displayName: string };
type Role = "participant" | "investor";
type Props = {
  role: Role;
  threads: InboxThread[];
  suggestions?: InboxSuggestion[];
  initialUsername?: string;
  selectedId?: string;
  status?: string;
  error?: string;
  children?: ReactNode;
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1]?.[0] ?? "" : "")).toUpperCase();
}
function threadTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}
const notices: Record<string, string> = {
  blocked: "Usuário bloqueado.",
  unblocked: "Bloqueio removido.",
};
const errors: Record<string, string> = {
  user: "Informe um @usuário.",
  unavailable: "Essa conta não está disponível para novas mensagens.",
  blocked: "A conversa não pode ser iniciada por causa de um bloqueio.",
  create: "Não foi possível criar a conversa.",
  inbox: "Não foi possível carregar suas conversas agora.",
  block: "Não foi possível bloquear esse usuário.",
  unblock: "Não foi possível remover o bloqueio.",
};

export default function MessagesWorkspace({
  role, threads, suggestions = [], initialUsername = "", selectedId, status, error, children,
}: Props) {
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [newMessage, setNewMessage] = useState(Boolean(initialUsername));
  const [username, setUsername] = useState(initialUsername);
  const base = role === "investor" ? "/investor/messages" : "/messages";
  const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return threads.filter((thread) => {
      if (unreadOnly && thread.unreadCount < 1) return false;
      if (!query) return true;
      return [thread.targetName, thread.targetUsername ?? "", thread.lastBody ?? ""]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
    });
  }, [threads, search, unreadOnly]);
  const matches = suggestions.filter((profile) => {
    const query = username.trim().replace(/^@/, "").toLocaleLowerCase("pt-BR");
    return !query || profile.username.toLocaleLowerCase("pt-BR").includes(query) ||
      profile.displayName.toLocaleLowerCase("pt-BR").includes(query);
  });

  return (
    <div className={styles.workspace} data-envista-messages-page data-has-selection={selectedId ? "true" : "false"}>
      <section className={styles.inboxPanel} aria-label="Caixa de entrada">
        <header className={styles.inboxHeader}>
          <div className={styles.inboxHeading}>
            <h1>Mensagens</h1>
            <p>Suas conexões, em conversa.</p>
          </div>
          <button className={styles.newMessageButton} type="button" onClick={() => setNewMessage((open) => !open)}
            aria-expanded={newMessage} aria-controls="new-message-inline">
            {newMessage ? <X size={17} aria-hidden="true" /> : <SquarePen size={18} aria-hidden="true" />}
            <span>{newMessage ? "Fechar" : "Nova mensagem"}</span>
          </button>
        </header>
        <div className={styles.inboxTools}>
          <label className={styles.inboxSearch}>
            <Search size={19} aria-hidden="true" />
            <span className={styles.srOnly}>Buscar conversas</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar conversas..." />
          </label>
          <div className={styles.inboxFilters} role="group" aria-label="Filtrar conversas">
            <button type="button" aria-pressed={!unreadOnly} className={!unreadOnly ? styles.activeFilter : ""} onClick={() => setUnreadOnly(false)}>Todas</button>
            <button type="button" aria-pressed={unreadOnly} className={unreadOnly ? styles.activeFilter : ""} onClick={() => setUnreadOnly(true)}>
              Não lidas {unread > 0 ? <span>{unread}</span> : null}
            </button>
          </div>
        </div>

        {newMessage && (
          <section className={styles.inlineStart} id="new-message-inline" aria-label="Iniciar conversa">
            <div className={styles.inlineStartHeading}>
              <strong>Nova conversa</strong>
              <button type="button" onClick={() => setNewMessage(false)} aria-label="Fechar nova conversa"><X size={16} /></button>
            </div>
            <form action={startConversationAction} className={styles.inlineStartForm}>
              <label htmlFor="direct-new-username">Buscar pessoa pelo @usuário</label>
              <div className={styles.inlineStartInput}>
                <span aria-hidden="true">@</span>
                <input id="direct-new-username" name="username" type="text" required autoComplete="off"
                  placeholder="usuario" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={50} />
              </div>
              <button className={styles.startAction} type="submit">Abrir conversa <ArrowRight size={16} aria-hidden="true" /></button>
            </form>
            {matches.length > 0 && (
              <div className={styles.startSuggestions}>
                {matches.slice(0, 4).map((profile) => (
                  <form key={profile.id} action={startConversationAction}>
                    <button name="username" value={profile.username} type="submit" className={styles.startSuggestion}>
                      <span className={styles.miniAvatar} aria-hidden="true">{initials(profile.displayName)}</span>
                      <span><strong>{profile.displayName}</strong><small>{"@" + profile.username}</small></span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </form>
                ))}
              </div>
            )}
          </section>
        )}
        {status && notices[status] ? <p className={styles.notice} role="status">{notices[status]}</p> : null}
        {error && errors[error] ? <p className={styles.error} role="alert">{errors[error]}</p> : null}

        <nav className={styles.threadList} aria-label="Suas conversas">
          {filteredThreads.length === 0 ? (
            <div className={styles.inboxEmpty}>
              <MessageCircle size={29} aria-hidden="true" />
              <strong>{threads.length === 0 ? "Nenhuma conversa ainda" : "Nenhuma conversa encontrada"}</strong>
              <p>{threads.length === 0 ? "Use Nova mensagem para começar a conversar com alguém do Envista." : "Tente outro termo ou altere o filtro."}</p>
            </div>
          ) : filteredThreads.map((thread) => (
            <Link className={[styles.threadRow, selectedId === thread.id ? styles.threadSelected : "",
              thread.unreadCount > 0 ? styles.threadUnread : ""].filter(Boolean).join(" ")}
              href={base + "/" + thread.id} key={thread.id}
              aria-current={selectedId === thread.id ? "page" : undefined}>
              <span className={styles.avatar} aria-hidden="true">{initials(thread.targetName)}</span>
              <span className={styles.threadContent}>
                <span className={styles.threadTopline}>
                  <strong>{thread.targetName}</strong>
                  {thread.lastAt ? <time dateTime={thread.lastAt}>{threadTime(thread.lastAt)}</time> : null}
                </span>
                <span className={styles.threadSubline}>
                  <span>{thread.targetUsername ? "@" + thread.targetUsername : "Conta privada"}</span>
                  {thread.unreadCount > 0 && <span className={styles.unreadBadge} aria-label={String(thread.unreadCount) + " não lidas"}>
                    {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                  </span>}
                </span>
                <span className={styles.threadPreview}>{thread.lastBody || "Conversa iniciada — envie sua primeira mensagem."}</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section className={styles.chatPanel} aria-label="Área da conversa">
        {children ?? (
          <div className={styles.chatPlaceholder}>
            <div className={styles.placeholderLogo}><Image src="/brand/envista-symbol-gradient.svg" width={64} height={72} alt="" /></div>
            <h2>Comece uma conversa</h2>
            <p>Selecione uma conversa ou use Nova mensagem para se conectar com alguém do Envista.</p>
          </div>
        )}
      </section>
    </div>
  );
}
