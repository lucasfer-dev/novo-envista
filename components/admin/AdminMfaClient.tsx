"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "challenge";

const boxStyle = { border: "1px solid #e4e7ec", borderRadius: 14, padding: 16, background: "#f9fafb" } as const;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #d0d5dd", borderRadius: 10, padding: "12px 14px", fontSize: 18, letterSpacing: 4, marginTop: 10 };
const buttonStyle = { width: "100%", border: 0, borderRadius: 10, padding: "12px 16px", fontWeight: 700, cursor: "pointer", background: "#037fb0", color: "white", marginTop: 12 } as const;

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

      // Fatores não verificados não podem ser retomados com segurança porque o
      // segredo inicial não é devolvido novamente. Removemos tentativas antigas
      // antes de criar uma matrícula nova para evitar acumular fatores órfãos.
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

    // Garante que o cookie usado pelo SSR já carregue o JWT aal2 antes de abrir
    // qualquer rota administrativa.
    await supabase.auth.refreshSession();
    window.location.replace("/admin");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("/login?next=/admin");
  }

  if (mode === "loading" && !error) {
    return <div style={boxStyle}>Preparando a autenticação segura…</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {mode === "enroll" && (
        <div style={boxStyle}>
          <strong>1. Adicione o Envista no seu autenticador</strong>
          <p style={{ color: "#667085", lineHeight: 1.5 }}>
            Escaneie o QR Code com Google Authenticator, Microsoft Authenticator, Authy, 1Password ou outro aplicativo TOTP.
          </p>
          {qrCode && <img src={qrCode} alt="QR Code para configurar MFA" style={{ display: "block", width: 220, maxWidth: "100%", margin: "14px auto", background: "white", padding: 8, borderRadius: 12 }} />}
          {secret && (
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Não consegue ler o QR Code?</summary>
              <p style={{ color: "#667085" }}>Cadastre manualmente este segredo e guarde-o longe do computador:</p>
              <code style={{ display: "block", overflowWrap: "anywhere", background: "white", padding: 10, borderRadius: 8 }}>{secret}</code>
            </details>
          )}
        </div>
      )}

      {mode === "challenge" && (
        <div style={boxStyle}>
          <strong>Confirme sua identidade</strong>
          <p style={{ color: "#667085", lineHeight: 1.5 }}>Abra o autenticador que já está vinculado ao Envista e use o código atual.</p>
        </div>
      )}

      <form onSubmit={verify}>
        <label htmlFor="admin-mfa-code" style={{ fontWeight: 700 }}>
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
          style={inputStyle}
          aria-invalid={Boolean(error)}
          autoFocus={mode === "challenge"}
        />
        {error && <p role="alert" style={{ color: "#b42318", lineHeight: 1.5 }}>{error}</p>}
        <button type="submit" disabled={busy || mode === "loading"} style={{ ...buttonStyle, opacity: busy || mode === "loading" ? 0.65 : 1 }}>
          {busy ? "Verificando…" : "Verificar e entrar no painel"}
        </button>
      </form>

      <button type="button" onClick={signOut} style={{ border: 0, background: "transparent", color: "#475467", cursor: "pointer", padding: 8 }}>
        Sair desta conta
      </button>
      <p style={{ margin: 0, fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
        Para evitar perda de acesso, depois de entrar cadastre um segundo fator TOTP de backup em um dispositivo separado.
      </p>
    </div>
  );
}
