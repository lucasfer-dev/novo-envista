import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { forgotPasswordAction } from "@/app/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = params.status === "sent";
  const error = typeof params.error === "string" ? params.error : "";
  const errorMessage =
    error === "captcha"
      ? "Conclua a verificação de segurança e tente novamente."
      : error === "rate"
        ? "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente."
        : error === "temporary"
          ? "A recuperação está temporariamente indisponível. Tente novamente em instantes."
          : "";

  return (
    <AuthShell title="Recuperar senha" description="Informe seu e-mail. A resposta não revela se existe ou não uma conta cadastrada.">
      {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
      {sent ? (
        <div className={styles.success}>
          Se houver uma conta compatível, as instruções de recuperação serão enviadas para esse e-mail.
        </div>
      ) : (
        <form action={forgotPasswordAction} className={styles.form}>
          <label>
            E-mail
            <input type="email" name="email" autoComplete="email" maxLength={254} required />
          </label>
          <div className={styles.captcha}><AuthCaptcha action="forgot-password" /></div>
          <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Enviando...">
            Enviar instruções
          </AuthSubmitButton>
        </form>
      )}
      <div className={styles.links}><Link href="/login">Voltar ao login</Link></div>
    </AuthShell>
  );
}
