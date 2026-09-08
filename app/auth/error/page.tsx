import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flow = typeof params.flow === "string" ? params.flow : "confirmation";
  const recovery = flow === "recovery";

  const title = recovery
    ? "Não foi possível abrir o link de recuperação"
    : "Não foi possível concluir a autenticação";
  const description = recovery
    ? "O link pode ter expirado, já ter sido usado ou não corresponder mais à sessão de recuperação."
    : "O link pode ter expirado, já ter sido usado ou não corresponder à sessão atual.";

  return (
    <AuthShell title={title} description={description}>
      <div className={styles.notice}>
        Por segurança, o Envista não exibe detalhes internos do token ou da conta. Solicite um novo link e use sempre o e-mail mais recente recebido.
      </div>
      <div className={styles.actions}>
        {recovery ? (
          <Link className={`${styles.primary} ${styles.full}`} href="/forgot-password">
            Enviar novo link de recuperação
          </Link>
        ) : (
          <Link className={`${styles.primary} ${styles.full}`} href="/login">
            Voltar ao login
          </Link>
        )}
        <Link className={`${styles.secondary} ${styles.full}`} href={recovery ? "/login" : "/register"}>
          {recovery ? "Voltar ao login" : "Criar uma conta"}
        </Link>
      </div>
    </AuthShell>
  );
}
