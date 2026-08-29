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
type Message = { id: string; sender_id: string; body: string; created_at: string };

function base(role: Role) { return role === "investor" ? "/investor/messages" : "/app/messages"; }

export function MessagesIndexView({ role, threads, status, error }: { role: Role; threads: Thread[]; status?: string; error?: string }) {
  const root = base(role);
  const totalUnread = threads.reduce((total, thread) => total + thread.unreadCount, 0);
  const notices: Record<string, string> = { blocked: "Usuário bloqueado.", unblocked: "Bloqueio removido." };
  const errors: Record<string, string> = {
    user: "Informe um @usuário.",
    unavailable: "Essa conta não está disponível para novas mensagens.",
    blocked: "A conversa não pode ser iniciada por causa de um bloqueio.",
    create: "Não foi possível criar a conversa.",
    inbox: "Não foi possível carregar suas conversas agora.",
    block: "Não foi possível bloquear esse usuário.",
    unblock: "Não foi possível remover o bloqueio.",
  };

  return <>
    <div className={styles.head}>
      <div>
        <h1>Mensagens</h1>
        <p className={styles.muted}>Conversas privadas persistidas no Supabase.</p>
      </div>
      {totalUnread > 0 ? <span className={styles.unreadSummary}>{totalUnread} {totalUnread === 1 ? "nova" : "novas"}</span> : null}
    </div>
    {status && notices[status] ? <div className={styles.notice}>{notices[status]}</div> : null}
    {error && errors[error] ? <div className={styles.error}>{errors[error]}</div> : null}
    <div className={styles.grid}>
      <aside className={styles.panel}>
        <h2>Nova conversa</h2>
        <p className={styles.muted}>Use o @username. Só contas que permitem novas mensagens podem ser encontradas.</p>
        <form className={styles.form} action={startConversationAction}>
          <label>Usuário<input name="username" maxLength={50} placeholder="@usuario" required /></label>
          <button className={styles.primary}>Iniciar conversa</button>
        </form>
      </aside>
      <section className={styles.panel}>
        <h2>Conversas</h2>
        <div className={styles.stack}>
          {threads.length === 0 ? <div className={styles.empty}>Você ainda não tem conversas reais.</div> : threads.map((thread) =>
            <Link
              className={`${styles.thread} ${thread.unreadCount > 0 ? styles.threadUnread : ""}`}
              href={`${root}/${thread.id}`}
              key={thread.id}
            >
              <div className={styles.threadTop}>
                <strong>{thread.targetName}</strong>
                {thread.unreadCount > 0 ? (
                  <span className={styles.unreadBadge} aria-label={`${thread.unreadCount} mensagens não lidas`}>
                    {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                  </span>
                ) : null}
              </div>
              <small>{thread.targetUsername ? `@${thread.targetUsername}` : "Conta privada"}</small>
              {thread.lastBody ? <small>{thread.lastBody.length > 72 ? `${thread.lastBody.slice(0, 72)}…` : thread.lastBody}</small> : <small>Conversa criada — sem mensagens ainda.</small>}
              {thread.lastAt ? <small>{new Date(thread.lastAt).toLocaleString("pt-BR")}</small> : null}
            </Link>
          )}
        </div>
      </section>
    </div>
  </>;
}

export function ConversationView({ role, currentUserId, conversationId, target, messages, blockedByMe, blockedMe, canSend, status, error }: { role: Role; currentUserId: string; conversationId: string; target: { id: string; display_name: string; username: string | null }; messages: Message[]; blockedByMe: boolean; blockedMe: boolean; canSend: boolean; status?: string; error?: string }) {
  const root = base(role);
  const returnTo = `${root}/${conversationId}`;
  return <>
    <div className={styles.head}>
      <div><Link href={root}>← Mensagens</Link><h1>{target.display_name}</h1><p className={styles.muted}>{target.username ? `@${target.username}` : "Conta privada"}</p></div>
      <div className={styles.actions}>
        {blockedByMe ? <form action={unblockUserAction}><input type="hidden" name="blocked_id" value={target.id} /><button className={styles.secondary}>Desbloquear</button></form> : <form action={blockUserAction}><input type="hidden" name="blocked_id" value={target.id} /><button className={styles.danger}>Bloquear</button></form>}
      </div>
    </div>
    {status === "reported" ? <div className={styles.notice}>Denúncia registrada para análise.</div> : null}
    {error ? <div className={styles.error}>{error === "send" ? "A mensagem não foi enviada. A conta pode ter alterado as permissões ou um bloqueio pode estar ativo." : "Não foi possível concluir a ação."}</div> : null}
    {blockedMe ? <div className={styles.privacy}>Esta conversa não aceita novas mensagens.</div> : null}
    <section className={styles.card}>
      <MessagesRealtime conversationId={conversationId} currentUserId={currentUserId} initialMessages={messages} canSend={canSend} returnTo={returnTo} />
    </section>
  </>;
}
