import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { loginAction } from "@/app/auth/actions";
import {
  homeForRole,
  parseProductRole,
  pathAllowedForRole,
  safeInternalPath,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Envista para acessar seus projetos, equipes, cursos e oportunidades.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const next = safeInternalPath(params.next, "");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!claimsError && userId) {
    const [profileResult, complianceResult, completionResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      supabase
        .from("account_compliance")
        .select("age_band,guardian_consent_verified_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("onboarding_completions")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (!profileResult.error && !complianceResult.error && !completionResult.error) {
      if (!completionResult.data) redirect("/onboarding");
      if (
        complianceResult.data?.age_band === "child" &&
        !complianceResult.data.guardian_consent_verified_at
      ) {
        redirect("/guardian-required");
      }

      const role = parseProductRole(profileResult.data?.role);
      const fallback = homeForRole(role);
      const requested = safeInternalPath(next, fallback);
      redirect(pathAllowedForRole(requested, role) ? requested : fallback);
    }
  }

  const errorMessage = error === "session"
    ? "Sua sessão não pôde ser validada. Entre novamente."
    : error === "captcha"
      ? "Conclua a verificação de segurança e tente novamente."
      : error === "rate"
        ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : error === "temporary"
          ? "O login está temporariamente indisponível. Tente novamente em instantes."
          : error
            ? "E-mail, CPF ou senha inválidos."
            : "";

  return (
    <AuthShell
      title="Entrar no Envista"
      description="Continue de onde parou e acompanhe seus projetos, equipes e oportunidades."
    >
      {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
      {status === "password-updated" ? <div className={styles.success}>Senha atualizada e sessões anteriores encerradas. Entre novamente.</div> : null}
      {status === "confirmed" ? <div className={styles.success}>E-mail confirmado. Agora você pode entrar.</div> : null}

      <form action={loginAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <label>
          E-mail ou CPF
          <input
            type="text"
            name="identifier"
            autoComplete="username"
            maxLength={254}
            placeholder="voce@email.com ou 000.000.000-00"
            required
          />
        </label>
        <label>
          <span className={styles.fieldLabel}>
            <span>Senha</span>
            <Link className={styles.inlineLink} href="/forgot-password">Esqueci minha senha</Link>
          </span>
          <input type="password" name="password" autoComplete="current-password" maxLength={128} required />
        </label>
        <div className={styles.captcha}><AuthCaptcha action="login" /></div>
        <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Entrando...">Entrar</AuthSubmitButton>
      </form>

      <div className={styles.sessionHint}>Sua sessão é mantida neste navegador enquanto continuar válida.</div>

      <div className={styles.authFooter}>
        <span className={styles.footerPrompt}>Ainda não tem uma conta?</span>
        <Link className={`${styles.secondary} ${styles.full}`} href="/register">Criar conta</Link>
      </div>
    </AuthShell>
  );
}
