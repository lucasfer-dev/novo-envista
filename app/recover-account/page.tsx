import Link from "next/link";
import { beginRecoveryAction } from "@/app/auth/email-actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export default async function RecoverAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim() : "";

  return (
    <AuthShell
      title="Redefinição de senha"
      description="Recebemos uma solicitação para redefinir a senha da sua conta Envista."
    >
      {tokenHash ? (
        <>
          <div className={styles.notice}>
            Sua senha ainda não foi alterada. Clique em continuar para validar este link e abrir a página segura onde você poderá criar uma nova senha.
          </div>
          <form action={beginRecoveryAction} className={styles.form}>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <AuthSubmitButton
              className={`${styles.primary} ${styles.full}`}
              pendingText="Validando..."
            >
              Continuar para criar nova senha
            </AuthSubmitButton>
          </form>
        </>
      ) : (
        <>
          <div className={styles.error} role="alert">
            Este link de recuperação está incompleto. Solicite um novo e-mail e use sempre o link mais recente recebido.
          </div>
          <div className={styles.actions}>
            <Link className={`${styles.primary} ${styles.full}`} href="/forgot-password">
              Enviar novo link de recuperação
            </Link>
          </div>
        </>
      )}
      <div className={styles.links}>
        <Link href="/login">Voltar ao login</Link>
      </div>
    </AuthShell>
  );
}
