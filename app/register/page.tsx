import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { RegisterPasswordFields } from "@/components/auth/RegisterPasswordFields";
import { registerProductAction } from "@/app/auth/register-product-action";
import { isPublicSignupReady } from "@/lib/auth/signup-readiness";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Criar conta", description: "Crie sua conta no Envista." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const enabled = isPublicSignupReady();
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const sentTo = typeof params.email === "string" ? params.email.slice(0, 254) : "";
  const errorMessage =
    error === "password" ? `Confira as senhas. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
      : error === "document" ? "Informe um CPF ou CNPJ válido."
      : error === "birth-date" ? "Informe uma data de nascimento válida."
      : error === "exists" ? "Já existe uma conta com esses dados. Tente entrar ou recuperar a senha."
      : error === "captcha" ? "Conclua a verificação de segurança e tente novamente."
      : error === "rate" ? "Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos."
      : error === "temporary" ? "O cadastro está temporariamente indisponível. Tente novamente em instantes."
      : error ? "Revise os dados informados."
      : "";

  return (
    <AuthShell
      wide
      title="Crie sua conta"
      description="Entre no Envista para aprender, construir projetos e se conectar a oportunidades."
    >
      {!enabled || status === "closed" ? (
        <>
          <div className={styles.notice}>O cadastro está temporariamente fechado. Contas existentes continuam podendo entrar normalmente.</div>
          <div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link></div>
        </>
      ) : status === "check-email" ? (
        <>
          <div className={styles.success} role="status">
            <strong>E-mail de verificação enviado.</strong>{" "}
            {sentTo ? <>Enviamos a confirmação para <strong>{sentTo}</strong>. </> : null}
            Abra sua caixa de entrada e, se necessário, verifique Spam ou Promoções.
          </div>
          <div className={styles.notice}>Depois de confirmar o e-mail, volte ao Envista e conclua seu perfil.</div>
          <Link className={`${styles.primary} ${styles.full}`} href="/login">Ir para o login</Link>
        </>
      ) : (
        <>
          {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
          <form action={registerProductAction} className={styles.form}>
            <fieldset className={styles.roleFieldset}>
              <legend>Como você quer usar o Envista?</legend>
              <div className={styles.roleGrid}>
                <label className={styles.roleCard}>
                  <input type="radio" name="role" value="participant" defaultChecked required />
                  <span className={styles.roleCardBody}>
                    <strong>Participante / aluno</strong>
                    <small>Aprender, criar projetos, formar equipes e participar da comunidade.</small>
                  </span>
                </label>
                <label className={styles.roleCard}>
                  <input type="radio" name="role" value="investor" required />
                  <span className={styles.roleCardBody}>
                    <strong>Investidor / organização</strong>
                    <small>Explorar projetos, acompanhar oportunidades e se conectar com equipes.</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className={styles.grid2}>
              <label>
                Nome completo
                <input name="display_name" autoComplete="name" maxLength={100} required />
              </label>
              <label>
                Data de nascimento
                <input type="date" name="birth_date" autoComplete="bday" required />
                <span className={styles.muted}>Usamos a data somente para definir a faixa etária e aplicar as proteções adequadas. A data completa não fica salva.</span>
              </label>
            </div>

            <label>
              E-mail
              <input type="email" name="email" autoComplete="email" maxLength={254} required />
              <span className={styles.muted}>Você receberá um e-mail para confirmar a conta.</span>
            </label>

            <label>
              CPF ou CNPJ
              <input
                type="text"
                name="document"
                inputMode="numeric"
                autoComplete="off"
                maxLength={18}
                placeholder="CPF ou CNPJ"
                required
              />
              <span className={styles.muted}>Obrigatório para identificação e login. O número não fica visível no perfil e é armazenado somente em formato protegido.</span>
            </label>

            <RegisterPasswordFields minLength={MIN_PASSWORD_LENGTH} />

            <div className={styles.captcha}><AuthCaptcha action="register" /></div>

            <p className={styles.legalHint}>
              Antes de continuar, consulte os <Link href="/terms" target="_blank">Termos de Uso</Link> e o{" "}
              <Link href="/privacy" target="_blank">Aviso de Privacidade</Link>. A aceitação formal é registrada na conclusão do perfil.
            </p>

            <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Criando conta...">
              Criar minha conta
            </AuthSubmitButton>
          </form>

          <div className={styles.authFooterCentered}>
            Já possui uma conta? <Link className={styles.inlineLink} href="/login">Entrar</Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
