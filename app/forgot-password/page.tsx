import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { forgotPasswordAction } from "@/app/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sent = params.status === "sent";

  return (
    <AuthShell title="Recuperar senha" description="Informe seu e-mail. A resposta não revela se existe ou não uma conta cadastrada.">
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
          <button className={`${styles.primary} ${styles.full}`} type="submit">Enviar instruções</button>
        </form>
      )}
      <div className={styles.links}><Link href="/login">Voltar ao login</Link></div>
    </AuthShell>
  );
}
