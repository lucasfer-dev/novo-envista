"use client";

import { useEffect, useMemo, useState } from "react";
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
};

export default function MessagesRealtime({ conversationId, currentUserId, initialMessages, canSend, returnTo }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const markRead = () => supabase.from("message_read_state").upsert(
      { conversation_id: conversationId, user_id: currentUserId, last_read_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" },
    );
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
  }, [conversationId, currentUserId, supabase]);

  return (
    <>
      <div className={styles.messages} aria-live="polite">
        {messages.length === 0 ? <div className={styles.empty}>Nenhuma mensagem ainda.</div> : messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`${styles.bubble} ${mine ? styles.mine : ""}`}>
              <div>{message.body}</div>
              <small>{new Date(message.created_at).toLocaleString("pt-BR")}</small>
              {!mine ? (
                <details className={styles.report}>
                  <summary>Denunciar mensagem</summary>
                  <form action={reportMessageAction}>
                    <input type="hidden" name="conversation_id" value={conversationId}/>
                    <input type="hidden" name="message_id" value={message.id}/>
                    <select name="reason" defaultValue="conteudo-inadequado" aria-label="Motivo da denúncia">
                      <option value="conteudo-inadequado">Conteúdo inadequado</option>
                      <option value="assedio">Assédio</option>
                      <option value="spam">Spam</option>
                      <option value="privacidade">Privacidade</option>
                      <option value="outro">Outro</option>
                    </select>
                    <input name="details" maxLength={1000} placeholder="Detalhes opcionais"/>
                    <button className={styles.secondary}>Enviar denúncia</button>
                  </form>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
      {canSend ? (
        <form className={styles.composer} action={sendMessageAction}>
          <input type="hidden" name="conversation_id" value={conversationId}/>
          <input type="hidden" name="return_to" value={returnTo}/>
          <textarea name="body" maxLength={4000} required placeholder="Escreva uma mensagem…" aria-label="Mensagem"/>
          <button className={styles.primary}>Enviar</button>
        </form>
      ) : <div className={styles.privacy}>O envio de novas mensagens está desativado nesta conversa por uma configuração de privacidade ou bloqueio.</div>}
    </>
  );
}
