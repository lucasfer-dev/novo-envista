import Link from "next/link";
import { beginRecoveryAction } from "@/app/auth/email-actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export const dynamic = "force-dynamic";

export default async function RecoverAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim().slice(0, 2048) : "";
  const code = typeof params.code === "string" ? params.code.trim().slice(0, 2048) : "";
  const type = typeof params.type === "string" ? params.type.trim().toLowerCase().slice(0, 64) : "";
  const validType = tokenHash ? type === "recovery" : !type || type === "recovery";
  const hasCredential = Boolean((tokenHash || code) && !(tokenHash && code) && validType);

  if (!hasCredential) {
    return (
      <AuthShell
        title="Link de recuperação inválido"
        description="Não foi possível encontrar uma solicitação válida para redefinir sua senha."
      >
        <div className={styles.error} role="alert">
          Este link de recuperação está incompleto ou não corresponde a uma recuperação de senha. Solicite um novo e-mail e use sempre o link mais recente recebido.
        </div>
        <div className={styles.actions}>
          <Link className={`${styles.primary} ${styles.full}`} href="/forgot-password">
            Enviar novo link de recuperação
          </Link>
        </div>
        <div className={styles.links}>
          <Link href="/login">Voltar ao login</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Redefinição de senha"
      description="Valide o link de recuperação para continuar e criar uma nova senha."
    >
      <div className={styles.notice}>
        O link ainda não foi consumido. Clique abaixo para validar esta solicitação e continuar com segurança.
      </div>
      <form action={beginRecoveryAction} className={styles.form}>
        {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
        {code ? <input type="hidden" name="code" value={code} /> : null}
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Validando link...">
          Continuar para criar nova senha
        </AuthSubmitButton>
      </form>
      <div className={styles.links}>
        <Link href="/login">Voltar ao login</Link>
      </div>
    </AuthShell>
  );
}
