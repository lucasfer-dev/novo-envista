"use client";

import { useState, type ReactNode } from "react";
import styles from "./ProjectDetailTabs.module.css";

export type ProjectDetailTab = { id: string; label: string; content: ReactNode };

export default function ProjectDetailTabs({ tabs, ariaLabel = "Informações do projeto" }: { tabs: ProjectDetailTab[]; ariaLabel?: string }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const selected = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            className={tab.id === selected?.id ? styles.active : styles.tab}
            type="button"
            role="tab"
            aria-selected={tab.id === selected?.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {selected ? (
        <section id={`${selected.id}-panel`} className={styles.panel} role="tabpanel" aria-labelledby={`${selected.id}-tab`} tabIndex={0}>
          {selected.content}
        </section>
      ) : null}
    </div>
  );
}
