"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./LegacySocialFeed.module.css";

export default function SocialCompetitionSpotlight() {
  const [items, setItems] = useState<LiveCompetition[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { signal: controller.signal, credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("competitions");
        const payload = await response.json() as LiveCompetitionsResponse;
        setItems(payload.items.filter(item => item.status === "OPEN" || item.status === "UPCOMING"));
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const featured = items?.find(item => item.status === "OPEN") ?? items?.[0];
  return (
    <section className={[styles.sideCard, styles.competitionPanel].join(" ")} aria-labelledby="social-spotlight-heading">
      <h2 id="social-spotlight-heading"><Trophy size={20} aria-hidden="true" /> Em destaque</h2>
      {featured ? <Link className={styles.competitionLink} href={"/competitions/" + encodeURIComponent(featured.slug)}>
        <div className={styles.competitionText}>
          <strong>{featured.name}</strong>
          <p>{featured.description || "Ideias para transformar em projetos."}</p>
          <small>{featured.status === "OPEN" ? "Inscrições abertas" : "Em breve"}</small>
        </div>
        <img src="/brand/opportunity-challenge.svg" width="96" height="96" alt="" aria-hidden="true" />
        <ArrowRight size={19} className={styles.competitionArrow} aria-hidden="true" />
      </Link> : <div className={styles.spotlightEmpty}>
        <p role="status">{failed ? "Não foi possível consultar os desafios." : items ? "Nenhum desafio ativo ou anunciado agora." : "Consultando oportunidades..."}</p>
        <Link href="/competitions">Ver competições <ArrowRight size={14} /></Link>
      </div>}
    </section>
  );
}
