import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { registerProductAction } from "@/app/auth/register-product-action";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Envista e transforme aprendizado, projetos e conexões em oportunidades.",
};

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
    <AuthShell
      wide
      title="Criar conta"
      description="Configure sua conta, valide sua identidade e comece sua jornada no Envista."
    >
      {!enabled || status === "closed" ? (
        <>
          <div className={styles.notice}>O cadastro está temporariamente fechado. Contas existentes continuam podendo entrar normalmente.</div>
          <div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link></div>
        </>
      ) : status === "check-email" ? (
        <>
          <div className={styles.success}>Confira seu e-mail para concluir a criação da conta.</div>
          <div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Voltar ao login</Link></div>
        </>
      ) : (
        <>
          {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
          <form action={registerProductAction} className={styles.form}>
            <section className={styles.formSection}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionIndex}>01</span>
                <span className={styles.sectionCopy}>
                  <strong>Sua conta</strong>
                  <small>Como você vai entrar e aparecer dentro do Envista.</small>
                </span>
              </div>
              <div className={styles.grid2}>
                <label>Nome de exibição<input name="display_name" autoComplete="name" maxLength={100} required /></label>
                <label>
                  Tipo de conta
                  <select name="role" defaultValue="participant" required>
                    <option value="participant">Participante / aluno</option>
                    <option value="investor">Investidor</option>
                  </select>
                  <span className={styles.muted}>Investidores passam por uma etapa adicional de verificação antes de iniciar contatos.</span>
                </label>
              </div>
              <label>E-mail<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionIndex}>02</span>
                <span className={styles.sectionCopy}>
                  <strong>Verificação de identidade</strong>
                  <small>Confirma que CPF e data de nascimento pertencem ao mesmo cadastro.</small>
                </span>
              </div>
              <div className={styles.grid2}>
                <label>
                  CPF
                  <input type="text" name="cpf" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" required />
                  <span className={styles.muted}>O CPF não aparece no seu perfil e também pode ser usado para entrar.</span>
                </label>
                <label>
                  Data de nascimento
                  <input type="date" name="birth_date" autoComplete="bday" required />
                  <span className={styles.muted}>Usada para conferir o CPF e aplicar as proteções adequadas à idade.</span>
                </label>
              </div>
              <div className={styles.notice}>Os dados são conferidos com a base da Receita Federal por meio da Consulta CPF oficial do Serpro antes da criação da conta.</div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionIndex}>03</span>
                <span className={styles.sectionCopy}>
                  <strong>Segurança</strong>
                  <small>Crie uma senha longa e exclusiva para proteger sua conta.</small>
                </span>
              </div>
              <div className={styles.grid2}>
                <label>
                  Senha
                  <input type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required />
                  <span className={styles.muted}>Pelo menos {MIN_PASSWORD_LENGTH} caracteres.</span>
                </label>
                <label>Confirmar senha<input type="password" name="password_confirmation" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label>
              </div>
              <div className={styles.captcha}><AuthCaptcha action="register" /></div>
              <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Verificando e criando conta...">Criar conta</AuthSubmitButton>
            </section>
          </form>

          <div className={styles.authFooter}>
            <span className={styles.footerPrompt}>Já faz parte do Envista?</span>
            <Link className={`${styles.secondary} ${styles.full}`} href="/login">Entrar</Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
