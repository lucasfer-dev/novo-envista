"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AdminMfa.module.css";

type Mode = "loading" | "enroll" | "challenge";

export function AdminMfaClient() {
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    void (async () => {
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (assurance.error) {
        setError("Não foi possível validar o nível de segurança da sessão.");
        return;
      }
      if (assurance.data.currentLevel === "aal2") {
        window.location.replace("/admin");
        return;
      }

      const factors = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factors.error) {
        setError("Não foi possível consultar os fatores de autenticação.");
        return;
      }

      const verified = factors.data.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setMode("challenge");
        return;
      }

      for (const factor of factors.data.totp.filter((item) => item.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const enrolled = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Envista Admin",
      });
      if (!active) return;
      if (enrolled.error) {
        setError("Não foi possível iniciar a configuração do autenticador.");
        return;
      }

      setFactorId(enrolled.data.id);
      setQrCode(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
      setMode("enroll");
    })();

    return () => {
      active = false;
    };
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError("Digite o código de 6 dígitos do aplicativo autenticador.");
      return;
    }

    setBusy(true);
    setError("");
    const supabase = createClient();
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (result.error) {
      setBusy(false);
      setCode("");
      setError("Código inválido ou expirado. Abra o autenticador e tente o código atual.");
      return;
    }

    await supabase.auth.refreshSession();
    window.location.replace("/admin");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("/login?next=/admin");
  }

  if (mode === "loading" && !error) {
    return <div className={styles.loading}>Preparando a autenticação segura…</div>;
  }

  return (
    <div className={styles.client}>
      {mode === "enroll" && (
        <div className={styles.box}>
          <div className={styles.boxTitle}><span className={styles.step}>1</span> Adicione o Envista ao autenticador</div>
          <p className={styles.muted}>
            Escaneie o QR Code com Google Authenticator, Microsoft Authenticator, Authy, 1Password ou outro aplicativo TOTP.
          </p>
          {qrCode && <div className={styles.qrWrap}><img src={qrCode} alt="QR Code para configurar MFA" className={styles.qr} /></div>}
          {secret && (
            <details className={styles.details}>
              <summary>Não consegue ler o QR Code?</summary>
              <p className={styles.muted}>Cadastre manualmente este segredo e guarde-o longe do computador:</p>
              <code className={styles.secret}>{secret}</code>
            </details>
          )}
        </div>
      )}

      {mode === "challenge" && (
        <div className={styles.box}>
          <div className={styles.boxTitle}>Confirme sua identidade</div>
          <p className={styles.muted}>Abra o autenticador já vinculado ao Envista e use o código atual.</p>
        </div>
      )}

      <form onSubmit={verify} className={styles.form}>
        <label htmlFor="admin-mfa-code" className={styles.label}>
          {mode === "enroll" ? "2. Digite o código gerado" : "Código do autenticador"}
        </label>
        <input
          id="admin-mfa-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          className={styles.input}
          aria-invalid={Boolean(error)}
          autoFocus={mode === "challenge"}
          aria-describedby={error ? "admin-mfa-error" : undefined}
        />
        {error && <p id="admin-mfa-error" role="alert" className={styles.error}>{error}</p>}
        <button type="submit" disabled={busy || mode === "loading"} className={styles.primary}>
          {busy ? "Verificando…" : "Verificar e entrar no painel"}
        </button>
      </form>

      <button type="button" onClick={signOut} className={styles.secondary}>Sair desta conta</button>
      <p className={styles.footnote}>
        Para reduzir o risco de perda de acesso, mantenha um segundo fator TOTP de backup em um dispositivo separado.
      </p>
    </div>
  );
}
