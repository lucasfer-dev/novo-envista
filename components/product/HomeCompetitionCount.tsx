"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import type { LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./HomeDashboardRedesign.module.css";

export default function HomeCompetitionCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { credentials: "same-origin", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Falha ao carregar competições");
        const data = await response.json() as LiveCompetitionsResponse;
        setCount(data.items.filter(item => item.status === "OPEN").length);
      }).catch(() => { if (!controller.signal.aborted) setCount(null); });
    return () => controller.abort();
  }, []);

  return (
    <Link className={styles.statCard} href="/competitions" aria-label={count === null ? "Ver competições" : count + " competições abertas"}>
      <span className={styles.statIcon}><Trophy size={24} aria-hidden="true" /></span>
      <span className={styles.statCopy}><strong>{count ?? "—"}</strong><small>Competições abertas</small></span>
      <ArrowRight className={styles.statTrend} size={18} aria-hidden="true" />
    </Link>
  );
}
