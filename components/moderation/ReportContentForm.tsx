"use client";

import { Flag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createContentReportAction } from "@/lib/moderation/actions";
import styles from "./ReportContentForm.module.css";

export default function ReportContentForm({
  targetType,
  targetId,
  returnTo,
}: {
  targetType: "profile" | "post" | "project" | "team";
  targetId: string;
  returnTo: string;
}) {
  const params = useSearchParams();
  const status = params.get("report");

  return (
    <details className={styles.wrap}>
      <summary className={styles.summary}><Flag size={14} /> Denunciar</summary>
      <form className={styles.panel} action={createContentReportAction}>
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <p className={styles.note}>A denúncia vai para a equipe de moderação. Não inclua senhas, documentos ou outros dados sensíveis.</p>
        <label>Motivo
          <select name="reason" defaultValue="spam" required>
            <option value="spam">Spam</option>
            <option value="harassment">Assédio ou intimidação</option>
            <option value="impersonation">Falsidade ideológica / personificação</option>
            <option value="unsafe">Conteúdo inseguro</option>
            <option value="privacy">Privacidade</option>
            <option value="misleading">Conteúdo enganoso</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label>Detalhes opcionais
          <textarea name="details" maxLength={2000} placeholder="Explique o que aconteceu sem compartilhar dados sensíveis." />
        </label>
        <button type="submit">Enviar denúncia</button>
        {status === "sent" ? <p className={styles.feedback}>Denúncia enviada para análise.</p> : null}
        {status === "exists" ? <p className={styles.feedback}>Você já tem uma denúncia ativa para este conteúdo.</p> : null}
        {status === "error" ? <p className={`${styles.feedback} ${styles.error}`}>Não foi possível enviar a denúncia.</p> : null}
      </form>
    </details>
  );
}
