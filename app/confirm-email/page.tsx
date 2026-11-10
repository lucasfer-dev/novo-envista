import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { confirmEmailAction } from "@/app/auth/email-actions";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { createClient } from "@/lib/supabase/server";
import styles from "./ConfirmEmail.module.css";

export const metadata: Metadata = {
  title: "Confirmar e-mail | Envista",
  description: "Confirme seu e-mail para começar a construir seu projeto no Envista.",
};

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim().slice(0, 2048) : "";
  const code = typeof params.code === "string" ? params.code.trim().slice(0, 2048) : "";
  const type = typeof params.type === "string" ? params.type.trim().toLowerCase().slice(0, 64) : "";
  const requestedSuccess = params.status === "confirmed";
  const validType = tokenHash ? type === "email" : !type || type === "email";
  const hasCredential = Boolean((tokenHash || code) && !(tokenHash && code) && validType);

  // The query string is not proof of verification. Only show the final
  // success screen after checking the authenticated user with Supabase.
  let confirmed = false;
  if (requestedSuccess) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      confirmed = !error && Boolean(data.user?.email_confirmed_at);
    } catch {
      confirmed = false;
    }
  }

  const needsLogin = requestedSuccess && !confirmed;
  const invalid = !confirmed && !hasCredential && !needsLogin;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.brandPanel} aria-label="Envista, ecossistema de inovação">
          <Link href="/" className={styles.brand} aria-label="Voltar ao Envista">
            <Image src="/brand/envista-symbol-gradient.svg" alt="" width={37} height={50} priority />
            <span>ENVISTA</span>
          </Link>

          <div className={styles.brandStory}>
            <span className={styles.overline}>IDEIAS QUE CONTINUAM</span>
            <h2>O primeiro passo para ir <em>além.</em></h2>
            <p>Uma ideia pode mudar tudo. Estamos aqui para ajudar você a transformar a sua em algo real.</p>
            <div className={styles.brandChips} aria-label="Jornada de inovação">
              <span>Ideias</span><ArrowRight size={13} aria-hidden="true" /><span>Projetos</span>
              <ArrowRight size={13} aria-hidden="true" /><span>Oportunidades</span>
            </div>
          </div>
          <div className={styles.globe} aria-hidden="true" />
          <div className={styles.brandFooter}>ECOSSISTEMA DE INOVAÇÃO <span>·</span> 2026</div>
        </aside>

        <section className={styles.panel} aria-labelledby="confirm-heading">
          <div className={styles.mobileBrand}>
            <Link href="/" aria-label="Voltar ao Envista">
              <Image src="/brand/envista-symbol-gradient.svg" alt="" width={30} height={41} />
              <strong>ENVISTA</strong>
            </Link>
          </div>

          <header className={styles.topline}>
            <span className={styles.toplineLabel}>SUA JORNADA NO ENVISTA</span>
            <span className={styles.toplineCount}>ETAPA 02 <span>/</span> 03</span>
          </header>

          <ol className={styles.steps} aria-label="Etapas de criação da conta">
            <li className={styles.done}>
              <span className={styles.stepIcon}><Check size={17} strokeWidth={2.8} aria-hidden="true" /></span>
              <span>Conta criada</span>
            </li>
            <li className={confirmed ? styles.done : styles.active} aria-current={!confirmed ? "step" : undefined}>
              <span className={styles.stepIcon}>{confirmed ? <Check size={17} strokeWidth={2.8} aria-hidden="true" /> : "2"}</span>
              <span>Verificação</span>
            </li>
            <li>
              <span className={styles.stepIcon}>3</span>
              <span>Seu perfil</span>
            </li>
          </ol>

          <div className={styles.content}>
            <div className={styles.orbit} aria-hidden="true">
              <div className={styles.orbitRing} />
              <span className={styles.mailGlyph}>
                {confirmed ? <CheckCircle2 size={44} strokeWidth={1.7} /> :
                  invalid || needsLogin ? <CircleAlert size={44} strokeWidth={1.7} /> :
                  <MailCheck size={44} strokeWidth={1.7} />}
              </span>
              <span className={styles.orbitSpark}><Sparkles size={17} aria-hidden="true" /></span>
            </div>

            <span className={styles.eyebrow}>
              {confirmed ? "VERIFICAÇÃO CONCLUÍDA" : needsLogin ? "CONFIRMAÇÃO · ACESSO À CONTA" : invalid ? "PRECISAMOS DE UM NOVO LINK" : "QUASE LÁ · CONFIRME SUA CONTA"}
            </span>

            {confirmed ? (
              <>
                <h1 id="confirm-heading" aria-label="E-mail confirmado">E-mail <em>confirmado!</em></h1>
                <p className={styles.description}>Tudo pronto! Seu endereço foi verificado com segurança. Agora você pode completar seu perfil e seguir com seus projetos.</p>
                <div className={styles.message} role="status">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span><strong>Conta ativada.</strong> Sua sessão foi validada e você já pode continuar.</span>
                </div>
                <Link className={styles.primaryAction} href="/onboarding">
                  Continuar no Envista <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </>
            ) : hasCredential ? (
              <>
                <h1 id="confirm-heading">Confirme seu <em>e-mail.</em></h1>
                <p className={styles.description}>Seu cadastro está quase pronto! Confirme seu endereço para ativar sua conta e começar a construir no Envista.</p>
                <div className={styles.message}>
                  <LockKeyhole size={19} aria-hidden="true" />
                  <span>Por segurança, sua conta só será ativada <strong>depois que você clicar em confirmar.</strong> Apenas abrir esta página não confirma seu e-mail.</span>
                </div>
                <form action={confirmEmailAction} className={styles.confirmForm}>
                  {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
                  {code ? <input type="hidden" name="code" value={code} /> : null}
                  {type ? <input type="hidden" name="type" value={type} /> : null}
                  <AuthSubmitButton className={styles.primaryAction} pendingText="Confirmando com segurança...">
                    Confirmar meu e-mail <ArrowRight size={19} aria-hidden="true" />
                  </AuthSubmitButton>
                </form>
              </>
            ) : needsLogin ? (
              <>
                <h1 id="confirm-heading">Vamos continuar <em>pelo login.</em></h1>
                <p className={styles.description}>Não encontramos uma sessão ativa nesta página. Se você já confirmou seu endereço, entre na sua conta para continuar.</p>
                <div className={styles.message} role="status">
                  <LockKeyhole size={19} aria-hidden="true" />
                  <span>A confirmação pode já ter sido concluída. Para proteger sua conta, não exibimos sucesso sem uma sessão verificada.</span>
                </div>
                <Link href="/login" className={styles.primaryAction}>
                  Entrar no Envista <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <h1 id="confirm-heading">Não conseguimos abrir <em>esse link.</em></h1>
                <p className={styles.description}>O link está incompleto, é inválido ou já foi utilizado. Para continuar, solicite outro e-mail de confirmação.</p>
                <div className={styles.errorMessage} role="alert">
                  <CircleAlert size={19} aria-hidden="true" />
                  <span>Solicite um novo link usando o mesmo endereço do cadastro e confira a mensagem mais recente.</span>
                </div>
                <Link href="/register?status=check-email" className={styles.primaryAction}>
                  Solicitar outro e-mail <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </>
            )}

            <div className={styles.bottomRow}>
              <div className={styles.securityNote}><ShieldCheck size={16} aria-hidden="true" /> Confirmação protegida pelo Envista</div>
              <Link href="/login">Já confirmou? Entrar <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </div>

          <div className={styles.endNote}>
            <Clock3 size={15} aria-hidden="true" />
            <span>Se o link expirou, você pode solicitar outro a qualquer momento.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
