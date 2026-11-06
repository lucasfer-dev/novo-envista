"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./HomeDashboardRedesign.module.css";

function dateLabel(item: LiveCompetition) {
  const value = item.registrationEnd || item.eventDate;
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Confira as datas";
  const date = new Date(value + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) return "Confira as datas";
  const day = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
  return (item.registrationEnd ? "Até " : "Evento: ") + day;
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
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);

  const featured = items?.[0];
  return <section className={styles.competitionSection} aria-labelledby="home-competitions-heading">
    <div className={styles.panelHeading}>
      <h2 id="home-competitions-heading"><Trophy size={19} aria-hidden="true" /> Competições ativas</h2>
      <Link className={styles.viewAll} href="/competitions">Ver todas <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
    <div className={styles.opportunityPanel}>
      {featured ? <>
        <div className={styles.opportunityFeature}>
          <div><h3>{featured.name}</h3><p>{featured.description || "Desafios para tirar suas ideias do papel."}</p></div>
          <img src="/brand/opportunity-challenge.svg" width="72" height="70" alt="" aria-hidden="true" />
        </div>
        <div className={styles.opportunityDetails}>
          <p><CalendarDays size={14} aria-hidden="true" /> {dateLabel(featured)} · {featured.status === "OPEN" ? "Inscrições abertas" : "Em breve"}</p>
          <Link className={styles.primaryAction} href={"/competitions/" + encodeURIComponent(featured.slug)}>
            {featured.status === "OPEN" ? "Ver e participar" : "Conhecer competição"}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </> : <div className={styles.opportunityEmpty}>
        <img src="/brand/opportunity-challenge.svg" alt="" loading="lazy" />
        <div><strong>Pronto para um novo desafio?</strong>
          <p role="status">{error ? "Não foi possível carregar as competições agora." : items ? "Nenhuma competição aberta ou anunciada no momento." : "Consultando o calendário de competições..."}</p>
          <Link className={styles.viewAll} href="/competitions">Descobrir oportunidades <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>}
    </div>
  </section>;
}
