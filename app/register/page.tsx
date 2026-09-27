import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { RegisterPasswordFields } from "@/components/auth/RegisterPasswordFields";
import { BirthDateField } from "@/components/auth/BirthDateField";
import { registerProductAction, resendSignupConfirmationAction } from "@/app/auth/register-product-action";
import { isPublicSignupReady } from "@/lib/auth/signup-readiness";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Criar conta", description: "Crie sua conta no Envista." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const enabled = isPublicSignupReady();
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const errorMessage =
    error === "password" ? `Confira as senhas. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
      : error === "document" ? "Informe um CPF ou CNPJ válido."
      : error === "birth-date" ? "Informe uma data de nascimento válida."
      : error === "exists" ? "Já existe uma conta com esses dados. Tente entrar ou recuperar a senha."
      : error === "captcha" ? "Conclua a verificação de segurança e tente novamente."
      : error === "rate" ? "Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos."
      : error === "legal" ? "Para criar a conta, aceite os Termos de Uso e confirme que leu o Aviso de Privacidade."
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
      ) : status === "check-email" || status === "resent" || status === "resend-rate" || status === "resend-temporary" ? (
        <>
          <div className={status === "resend-temporary" ? styles.error : styles.success} role="status">
            {status === "check-email" ? (
              <><strong>E-mail de verificação enviado.</strong>{" "}Abra sua caixa de entrada e, se necessário, verifique Spam ou Promoções.</>
            ) : status === "resent" ? (
              <><strong>Novo e-mail solicitado.</strong>{" "}Se houver um cadastro pendente para esse endereço, uma nova confirmação será enviada.</>
            ) : status === "resend-rate" ? (
              <><strong>Aguarde um pouco.</strong>{" "}Houve muitas tentativas de reenvio em sequência. Tente novamente em alguns minutos.</>
            ) : (
              <><strong>Não conseguimos reenviar agora.</strong>{" "}Tente novamente em instantes.</>
            )}
          </div>
          <div className={styles.notice}>
            Sua conta só fica utilizável depois da confirmação do e-mail. Se o primeiro link não chegou ou expirou, solicite outro abaixo.
          </div>
          <form action={resendSignupConfirmationAction} className={styles.form}>
            <label>
              E-mail do cadastro
              <input type="email" name="email" autoComplete="email" maxLength={254} required />
            </label>
            <AuthSubmitButton className={`${styles.secondary} ${styles.full}`} pendingText="Reenviando...">
              Reenviar e-mail de confirmação
            </AuthSubmitButton>
          </form>
          <Link className={`${styles.primary} ${styles.full}`} href="/login">Já confirmei — entrar</Link>
          <div className={styles.links}>
            <Link href="/register">Usar outro e-mail</Link>
          </div>
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
              <BirthDateField />
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

            <div className={styles.checks}>
              <label className={styles.check}>
                <input type="checkbox" name="terms" required />
                <span>Li e aceito os <Link href="/terms" target="_blank" rel="noreferrer">Termos de Uso</Link>.</span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" name="privacy" required />
                <span>Li o <Link href="/privacy" target="_blank" rel="noreferrer">Aviso de Privacidade</Link> e entendo como meus dados são tratados. Esta confirmação não é consentimento genérico para qualquer finalidade.</span>
              </label>
            </div>

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
