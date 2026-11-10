import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleAlert, Inbox, Mail, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { resendSignupConfirmationAction } from "@/app/auth/register-product-action";
import styles from "./RegisterShell.module.css";

type VerificationStatus = "check-email" | "resent" | "resend-rate" | "resend-temporary";

export function RegisterEmailVerification({ status }: { status: VerificationStatus }) {
  const isRateLimited = status === "resend-rate";
  const isTemporaryFailure = status === "resend-temporary";
  const hasError = isRateLimited || isTemporaryFailure;
  const isResent = status === "resent";

  return (
    <section className={styles.verifyContent} aria-labelledby="register-title">
      <div className={styles.verifyHeading}>
        <div className={styles.verifyVisual} aria-hidden="true">
          <span className={styles.verifyVisualOrbit} />
          <span className={styles.verifyEnvelope}><MailCheck size={45} strokeWidth={1.45} /></span>
          <span className={styles.verifyVisualCheck}><Check size={15} strokeWidth={3} /></span>
        </div>
        <span className={styles.verifyEyebrow}>VERIFICAÇÃO DE E-MAIL · ETAPA 02/03</span>
        <h1 id="register-title">Agora é só confirmar <span>seu e-mail.</span></h1>
        <p>
          {isResent
            ? "Se houver uma conta aguardando confirmação, enviaremos um novo link para o endereço informado."
            : "Enviamos as instruções para o endereço usado no cadastro. Confirme o e-mail para ativar sua conta e continuar."}
        </p>
      </div>

      {isResent ? (
        <div className={styles.verifyNotice} role="status">
          <ShieldCheck size={18} aria-hidden="true" />
          <span><strong>Solicitação recebida.</strong> Confira sua caixa de entrada nos próximos minutos.</span>
        </div>
      ) : null}

      {hasError ? (
        <div className={styles.verifyError} role="alert">
          <CircleAlert size={19} aria-hidden="true" />
          <span>
            <strong>{isRateLimited ? "Muitas solicitações em sequência." : "Não foi possível reenviar agora."}</strong>
            {" "}{isRateLimited ? "Espere alguns minutos antes de tentar novamente." : "Tente novamente em instantes."}
          </span>
        </div>
      ) : null}

      <div className={styles.verifyGuide}>
        <div className={styles.verifyGuideHeading}>
          <span>O QUE FAZER AGORA</span>
          <span className={styles.verifyGuideCount}>01 — 03</span>
        </div>
        <ol>
          <li>
            <span className={styles.verifyGuideNumber}>01</span>
            <span><strong>Acesse seu e-mail</strong><small>Abra a caixa de entrada e procure pela mensagem do Envista.</small></span>
            <Inbox size={19} aria-hidden="true" />
          </li>
          <li>
            <span className={styles.verifyGuideNumber}>02</span>
            <span><strong>Confirme o endereço</strong><small>Clique no link de verificação recebido para ativar sua conta.</small></span>
            <Mail size={19} aria-hidden="true" />
          </li>
          <li>
            <span className={styles.verifyGuideNumber}>03</span>
            <span><strong>Continue sua jornada</strong><small>Volte ao Envista e entre para completar seu perfil.</small></span>
            <ArrowRight size={19} aria-hidden="true" />
          </li>
        </ol>
      </div>

      <div className={styles.verifyActions}>
        <Link href="/login" className={styles.verifyPrimary}>
          Já confirmei meu e-mail <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <p className={styles.verifySpamTip}>Não encontrou? Confira também as pastas Spam e Promoções.</p>

        <details className={styles.verifyResend} open={hasError}>
          <summary>
            <span><RefreshCw size={17} aria-hidden="true" /> Não recebeu o link?</span>
            <span className={styles.verifyResendLink}>Solicitar outro <ChevronDown size={15} aria-hidden="true" /></span>
          </summary>
          <div className={styles.verifyResendBody}>
            <p>Informe o mesmo endereço usado no cadastro para solicitar outro link de confirmação.</p>
            <form action={resendSignupConfirmationAction} className={styles.verifyResendForm}>
              <label htmlFor="resend-signup-email">E-mail do cadastro</label>
              <div className={styles.verifyInputWrap}>
                <Mail size={18} aria-hidden="true" />
                <input
                  id="resend-signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>
              <AuthSubmitButton className={styles.verifyResendButton} pendingText="Solicitando...">
                Reenviar confirmação <ArrowRight size={16} aria-hidden="true" />
              </AuthSubmitButton>
            </form>
          </div>
        </details>

        <Link href="/register" className={styles.verifyChangeEmail}>Prefere começar com outro e-mail?</Link>
      </div>
    </section>
  );
}
