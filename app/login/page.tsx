import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
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

  return (
    <AuthShell title="Entrar no Envista" description="Acesse sua conta com autenticação real pelo Supabase.">
      {error ? (
        <div className={styles.error} role="alert">
          {error === "session"
            ? "Sua sessão não pôde ser validada. Entre novamente."
            : "E-mail ou senha inválidos."}
        </div>
      ) : null}
      {status === "password-updated" ? (
        <div className={styles.success}>Senha atualizada. Entre novamente.</div>
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
        <button className={`${styles.primary} ${styles.full}`} type="submit">
          Entrar
        </button>
      </form>
      <div className={styles.links}>
        <Link href="/forgot-password">Esqueci minha senha</Link>
        <Link href="/register">Criar conta</Link>
      </div>
    </AuthShell>
  );
}
