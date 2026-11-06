"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./HomeDashboardRedesign.module.css";

function dateLabel(item: LiveCompetition) {
  const raw = item.registrationEnd || item.eventDate;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Confira as datas";
  const date = new Date(raw + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) return "Confira as datas";
  const formatted = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
  return (item.registrationEnd ? "Inscrições até " : "Evento em ") + formatted;
}

export default function HomeOpportunitiesRedesign() {
  const [items, setItems] = useState<LiveCompetition[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { credentials: "same-origin", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("competitions");
        const data = await response.json() as LiveCompetitionsResponse;
        setItems(data.items.filter(item => item.status === "OPEN" || item.status === "UPCOMING").slice(0, 3));
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);

  const first = items?.[0];
  return (
    <section className={styles.opportunityPanel} aria-labelledby="home-opportunities-heading">
      <div className={styles.panelHeading}>
        <h2 id="home-opportunities-heading"><Trophy size={19} aria-hidden="true" /> Competições e oportunidades</h2>
        <Link className={styles.viewAll} href="/competitions">Ver todas <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      {first ? <>
        <div className={styles.opportunityFeature}>
          <div>
            <h3>{first.name}</h3>
            <p>{first.description || first.organizer}</p>
            <small><CalendarDays size={13} aria-hidden="true" /> {dateLabel(first)}</small>
            <Link className={styles.primaryAction} href={"/competitions/" + encodeURIComponent(first.slug)}>Ver oportunidade <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <img src="/brand/opportunity-challenge.svg" width="90" height="90" alt="" aria-hidden="true" loading="lazy" />
        </div>
        {items && items.length > 1 && <div className={styles.opportunityList}>
          {items.slice(1).map(item => <Link key={item.id} href={"/competitions/" + encodeURIComponent(item.slug)} className={styles.opportunityRow}>
            <span className={styles.opportunityIcon}><CalendarDays size={15} aria-hidden="true" /></span>
            <span><strong>{item.name}</strong><small>{dateLabel(item)}</small></span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>)}
        </div>}
      </> : <div className={styles.opportunityEmpty}>
        <img src="/brand/opportunity-challenge.svg" alt="" loading="lazy" />
        <div><strong>Encontre seu próximo desafio.</strong><p role="status">{error ? "Não foi possível consultar as oportunidades agora." : items ? "Não há competições com inscrições abertas ou próximas confirmadas neste momento." : "Consultando oportunidades..."}</p></div>
        <Link className={styles.viewAll} href="/competitions">Explorar <ArrowRight size={14} /></Link>
      </div>}
    </section>
  );
}
