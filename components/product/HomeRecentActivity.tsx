"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./HomeDashboardRedesign.module.css";

export default function HomeRecentActivity() {
  const [competitions, setCompetitions] = useState<LiveCompetition[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { credentials: "same-origin", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("competitions");
        const data = await response.json() as LiveCompetitionsResponse;
        setCompetitions(data.items.filter(item => item.status === "OPEN" || item.status === "UPCOMING").slice(0, 2));
      })
      .catch(() => {
        if (!controller.signal.aborted) setCompetitions([]);
      });
    return () => controller.abort();
  }, []);

  if (competitions === null) {
    return <div className={styles.railEmpty} role="status">
      <Bell size={20} aria-hidden="true" />
      <p>Buscando novidades para você...</p>
    </div>;
  }

  if (competitions.length === 0) {
    return <div className={styles.railEmpty}>
      <Bell size={20} aria-hidden="true" />
      <p>Sem novas notificações. Explore os projetos e oportunidades da comunidade.</p>
    </div>;
  }

  return <div className={styles.activityList}>
    {competitions.map(item => (
      <Link
        key={item.slug}
        href={"/competitions/" + encodeURIComponent(item.slug)}
        className={styles.activityItem}
      >
        <span className={styles.activityIcon}><Trophy size={19} aria-hidden="true" /></span>
        <span className={styles.activityCopy}>
          <strong>{item.name}</strong>
          <small>{item.status === "OPEN" ? "Inscrições abertas · Confira o desafio" : "Próxima competição · Veja os detalhes"}</small>
        </span>
        <ArrowRight className={styles.activityArrow} size={18} aria-hidden="true" />
      </Link>
    ))}
  </div>;
}
