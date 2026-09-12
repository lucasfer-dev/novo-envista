import Link from "next/link";
import { redirect } from "next/navigation";
import { establishRecoverySession } from "@/app/auth/email-actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default async function RecoverAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim().slice(0, 2048) : "";
  const code = typeof params.code === "string" ? params.code.trim().slice(0, 2048) : "";

  if (tokenHash || code) {
    await establishRecoverySession(tokenHash, code);
    redirect("/update-password");
  }

  return (
    <AuthShell
      title="Link de recuperação inválido"
      description="Não foi possível encontrar as credenciais necessárias para redefinir sua senha."
    >
      <div className={styles.error} role="alert">
        Este link de recuperação está incompleto. Solicite um novo e-mail e use sempre o link mais recente recebido.
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
