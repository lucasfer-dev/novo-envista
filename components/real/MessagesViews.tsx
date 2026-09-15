import Link from "next/link";
import { blockUserAction, startConversationAction, unblockUserAction } from "@/lib/messages/actions";
import MessagesRealtime from "@/components/real/MessagesRealtime";
import styles from "./Messages.module.css";

type Role = "participant" | "investor";
type Thread = {
  id: string;
  targetId: string;
  targetName: string;
  targetUsername: string | null;
  lastBody: string | null;
  lastAt: string | null;
  unreadCount: number;
};
type Suggestion = { id: string; username: string; displayName: string };
type Message = { id: string; sender_id: string; body: string; created_at: string };

function base(role: Role) { return role === "investor" ? "/investor/messages" : "/messages"; }
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase();
}
function formatThreadTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function MessagesIndexView({ role, threads, suggestions = [], initialUsername = "", status, error }: { role: Role; threads: Thread[]; suggestions?: Suggestion[]; initialUsername?: string; status?: string; error?: string }) {
  const root = base(role);
  const totalUnread = threads.reduce((total, thread) => total + thread.unreadCount, 0);
  const notices: Record<string, string> = { blocked: "Usuário bloqueado.", unblocked: "Bloqueio removido." };
  const errors: Record<string, string> = {
    user: "Informe um @usuário.", unavailable: "Essa conta não está disponível para novas mensagens.", blocked: "A conversa não pode ser iniciada por causa de um bloqueio.", create: "Não foi possível criar a conversa.", inbox: "Não foi possível carregar suas conversas agora.", block: "Não foi possível bloquear esse usuário.", unblock: "Não foi possível remover o bloqueio.",
  };

  return <div className={styles.page}>
    <header className={styles.pageHeader}>
      <div>
        <span className={styles.eyebrow}>Caixa de entrada</span>
        <h1>Mensagens</h1>
        <p className={styles.muted}>Conversas diretas com participantes e investidores do Envista.</p>
      </div>
      <div className={styles.headerMeta}>
        <span className={styles.connectionState}><i aria-hidden="true" />Tempo real ativo</span>
        {totalUnread > 0 ? <span className={styles.unreadSummary}>{totalUnread} {totalUnread === 1 ? "não lida" : "não lidas"}</span> : <span className={styles.allRead}>Tudo em dia</span>}
      </div>
    </header>

    {status && notices[status] ? <div className={styles.notice}>{notices[status]}</div> : null}
    {error && errors[error] ? <div className={styles.error}>{errors[error]}</div> : null}

    <div className={styles.inboxLayout}>
      <section className={styles.inboxPanel} aria-labelledby="conversation-list-title">
        <div className={styles.sectionHeader}>
          <div><span className={styles.sectionKicker}>Recentes</span><h2 id="conversation-list-title">Suas conversas</h2></div>
          <span className={styles.threadCount}>{threads.length}</span>
        </div>
        <div className={styles.threadList}>
          {threads.length === 0 ? <div className={styles.emptyState}><div className={styles.emptyIcon}>✦</div><h3>Nenhuma conversa ainda</h3><p>Encontre alguém ao lado e envie a primeira mensagem.</p></div> : threads.map((thread) =>
            <Link className={`${styles.threadRow} ${thread.unreadCount > 0 ? styles.threadUnread : ""}`} href={`${root}/${thread.id}`} key={thread.id}>
              <div className={styles.avatar} aria-hidden="true">{initials(thread.targetName)}</div>
              <div className={styles.threadContent}>
                <div className={styles.threadTopline}>
                  <strong>{thread.targetName}</strong>
                  <time>{formatThreadTime(thread.lastAt)}</time>
                </div>
                <div className={styles.threadSubline}>
                  <span>{thread.targetUsername ? `@${thread.targetUsername}` : "Conta privada"}</span>
                  {thread.unreadCount > 0 ? <span className={styles.unreadBadge} aria-label={`${thread.unreadCount} mensagens não lidas`}>{thread.unreadCount > 99 ? "99+" : thread.unreadCount}</span> : null}
                </div>
                <p>{thread.lastBody ? (thread.lastBody.length > 96 ? `${thread.lastBody.slice(0, 96)}…` : thread.lastBody) : "Conversa criada — envie uma mensagem para começar."}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <aside className={styles.startPanel}>
        <div className={styles.startPanelIntro}>
          <span className={styles.sectionKicker}>Nova conversa</span>
          <h2>Fale com alguém</h2>
          <p>Procure pelo @usuário. Só aparecem pessoas que permitem mensagens.</p>
        </div>
        <form className={styles.startForm} action={startConversationAction}>
          <label htmlFor="message-username">Usuário</label>
          <div className={styles.searchBox}>
            <span aria-hidden="true">@</span>
            <input id="message-username" name="username" list="message-profile-suggestions" maxLength={50} placeholder="usuario" defaultValue={initialUsername} autoComplete="off" required />
          </div>
          <datalist id="message-profile-suggestions">{suggestions.map((profile) => <option key={profile.id} value={profile.username}>{profile.displayName}</option>)}</datalist>
          <button className={styles.primary}>Abrir conversa</button>
        </form>

        {suggestions.length ? <div className={styles.suggestions}>
          <span className={styles.suggestionLabel}>Sugestões</span>
          {suggestions.slice(0, 5).map((profile) => <form action={startConversationAction} key={profile.id}>
            <button className={styles.suggestionRow} name="username" value={profile.username}>
              <span className={styles.miniAvatar} aria-hidden="true">{initials(profile.displayName)}</span>
              <span><strong>{profile.displayName}</strong><small>@{profile.username}</small></span>
              <span className={styles.suggestionArrow} aria-hidden="true">→</span>
            </button>
          </form>)}
        </div> : null}

        <div className={styles.privacyTip}><strong>Privacidade</strong><span>Você pode controlar quem consegue iniciar conversas em Configurações.</span></div>
      </aside>
    </div>
  </div>;
}

export function ConversationView({ role, currentUserId, conversationId, target, messages, blockedByMe, blockedMe, canSend, historyMode = false, hasOlder = false, olderCursor, status, error }: { role: Role; currentUserId: string; conversationId: string; target: { id: string; display_name: string; username: string | null }; messages: Message[]; blockedByMe: boolean; blockedMe: boolean; canSend: boolean; historyMode?: boolean; hasOlder?: boolean; olderCursor?: string | null; status?: string; error?: string }) {
  const root = base(role);
  const returnTo = `${root}/${conversationId}`;
  const olderHref = olderCursor ? `${returnTo}?before=${encodeURIComponent(olderCursor)}` : null;
  return <div className={styles.conversationPage}>
    <header className={styles.conversationHeader}>
      <Link className={styles.backButton} href={root} aria-label="Voltar para mensagens">←</Link>
      <div className={styles.avatarLarge} aria-hidden="true">{initials(target.display_name)}</div>
      <div className={styles.conversationIdentity}>
        <h1>{target.display_name}</h1>
        <div><span>{target.username ? `@${target.username}` : "Conta privada"}</span>{canSend ? <span className={styles.availableDot}>Disponível</span> : null}</div>
      </div>
      <details className={styles.safetyMenu}>
        <summary aria-label="Opções da conversa">•••</summary>
        <div className={styles.safetyPopover}>
          <strong>Segurança da conversa</strong>
          {blockedByMe ? <form action={unblockUserAction}><input type="hidden" name="blocked_id" value={target.id} /><button className={styles.secondary}>Desbloquear usuário</button></form> : <form action={blockUserAction}><input type="hidden" name="blocked_id" value={target.id} /><button className={styles.danger}>Bloquear usuário</button></form>}
        </div>
      </details>
    </header>

    {status === "reported" ? <div className={styles.notice}>Denúncia registrada para análise.</div> : null}
    {error ? <div className={styles.error}>{error === "send" ? "A mensagem não foi enviada. A conta pode ter alterado as permissões ou um bloqueio pode estar ativo." : "Não foi possível concluir a ação."}</div> : null}
    {blockedMe ? <div className={styles.privacy}>Esta conversa não aceita novas mensagens.</div> : null}

    <section className={styles.conversationShell} aria-label={`Conversa com ${target.display_name}`}>
      {(hasOlder && olderHref) || historyMode ? <div className={styles.historyBar}>
        {hasOlder && olderHref ? <Link className={styles.historyLink} href={olderHref}>← Carregar mensagens anteriores</Link> : <span />}
        {historyMode ? <Link className={styles.historyLink} href={returnTo}>Voltar às recentes</Link> : null}
      </div> : null}
      <MessagesRealtime conversationId={conversationId} currentUserId={currentUserId} initialMessages={messages} canSend={canSend} returnTo={returnTo} live={!historyMode} />
    </section>
  </div>;
}
