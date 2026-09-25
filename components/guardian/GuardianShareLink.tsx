"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./GuardianFlow.module.css";
import { authStyles } from "@/components/auth/AuthShell";

export default function GuardianShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.shareBox}>
      <input className={styles.shareUrl} value={url} readOnly aria-label="Link para confirmação do responsável" />
      <div className={styles.shareActions}>
        <button type="button" className={authStyles.primary} onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Link copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
