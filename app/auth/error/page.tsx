import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function AuthErrorPage() {
  return (
    <AuthShell title="Não foi possível concluir a autenticação" description="O link pode ter expirado, já ter sido usado ou não corresponder à sessão atual.">
      <div className={styles.notice}>
        Por segurança, esta página não exibe detalhes internos do token ou da conta.
      </div>
      <div className={styles.actions}>
        <Link className={`${styles.primary} ${styles.full}`} href="/login">Voltar ao login</Link>
      </div>
    </AuthShell>
  );
}
