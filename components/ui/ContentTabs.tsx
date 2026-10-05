"use client";

import { useId, useState, type ReactNode, type KeyboardEvent } from "react";
import styles from "./ContentTabs.module.css";

export default function ContentTabs({ sections, label }: { label: string; sections: { key: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(sections[0]?.key);
  const id = useId();
  function keydown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % sections.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + sections.length) % sections.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sections.length - 1;
    else return;
    event.preventDefault(); setActive(sections[next].key);
    document.getElementById(`${id}-tab-${sections[next].key}`)?.focus();
  }
  return <div><div role="tablist" aria-label={label} className={styles.tabs}>{sections.map((section, index) => <button key={section.key} role="tab" id={`${id}-tab-${section.key}`} aria-controls={`${id}-panel-${section.key}`} aria-selected={active === section.key} tabIndex={active === section.key ? 0 : -1} onClick={() => setActive(section.key)} onKeyDown={event => keydown(event, index)}>{section.label}</button>)}</div>{sections.map(section => <section key={section.key} role="tabpanel" id={`${id}-panel-${section.key}`} aria-labelledby={`${id}-tab-${section.key}`} hidden={active !== section.key} tabIndex={0} className={styles.panel}>{section.content}</section>)}</div>;
}
