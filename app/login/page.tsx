import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { loginAction } from "@/app/auth/actions";
import { safeInternalPath } from "@/lib/auth/validation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const next = safeInternalPath(params.next, "");

  const errorMessage =
    error === "session"
      ? "Sua sessão não pôde ser validada. Entre novamente."
      : error === "captcha"
        ? "Conclua a verificação de segurança e tente novamente."
        : error === "rate"
          ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
          : error === "temporary"
            ? "O login está temporariamente indisponível. Tente novamente em instantes."
            : error
              ? "E-mail ou senha inválidos."
              : "";

  return (
    <AuthShell title="Entrar no Envista" description="Acesse sua conta com autenticação protegida pelo Supabase.">
      {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
      {status === "password-updated" ? (
        <div className={styles.success}>Senha atualizada e sessões anteriores encerradas. Entre novamente.</div>
      ) : null}
      {status === "confirmed" ? (
        <div className={styles.success}>E-mail confirmado. Agora você pode entrar.</div>
      ) : null}
      <form action={loginAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <label>
          E-mail
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          Senha
          <input type="password" name="password" autoComplete="current-password" maxLength={128} required />
        </label>
        <div className={styles.captcha}><AuthCaptcha action="login" /></div>
        <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Entrando...">
          Entrar
        </AuthSubmitButton>
      </form>
      <div className={styles.links}>
        <Link href="/forgot-password">Esqueci minha senha</Link>
        <Link href="/register">Criar conta</Link>
      </div>
    </AuthShell>
  );
}
