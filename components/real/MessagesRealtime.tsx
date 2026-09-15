"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { reportMessageAction, sendMessageAction } from "@/lib/messages/actions";
import styles from "./Messages.module.css";

type Message = { id: string; sender_id: string; body: string; created_at: string };

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  canSend: boolean;
  returnTo: string;
  live?: boolean;
};

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

export default function MessagesRealtime({ conversationId, currentUserId, initialMessages, canSend, returnTo, live = true }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const supabase = useMemo(() => createClient(), []);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!live) return;

    const markRead = async () => {
      const readAt = new Date().toISOString();
      const notificationPaths = [
        `/messages/${conversationId}`,
        `/app/messages/${conversationId}`,
        `/investor/messages/${conversationId}`,
      ];
      await Promise.all([
        supabase.from("message_read_state").upsert(
          { conversation_id: conversationId, user_id: currentUserId, last_read_at: readAt },
          { onConflict: "conversation_id,user_id" },
        ),
        supabase
          .from("notifications")
          .update({ read_at: readAt })
          .eq("user_id", currentUserId)
          .eq("kind", "message")
          .in("href", notificationPaths)
          .is("read_at", null),
      ]);
    };

    void markRead();
    const channel = supabase
      .channel(`direct:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
          void markRead();
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, live, supabase]);

  useEffect(() => {
    if (live) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, live]);

  return (
    <>
      <div className={styles.messages} aria-live={live ? "polite" : "off"}>
        {messages.length === 0 ? <div className={styles.chatEmpty}><div>✦</div><strong>Comece a conversa</strong><span>Envie uma mensagem para abrir este contato.</span></div> : messages.map((message, index) => {
          const mine = message.sender_id === currentUserId;
          const previous = messages[index - 1];
          const showDay = !previous || dayKey(previous.created_at) !== dayKey(message.created_at);
          return (
            <Fragment key={message.id}>
              {showDay ? <div className={styles.daySeparator}><span>{dayLabel(message.created_at)}</span></div> : null}
              <div className={`${styles.messageRow} ${mine ? styles.messageRowMine : ""}`}>
                <div className={`${styles.bubble} ${mine ? styles.mine : ""}`}>
                  <div className={styles.messageBody}>{message.body}</div>
                  <div className={styles.messageMeta}>
                    <time>{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                    {mine ? <span aria-label="Mensagem enviada">✓</span> : null}
                  </div>
                  {!mine ? (
                    <details className={styles.report}>
                      <summary aria-label="Opções da mensagem">•••</summary>
                      <div className={styles.reportPopover}>
                        <form action={reportMessageAction}>
                          <input type="hidden" name="conversation_id" value={conversationId}/>
                          <input type="hidden" name="message_id" value={message.id}/>
                          <label>Motivo<select name="reason" defaultValue="conteudo-inadequado">
                            <option value="conteudo-inadequado">Conteúdo inadequado</option>
                            <option value="assedio">Assédio</option>
                            <option value="spam">Spam</option>
                            <option value="privacidade">Privacidade</option>
                            <option value="outro">Outro</option>
                          </select></label>
                          <label>Detalhes<input name="details" maxLength={1000} placeholder="Opcional"/></label>
                          <button className={styles.secondary}>Denunciar mensagem</button>
                        </form>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </Fragment>
          );
        })}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
      {!live ? <div className={styles.privacy}>Você está vendo uma parte antiga do histórico. Volte às mensagens mais recentes para responder e receber atualizações em tempo real.</div> : canSend ? (
        <form className={styles.composer} action={sendMessageAction}>
          <input type="hidden" name="conversation_id" value={conversationId}/>
          <input type="hidden" name="return_to" value={returnTo}/>
          <div className={styles.composerField}>
            <textarea
              name="body"
              maxLength={4000}
              required
              placeholder="Digite uma mensagem…"
              aria-label="Mensagem"
              aria-keyshortcuts="Enter"
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <small className={styles.composerHint}>Enter envia · Shift + Enter quebra a linha</small>
          </div>
          <button className={styles.sendButton} aria-label="Enviar mensagem"><span>Enviar</span><b aria-hidden="true">↑</b></button>
        </form>
      ) : <div className={styles.privacy}>O envio de novas mensagens está desativado nesta conversa por uma configuração de privacidade ou bloqueio.</div>}
    </>
  );
}
