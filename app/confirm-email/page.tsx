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

  return (
    <AuthShell
      title="Confirme seu e-mail"
      description="Falta só uma etapa para ativar sua conta e continuar no Envista."
    >
      {tokenHash ? (
        <>
          <div className={styles.notice}>
            Por segurança, sua conta só será confirmada quando você clicar no botão abaixo. Abrir este link, por si só, não confirma o e-mail.
          </div>
          <form action={confirmEmailAction} className={styles.form}>
            <input type="hidden" name="token_hash" value={tokenHash} />
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
