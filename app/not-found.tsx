import styles from "./recovery.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Erro 404</p>
        <h1 className={styles.title}>Essa página não existe.</h1>
        <p className={styles.text}>
          O endereço pode ter mudado ou o conteúdo pode não estar mais disponível.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="/">Voltar ao Envista</a>
          <a className={styles.secondary} href="/login">Ir para o login</a>
        </div>
      </section>
    </main>
  );
}
