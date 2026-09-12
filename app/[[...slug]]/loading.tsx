import styles from "./loading.module.css";

export default function ProductRouteLoading() {
  return (
    <main className={styles.screen} aria-busy="true" aria-label="Carregando página">
      <div className={styles.wrap}>
        <div className={styles.bar} />
        <div className={styles.title} />
        <div className={styles.line} />
        <div className={styles.grid}>
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
    </main>
  );
}
