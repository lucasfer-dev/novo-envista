import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { registerProductAction } from "@/app/auth/register-product-action";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Criar conta", description: "Crie sua conta no Envista." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const enabled = process.env.AUTH_SIGNUP_ENABLED === "true";
  const error = typeof params.error === "string" ? params.error : "";
  const status = typeof params.status === "string" ? params.status : "";
  const errorMessage = error === "password" ? `Confira as senhas. Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` : error === "captcha" ? "Conclua a verificação de segurança e tente novamente." : error === "rate" ? "Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos." : error === "temporary" ? "O cadastro está temporariamente indisponível. Tente novamente em instantes." : error ? "Revise os dados informados." : "";

  return (
    <AuthShell wide title="Criar conta" description="Entre no ecossistema para aprender, formar equipes, construir projetos e criar oportunidades.">
      {!enabled || status === "closed" ? <><div className={styles.notice}>O cadastro está temporariamente fechado. Contas existentes continuam podendo entrar normalmente.</div><div className={styles.actions}><Link className={`${styles.primary} ${styles.full}`} href="/login">Já tenho uma conta</Link></div></> : status === "check-email" ? <><div className={styles.success}>Confira seu e-mail para concluir a criação da conta.</div><Link className={`${styles.primary} ${styles.full}`} href="/login">Voltar ao login</Link></> : <>
        {errorMessage ? <div className={styles.error} role="alert">{errorMessage}</div> : null}
        <form action={registerProductAction} className={styles.form}>
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}><span className={styles.sectionIndex}>01</span><div><strong>Sua conta</strong><div className={styles.sectionCopy}>Como você vai aparecer e usar o Envista.</div></div></div>
            <div className={styles.grid2}><label>Nome de exibição<input name="display_name" autoComplete="name" maxLength={100} required /></label><label>Tipo de conta<select name="role" defaultValue="participant" required><option value="participant">Participante / aluno</option><option value="investor">Investidor</option></select></label></div>
            <label>E-mail<input type="email" name="email" autoComplete="email" maxLength={254} required /><span className={styles.muted}>Usaremos esse endereço para confirmar a conta e recuperar acesso.</span></label>
          </section>
          <div className={styles.divider} />
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}><span className={styles.sectionIndex}>02</span><div><strong>Segurança</strong><div className={styles.sectionCopy}>Crie uma senha longa e exclusiva.</div></div></div>
            <div className={styles.grid2}><label>Senha<input type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label><label>Confirmar senha<input type="password" name="password_confirmation" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label></div>
            <span className={styles.muted}>Use pelo menos {MIN_PASSWORD_LENGTH} caracteres. A verificação de identidade por CPF está pausada enquanto avaliamos um provedor adequado.</span>
          </section>
          <div className={styles.captcha}><AuthCaptcha action="register" /></div>
          <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Criando conta...">Criar conta</AuthSubmitButton>
        </form>
        <div className={styles.authFooter}><span className={styles.footerPrompt}>Já faz parte do Envista?</span><Link className={styles.secondary} href="/login">Entrar</Link></div>
      </>}
    </AuthShell>
  );
}
