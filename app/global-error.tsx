"use client";

import { useEffect } from "react";
import styles from "./recovery.module.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "client_global_error",
        digest: error.digest || null,
      }),
    );
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className={styles.page}>
          <section className={styles.card} role="alert">
            <p className={styles.eyebrow}>Envista</p>
            <h1 className={styles.title}>Algo inesperado aconteceu.</h1>
            <p className={styles.text}>
              O erro foi registrado. Tente recarregar a aplicação ou volte para a entrada do Envista.
            </p>
            <div className={styles.actions}>
              <button className={styles.primary} type="button" onClick={reset}>Tentar novamente</button>
              <a className={styles.secondary} href="/login">Ir para o login</a>
            </div>
            {error.digest ? <p className={styles.code}>Referência: {error.digest}</p> : null}
          </section>
        </main>
      </body>
    </html>
  );
}
