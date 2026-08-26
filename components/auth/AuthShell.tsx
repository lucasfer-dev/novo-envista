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
      <div className={`${styles.shell} ${wide ? styles.wide : ""}`}>
        <Link className={styles.brand} href="/">
          <img src="/envista-logo.png" alt="" />
          <span>Envista</span>
        </Link>
        <section className={styles.card}>
          <h1>{title}</h1>
          {description ? <p className={styles.lead}>{description}</p> : null}
          {children}
        </section>
      </div>
    </main>
  );
}
