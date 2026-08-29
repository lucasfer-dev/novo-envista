"use client";

import { useEffect } from "react";
import styles from "./recovery.module.css";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "client_route_error",
        digest: error.digest || null,
      }),
    );
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <p className={styles.eyebrow}>Envista</p>
        <h1 className={styles.title}>Não conseguimos carregar esta área.</h1>
        <p className={styles.text}>
          A falha foi registrada. Você pode tentar novamente ou voltar para o início sem perder sua conta.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={reset}>Tentar novamente</button>
          <a className={styles.secondary} href="/">Voltar ao início</a>
        </div>
        {error.digest ? <p className={styles.code}>Referência: {error.digest}</p> : null}
      </section>
    </main>
  );
}
