import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { RegisterShell } from "@/components/auth/RegisterShell";
import LoginPasswordField from "@/components/auth/LoginPasswordField";
import styles from "@/components/auth/LoginPage.module.css";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { loginAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole, pathAllowedForRole, safeInternalPath } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Entrar", description: "Entre no Envista e continue seus projetos, equipes e oportunidades." };

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
      supabase.from("account_compliance").select("age_band,guardian_consent_verified_at").eq("user_id", userId).maybeSingle(),
      supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);
    if (!profileResult.error && !complianceResult.error && !completionResult.error) {
      if (!completionResult.data) redirect("/onboarding");
      if (complianceResult.data?.age_band === "child" && !complianceResult.data.guardian_consent_verified_at) redirect("/guardian-required");
      const role = parseProductRole(profileResult.data?.role);
      const fallback = homeForRole(role);
      const destination = safeInternalPath(next, fallback);
      redirect(pathAllowedForRole(destination, role) ? destination : fallback);
    }
  }

  const errorMessage = error === "session" ? "Sua sessão não pôde ser validada. Entre novamente." : error === "captcha" ? "Conclua a verificação de segurança e tente novamente." : error === "rate" ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente." : error === "temporary" ? "O login está temporariamente indisponível. Tente novamente em instantes." : error ? "E-mail, CPF/CNPJ ou senha inválidos." : "";

  return (
    <RegisterShell phase="login" title="Entrar no Envista" description="Acesse com e-mail, CPF ou CNPJ e continue de onde parou.">
      {errorMessage ? <div className={`${styles.message} ${styles.error}`} role="alert">{errorMessage}</div> : null}
      {status === "password-updated" ? <div className={`${styles.message} ${styles.success}`} role="status">Senha atualizada e sessões anteriores encerradas. Entre novamente.</div> : null}
      {status === "confirmed" ? <div className={`${styles.message} ${styles.success}`} role="status">E-mail confirmado. Agora você pode entrar.</div> : null}
      {status === "signed-out-everywhere" ? <div className={`${styles.message} ${styles.success}`} role="status">Todas as sessões foram encerradas.</div> : null}
      <form action={loginAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <div className={styles.field}>
          <label htmlFor="login-identifier">E-mail, CPF ou CNPJ</label>
          <div className={styles.inputWrap}>
            <Mail className={styles.leadingIcon} aria-hidden="true" />
            <input
              id="login-identifier"
              type="text" name="identifier"
              autoComplete="username"
              maxLength={254}
              placeholder="voce@email.com ou documento"
              required
            />
          </div>
          <span className={styles.helper}>CPF/CNPJ é usado somente como identificador privado de acesso e não aparece no perfil.</span>
        </div>
        <LoginPasswordField />
        <div className={styles.captcha}><AuthCaptcha action="login" /></div>
        <AuthSubmitButton className={styles.submit} pendingText="Entrando...">Entrar</AuthSubmitButton>
        <p className={styles.hint}>Sua sessão é mantida neste navegador enquanto continuar válida.</p>
      </form>
      <div className={styles.authFooter}>
        <span>Ainda não faz parte?</span>
        <Link className={styles.createAccount} href="/register">Criar conta</Link>
      </div>
    </RegisterShell>
  );
}
