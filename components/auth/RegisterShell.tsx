import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Trophy, UsersRound, Zap } from "lucide-react";
import styles from "./RegisterShell.module.css";

type RegisterShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  phase?: "account" | "verify" | "profile" | "unavailable" | "login";
};

const milestones = [
  { label: "Conta", step: 1 },
  { label: "Verificação", step: 2 },
  { label: "Perfil", step: 3 },
];

export function RegisterShell({ title, description, children, phase = "account" }: RegisterShellProps) {
  const activeStep = phase === "profile" ? 3 : phase === "verify" ? 2 : 1;

  return (
    <main className={styles.page + " envista-auth-page"}>
      <div className={[styles.shell, phase === "verify" ? styles.verifyShell : "", phase === "profile" ? styles.profileShell : "", phase === "login" ? styles.loginShell : ""].filter(Boolean).join(" ")}>
        <aside className={[styles.brandPanel, phase === "login" ? styles.loginBrand : ""].filter(Boolean).join(" ")} aria-label="Sobre o Envista">
          <Link href="/" className={styles.brand} aria-label="Voltar à página inicial do Envista">
            <Image src="/brand/envista-symbol-gradient.svg" alt="" width={36} height={48} priority />
            <span>ENVISTA</span>
          </Link>
          <div className={[styles.brandCopy, phase === "login" ? styles.loginBrandCopy : ""].filter(Boolean).join(" ")}>
            <span className={styles.kicker}>IDEIAS QUE CONTINUAM</span>
            <h2>Do aprendizado à oportunidade, tudo no <em>mesmo lugar.</em></h2>
            <p>Aprenda, forme equipes, construa projetos, mostre sua evolução e conecte boas ideias às pessoas certas.</p>
            {phase === "login" ? <div className={styles.loginBenefits} aria-label="Etapas da jornada"><span><Zap size={17} aria-hidden="true" /> Aprenda</span><span><UsersRound size={17} aria-hidden="true" /> Construa</span><span><Trophy size={17} aria-hidden="true" /> Conecte</span></div> : <div className={styles.benefits} aria-label="Benefícios do Envista">
              <span><Zap size={20} aria-hidden="true" /><strong>Aprenda na prática</strong></span>
              <span><UsersRound size={20} aria-hidden="true" /><strong>Desenvolva projetos</strong></span>
              <span><Trophy size={20} aria-hidden="true" /><strong>Conecte-se a oportunidades</strong></span>
            </div>}
          </div>
          <div className={styles.brandEarth} aria-hidden="true" />
          {phase === "login" ? <span className={styles.loginBrandFooter}>useenvista.com.br</span> : null}
        </aside>

        <section className={[styles.formPanel, phase === "verify" ? styles.verifyPanel : "", phase === "profile" ? styles.profilePanel : "", phase === "login" ? styles.loginPanel : ""].filter(Boolean).join(" ")} aria-labelledby="register-title">
          <Link className={styles.mobileBrand} href="/" aria-label="Voltar à página inicial do Envista">
            <Image src="/brand/envista-symbol-gradient.svg" alt="" width={29} height={39} />
            <strong>ENVISTA</strong>
          </Link>
          {phase !== "unavailable" && phase !== "login" ? (
            <nav className={[styles.progress, phase === "verify" ? styles.verifyProgress : ""].filter(Boolean).join(" ")} aria-label="Etapas para começar a usar o Envista">
              {milestones.map(({ label, step }) => {
                const active = step === activeStep;
                const completed = step < activeStep;
                return (
                  <div
                    key={label}
                    className={[styles.progressStep, active ? styles.progressActive : "", completed ? styles.progressDone : ""].filter(Boolean).join(" ")}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className={styles.stepCircle}>{completed ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : step}</span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </nav>
          ) : null}
          <div className={[styles.formArea, phase === "verify" ? styles.verifyArea : "", phase === "profile" ? styles.profileArea : "", phase === "login" ? styles.loginArea : ""].filter(Boolean).join(" ")}>
            {phase !== "verify" ? (
              <div className={styles.intro}>
                {phase === "login" ? null : <span className={styles.formKicker}>SEU PRÓXIMO CAPÍTULO</span>}
                <h1 id="register-title">{title}</h1>
                <p>{description}</p>
              </div>
            ) : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
