import type { Metadata } from "next";
import Link from "next/link";
import { authStyles as styles } from "@/components/auth/AuthShell";
import { RegisterShell } from "@/components/auth/RegisterShell";
import registerStyles from "@/components/auth/RegisterShell.module.css";
import { ArrowRight, Building2, CalendarDays, CircleCheck, GraduationCap, Mail, UserRound } from "lucide-react";
import { PrivateDocumentField } from "@/components/auth/PrivateDocumentField";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { RegisterPasswordFields } from "@/components/auth/RegisterPasswordFields";
import { BirthDateField } from "@/components/auth/BirthDateField";
import { registerProductAction } from "@/app/auth/register-product-action";
import { RegisterEmailVerification } from "@/components/auth/RegisterEmailVerification";
import { isPublicSignupReady } from "@/lib/auth/signup-readiness";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Criar conta", description: "Crie sua conta no Envista." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const enabled = isPublicSignupReady();
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const errorMessage =
    error === "password" ? `Confira as senhas. Use entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`
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
    <RegisterShell
      title="Crie sua conta"
      description="Entre no Envista para aprender, construir projetos e se conectar a oportunidades."
      phase={!enabled || status === "closed" ? "unavailable" : ["check-email", "resent", "resend-rate", "resend-temporary"].includes(status) ? "verify" : "account"}
    >
      {!enabled || status === "closed" ? (
        <>
          <div className={styles.notice}>O cadastro está temporariamente fechado. Contas existentes continuam podendo entrar normalmente.</div>
          <div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link></div>
        </>
      ) : status === "check-email" || status === "resent" || status === "resend-rate" || status === "resend-temporary" ? (
        <RegisterEmailVerification
          status={status === "resent" || status === "resend-rate" || status === "resend-temporary" ? status : "check-email"}
        />
      ) : (
        <>
          {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
          <form action={registerProductAction} className={styles.form}>
            <fieldset className={styles.roleFieldset}>
              <legend>Como você quer usar o Envista?</legend>
              <div className={styles.roleGrid}>
                <label className={styles.roleCard}>
                  <input type="radio" name="role" value="participant" defaultChecked required />
                  <span className={[styles.roleCardBody, registerStyles.roleCardBody].join(" ")}>
                    <GraduationCap className={registerStyles.roleIcon} size={24} aria-hidden="true" />
                    <span className={registerStyles.roleText}>
                      <strong>Participante / aluno</strong>
                      <small>Aprender, criar projetos, formar equipes e participar da comunidade.</small>
                    </span>
                    <CircleCheck className={registerStyles.roleCheckedIcon} size={18} aria-hidden="true" />
                  </span>
                </label>
                <label className={styles.roleCard}>
                  <input type="radio" name="role" value="investor" required />
                  <span className={[styles.roleCardBody, registerStyles.roleCardBody].join(" ")}>
                    <Building2 className={registerStyles.roleIcon} size={24} aria-hidden="true" />
                    <span className={registerStyles.roleText}>
                      <strong>Investidor / organização</strong>
                      <small>Explorar projetos, acompanhar oportunidades e se conectar com equipes.</small>
                    </span>
                    <CircleCheck className={registerStyles.roleCheckedIcon} size={18} aria-hidden="true" />
                  </span>
                </label>
              </div>
            </fieldset>

            <div className={styles.grid2}>
              <div className={registerStyles.fieldWithIcon}>
                <label>
                  Nome completo
                  <input name="display_name" autoComplete="name" maxLength={100} placeholder="Digite seu nome completo" required />
                </label>
                <UserRound className={registerStyles.fieldIcon} aria-hidden="true" />
              </div>
              <div className={registerStyles.fieldWithIcon}>
                <BirthDateField />
                <CalendarDays className={registerStyles.fieldIcon} aria-hidden="true" />
              </div>
            </div>

            <div className={registerStyles.fieldWithIcon}>
              <label>
                E-mail
                <input type="email" name="email" autoComplete="email" maxLength={254} placeholder="Digite seu e-mail" required />
                <span className={styles.muted}>Você receberá um e-mail para confirmar a conta.</span>
              </label>
              <Mail className={registerStyles.fieldIcon} aria-hidden="true" />
            </div>

            <PrivateDocumentField />

            <RegisterPasswordFields minLength={MIN_PASSWORD_LENGTH} leadingIcons />

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

            <AuthSubmitButton className={[styles.primary, styles.full, registerStyles.submitButton].join(" ")} pendingText="Criando conta...">
              Criar minha conta <ArrowRight size={18} aria-hidden="true" />
            </AuthSubmitButton>
          </form>

          <div className={[styles.authFooterCentered, registerStyles.authFooter].join(" ")}>
            Já possui uma conta? <Link className={styles.inlineLink} href="/login">Entrar</Link>
          </div>
        </>
      )}
    </RegisterShell>
  );
}
