import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { blockUserAction, unblockUserAction } from "@/lib/messages/actions";
import MessagesRealtime from "@/components/real/MessagesRealtime";
import MessagesWorkspace, { type InboxThread, type InboxSuggestion } from "@/components/real/MessagesWorkspace";
import styles from "./Messages.module.css";

type Role = "participant" | "investor";
type Message = { id: string; sender_id: string; body: string; created_at: string };

function base(role: Role) { return role === "investor" ? "/investor/messages" : "/messages"; }
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
}

export function MessagesIndexView({ role, threads, suggestions = [], initialUsername = "", status, error }: {
  role: Role;
  threads: InboxThread[];
  suggestions?: InboxSuggestion[];
  initialUsername?: string;
  status?: string;
  error?: string;
}) {
  return (
    <MessagesWorkspace role={role} threads={threads} suggestions={suggestions}
      initialUsername={initialUsername} status={status} error={error} />
  );
}

export function ConversationView({
  role, threads, suggestions = [], currentUserId, conversationId, target, messages,
  blockedByMe, blockedMe, canSend, historyMode = false, hasOlder = false, olderCursor, status, error,
}: {
  role: Role;
  threads: InboxThread[];
  suggestions?: InboxSuggestion[];
  currentUserId: string;
  conversationId: string;
  target: { id: string; display_name: string; username: string | null };
  messages: Message[];
  blockedByMe: boolean;
  blockedMe: boolean;
  canSend: boolean;
  historyMode?: boolean;
  hasOlder?: boolean;
  olderCursor?: string | null;
  status?: string;
  error?: string;
}) {
  const root = base(role);
  const returnTo = root + "/" + conversationId;
  const olderHref = olderCursor ? returnTo + "?before=" + encodeURIComponent(olderCursor) : null;
  return (
    <MessagesWorkspace role={role} threads={threads} suggestions={suggestions} selectedId={conversationId}>
      <header className={styles.chatHeader}>
        <Link className={styles.backButton} href={root} aria-label="Voltar para conversas"><ArrowLeft size={19} aria-hidden="true" /></Link>
        <span className={styles.avatarLarge} aria-hidden="true">{initials(target.display_name)}</span>
        <div className={styles.conversationIdentity}>
          <h2>{target.display_name}</h2>
          <span>{target.username ? "@" + target.username : "Conta privada"}</span>
        </div>
        <details className={styles.safetyMenu}>
          <summary aria-label="Opções da conversa"><MoreHorizontal size={20} aria-hidden="true" /></summary>
          <div className={styles.safetyPopover}>
            <strong>Segurança da conversa</strong>
            {blockedByMe ? (
              <form action={unblockUserAction}>
                <input type="hidden" name="blocked_id" value={target.id} />
                <button className={styles.secondary}>Desbloquear usuário</button>
              </form>
            ) : (
              <form action={blockUserAction}>
                <input type="hidden" name="blocked_id" value={target.id} />
                <button className={styles.danger}>Bloquear usuário</button>
              </form>
            )}
          </div>
        </details>
      </header>
      {status === "reported" ? <div className={styles.notice} role="status">Denúncia registrada para análise.</div> : null}
      {error ? <div className={styles.error} role="alert">
        {error === "send" ? "A mensagem não foi enviada. Verifique as permissões ou se há um bloqueio ativo." : "Não foi possível concluir a ação."}
      </div> : null}
      {blockedMe ? <div className={styles.privacy}>Esta conversa não aceita novas mensagens.</div> : null}
      <div className={styles.conversationShell} aria-label={"Conversa com " + target.display_name}>
        {((hasOlder && olderHref) || historyMode) ? <div className={styles.historyBar}>
          {hasOlder && olderHref ? <Link className={styles.historyLink} href={olderHref}>← Carregar mensagens anteriores</Link> : <span />}
          {historyMode ? <Link className={styles.historyLink} href={returnTo}>Voltar às recentes</Link> : null}
        </div> : null}
        <MessagesRealtime conversationId={conversationId} currentUserId={currentUserId}
          initialMessages={messages} canSend={canSend} returnTo={returnTo} live={!historyMode} />
      </div>
    </MessagesWorkspace>
  );
}
