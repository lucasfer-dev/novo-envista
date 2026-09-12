import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./Auth.module.css";

export { styles as authStyles };

export function AuthShell({ title, description, children, wide = false }: { title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <main className={styles.page}>
      <div className={`${styles.shell} ${wide ? styles.wide : ""}`}>
        <aside className={styles.brandPanel}>
          <Link className={styles.brand} href="/"><Image src="/envista-logo.png" alt="" width={42} height={42} priority /><span>Envista</span></Link>
          <div className={styles.brandCopy}>
            <span className={styles.brandKicker}>IDEIAS QUE CONTINUAM</span>
            <h2>Do aprendizado à oportunidade, tudo no mesmo lugar.</h2>
            <p>Aprenda, forme equipes, construa projetos, mostre evolução e conecte boas ideias às pessoas certas.</p>
            <div className={styles.brandPoints}><span>Aprenda</span><span>Construa</span><span>Conecte</span></div>
          </div>
          <span className={styles.brandFooter}>useenvista.com.br</span>
        </aside>
        <section className={styles.formPanel}>
          <Link className={styles.mobileBrand} href="/"><Image src="/envista-logo.png" alt="" width={34} height={34} /><span>Envista</span></Link>
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
