import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./Auth.module.css";

export { styles as authStyles };

export function AuthShell({ title, description, children, wide = false }: { title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <main className={`${styles.page} envista-auth-page`}>
      <div className={`${styles.shell} ${wide ? styles.wide : ""}`}>
        <aside className={`${styles.brandPanel} envista-auth-brand`}>
          <Link className={`${styles.brand} envista-brand-lockup`} href="/" aria-label="Ir para a página inicial do Envista">
            <Image src="/brand/envista-symbol-white.svg" alt="" width={31} height={42} priority />
            <strong>Envista</strong>
          </Link>
          <div className={styles.brandCopy}>
            <span className={styles.brandKicker}>IDEIAS QUE CONTINUAM</span>
            <h2>Do aprendizado à oportunidade, tudo no mesmo lugar.</h2>
            <p>Aprenda, forme equipes, construa projetos, mostre evolução e conecte boas ideias às pessoas certas.</p>
            <div className={styles.brandPoints}><span>Aprenda</span><span>Construa</span><span>Conecte</span></div>
          </div>
          <span className={styles.brandFooter}>useenvista.com.br</span>
        </aside>
        <section className={styles.formPanel}>
          <Link className={`${styles.mobileBrand} envista-auth-mobile-brand envista-brand-lockup`} href="/" aria-label="Ir para a página inicial do Envista">
            <Image src="/brand/envista-symbol-gradient.svg" alt="" width={25} height={34} />
            <strong>Envista</strong>
          </Link>
          <div className={styles.card}>
            <div className={styles.cardAccent} />
            <h1>{title}</h1>
            {description ? <p className={styles.lead}>{description}</p> : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
