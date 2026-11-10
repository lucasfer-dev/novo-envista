"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, MailWarning, X } from "lucide-react";
import styles from "./RegisterShell.module.css";

export type ResendStatus = "resent" | "resend-rate" | "resend-temporary" | "resend-invalid";

const messages: Record<ResendStatus, { title: string; detail: string; type: "success" | "error" }> = {
  resent: {
    title: "Solicitação de reenvio aceita",
    detail: "Se existir uma conta aguardando confirmação, um novo link será enviado. Confira sua caixa de entrada e o Spam.",
    type: "success",
  },
  "resend-rate": {
    title: "Você tentou reenviar muitas vezes",
    detail: "Por segurança, aguarde alguns minutos antes de fazer uma nova tentativa.",
    type: "error",
  },
  "resend-temporary": {
    title: "Não foi possível solicitar o reenvio",
    detail: "O serviço de e-mail está indisponível no momento. Tente novamente em alguns instantes.",
    type: "error",
  },
  "resend-invalid": {
    title: "Verifique o endereço informado",
    detail: "Digite um e-mail válido para solicitar um novo link de confirmação.",
    type: "error",
  },
};

export function ResendStatusNotice({ status }: { status: ResendStatus }) {
  const [visible, setVisible] = useState(true);
  const message = messages[status];

  useEffect(() => {
    const removeStatusFromUrl = () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("status") === status) {
        url.searchParams.set("status", "check-email");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    };

    const timer = window.setTimeout(() => {
      setVisible(false);
      removeStatusFromUrl();
    }, message.type === "success" ? 8000 : 11000);

    return () => window.clearTimeout(timer);
  }, [status, message.type]);

  if (!visible) return null;

  const close = () => {
    setVisible(false);
    const url = new URL(window.location.href);
    if (url.searchParams.get("status") === status) {
      url.searchParams.set("status", "check-email");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  };

  return (
    <div
      className={[styles.resendToast, message.type === "error" ? styles.resendToastError : styles.resendToastSuccess].join(" ")}
      role={message.type === "error" ? "alert" : "status"}
      aria-live={message.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className={styles.resendToastIcon} aria-hidden="true">
        {status === "resent" ? <CheckCircle2 size={22} /> : status === "resend-rate" ? <Clock3 size={22} /> : status === "resend-invalid" ? <MailWarning size={22} /> : <AlertCircle size={22} />}
      </span>
      <div className={styles.resendToastText}>
        <strong>{message.title}</strong>
        <p>{message.detail}</p>
      </div>
      <button type="button" className={styles.resendToastClose} aria-label="Fechar notificação" onClick={close}>
        <X size={18} aria-hidden="true" />
      </button>
      <span className={styles.resendToastProgress} aria-hidden="true" />
    </div>
  );
}
