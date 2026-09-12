import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Auth.module.css";

export { styles as authStyles };

export function AuthShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />

      <div className={`${styles.shell} ${wide ? styles.wide : ""}`}>
        <aside className={styles.brandPanel} aria-label="Envista">
          <Link className={styles.brand} href="/">
            <span className={styles.logoBox}>
              <Image src="/envista-logo.png" alt="" width={44} height={44} priority />
            </span>
            <span>Envista</span>
          </Link>

          <div className={styles.brandCopy}>
            <span className={styles.brandKicker}>IDEIAS QUE CONTINUAM</span>
            <h2>Do aprendizado à oportunidade, tudo no mesmo lugar.</h2>
            <p>
              Crie projetos, forme equipes, acompanhe sua evolução e conecte boas ideias a quem pode impulsioná-las.
            </p>
          </div>

          <div className={styles.brandPoints} aria-label="Jornada Envista">
            <span><i />Aprenda</span>
            <span><i />Construa</span>
            <span><i />Conecte</span>
          </div>

          <span className={styles.brandFooter}>useenvista.com.br</span>
        </aside>

        <div className={styles.formPanel}>
          <Link className={styles.mobileBrand} href="/">
            <span className={styles.logoBox}>
              <Image src="/envista-logo.png" alt="" width={36} height={36} priority />
            </span>
            <span>Envista</span>
          </Link>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardAccent} aria-hidden="true" />
              <h1>{title}</h1>
              {description ? <p className={styles.lead}>{description}</p> : null}
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
