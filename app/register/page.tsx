import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { registerAction } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const enabled = process.env.AUTH_SIGNUP_ENABLED === "true";
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";

  return (
    <AuthShell title="Criar conta" description="Contas reais serão protegidas pelo Supabase Auth e pelas políticas RLS do Envista.">
      {!enabled || status === "closed" ? (
        <>
          <div className={styles.notice}>
            O cadastro público está temporariamente fechado enquanto finalizamos os documentos de privacidade,
            a entrega de e-mails e os controles de proteção para menores. Isso é intencional.
          </div>
          <div className={styles.actions}>
            <Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link>
          </div>
        </>
      ) : status === "check-email" ? (
        <>
          <div className={styles.success}>
            Se o cadastro puder ser concluído, enviaremos as próximas instruções para o e-mail informado.
          </div>
          <Link className={`${styles.primary} ${styles.full}`} href="/login">Voltar ao login</Link>
        </>
      ) : (
        <>
          {error ? (
            <div className={styles.error} role="alert">
              {error === "password"
                ? "Confira as senhas. Use pelo menos 10 caracteres."
                : "Revise os dados informados."}
            </div>
          ) : null}
          <form action={registerAction} className={styles.form}>
            <label>
              Nome de exibição
              <input name="display_name" autoComplete="name" maxLength={100} required />
            </label>
            <label>
              Tipo de conta
              <select name="role" defaultValue="participant" required>
                <option value="participant">Participante / aluno</option>
                <option value="investor">Investidor</option>
              </select>
            </label>
            <label>
              E-mail
              <input type="email" name="email" autoComplete="email" maxLength={254} required />
            </label>
            <label>
              Senha
              <input type="password" name="password" autoComplete="new-password" minLength={10} maxLength={128} required />
            </label>
            <label>
              Confirmar senha
              <input type="password" name="password_confirmation" autoComplete="new-password" minLength={10} maxLength={128} required />
            </label>
            <button className={`${styles.primary} ${styles.full}`} type="submit">Criar conta</button>
          </form>
          <div className={styles.links}><Link href="/login">Já tenho conta</Link></div>
        </>
      )}
    </AuthShell>
  );
}
