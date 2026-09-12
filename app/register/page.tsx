import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { registerProductAction } from "@/app/auth/register-product-action";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const enabled = process.env.AUTH_SIGNUP_ENABLED === "true";
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";

  const errorMessage = error === "password"
    ? `Confira as senhas. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    : error === "cpf"
      ? "Informe um CPF válido."
      : error === "birthdate"
        ? "Informe uma data de nascimento válida."
        : error === "identity"
          ? "CPF e data de nascimento não correspondem ao cadastro consultado."
          : error === "cpf-status"
            ? "O CPF informado não está com situação cadastral regular."
            : error === "verification-unavailable"
              ? "A verificação de identidade está temporariamente indisponível. Tente novamente em instantes."
              : error === "captcha"
                ? "Conclua a verificação de segurança e tente novamente."
                : error === "rate"
                  ? "Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos."
                  : error === "temporary"
                    ? "O cadastro está temporariamente indisponível. Tente novamente em instantes."
                    : error
                      ? "Revise os dados informados."
                      : "";

  return (
    <AuthShell title="Criar conta" description="Crie sua conta para aprender, construir projetos, formar equipes ou descobrir iniciativas no Envista.">
      {!enabled || status === "closed" ? (
        <><div className={styles.notice}>O cadastro está temporariamente fechado. Contas existentes continuam podendo entrar normalmente.</div><div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link></div></>
      ) : status === "check-email" ? (
        <><div className={styles.success}>Confira seu e-mail para concluir a criação da conta.</div><Link className={`${styles.primary} ${styles.full}`} href="/login">Voltar ao login</Link></>
      ) : (
        <>
          {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
          <form action={registerProductAction} className={styles.form}>
            <label>Nome de exibição<input name="display_name" autoComplete="name" maxLength={100} required /></label>
            <label>Tipo de conta<select name="role" defaultValue="participant" required><option value="participant">Participante / aluno</option><option value="investor">Investidor</option></select><span className={styles.muted}>Contas de investidor precisam de verificação antes de iniciar contatos com projetos.</span></label>
            <label>E-mail<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
            <label>CPF<input type="text" name="cpf" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" required /><span className={styles.muted}>Obrigatório para verificar a identidade e também disponível como alternativa ao e-mail no login. O CPF não aparece no seu perfil.</span></label>
            <label>Data de nascimento<input type="date" name="birth_date" autoComplete="bday" required /><span className={styles.muted}>Usada para conferir a correspondência com o CPF e definir as proteções adequadas à idade. A data completa não aparece no perfil.</span></label>
            <div className={styles.notice}>Antes de criar a conta, CPF e data de nascimento são conferidos com a base da Receita Federal por meio da API oficial Consulta CPF do Serpro.</div>
            <label>Senha<input type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /><span className={styles.muted}>Use uma senha longa e exclusiva, com pelo menos {MIN_PASSWORD_LENGTH} caracteres.</span></label>
            <label>Confirmar senha<input type="password" name="password_confirmation" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label>
            <div className={styles.captcha}><AuthCaptcha action="register" /></div>
            <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Verificando e criando conta...">Criar conta</AuthSubmitButton>
          </form>
          <div className={styles.links}><Link href="/login">Já tenho conta</Link></div>
        </>
      )}
    </AuthShell>
  );
}
