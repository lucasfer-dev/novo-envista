import Link from "next/link";
import styles from "./Dashboard.module.css";

type Step = { label: string; description: string; href: string; done: boolean };

export default function FirstSteps({ steps }: { steps: Step[] }) {
  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;

  return (
    <section className={styles.card}>
      <div className={styles.sectionHead}>
        <div>
          <h2>Primeiros passos</h2>
          <span className={styles.muted}>{completed} de {steps.length} concluídos</span>
        </div>
      </div>
      <div className={styles.stack}>
        {steps.map((step) => (
          <Link className={styles.item} href={step.href} key={step.label}>
            <div>
              <strong>{step.label}</strong>
              <p>{step.description}</p>
            </div>
            <span className={step.done ? styles.pill : styles.muted}>{step.done ? "Concluído" : "Fazer agora"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
