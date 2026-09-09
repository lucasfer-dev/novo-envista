import Link from "next/link";
import { confirmEmailAction } from "@/app/auth/email-actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim() : "";
  const code = typeof params.code === "string" ? params.code.trim() : "";
  const hasCredential = Boolean(tokenHash || code);

  return (
    <AuthShell
      title="Confirme seu e-mail"
      description="Falta só uma etapa para ativar sua conta e continuar no Envista."
    >
      {hasCredential ? (
        <>
          <div className={styles.notice}>
            Por segurança, sua conta só será confirmada quando você clicar no botão abaixo. Abrir esta página, por si só, não conclui a sessão no Envista.
          </div>
          <form action={confirmEmailAction} className={styles.form}>
            {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
            {code ? <input type="hidden" name="code" value={code} /> : null}
            <AuthSubmitButton
              className={`${styles.primary} ${styles.full}`}
              pendingText="Confirmando..."
            >
              Confirmar meu e-mail
            </AuthSubmitButton>
          </form>
        </>
      ) : (
        <>
          <div className={styles.error} role="alert">
            Este link de confirmação está incompleto. Solicite um novo e-mail de confirmação e use o link mais recente recebido.
          </div>
          <div className={styles.actions}>
            <Link className={`${styles.primary} ${styles.full}`} href="/register">
              Voltar ao cadastro
            </Link>
          </div>
        </>
      )}
      <div className={styles.links}>
        <Link href="/login">Já confirmou? Ir para o login</Link>
      </div>
    </AuthShell>
  );
}
