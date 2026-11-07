"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";
import styles from "./Explore.module.css";

function dateLabel(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

export default function ExploreCompetitionSpotlight() {
  const [competitions, setCompetitions] = useState<LiveCompetition[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { signal: controller.signal, credentials: "same-origin" })
      .then(async response => {
        if (!response.ok) throw new Error("competitions");
        const data = await response.json() as LiveCompetitionsResponse;
        setCompetitions(data.items.filter(item => item.status === "OPEN" || item.status === "UPCOMING"));
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const competition = competitions?.find(item => item.status === "OPEN") ?? competitions?.[0];
  const date = competition ? dateLabel(competition.registrationEnd || competition.eventDate) : null;

  return <section className={styles.competitionPanel} aria-labelledby="explore-competition-heading">
    <h2 id="explore-competition-heading"><Trophy size={20} aria-hidden="true" /> Competições e desafios</h2>
    {competition ? <>
      <div className={styles.competitionBody}>
        <div><h3>{competition.name}</h3><p>{competition.description || "Uma oportunidade para tirar suas ideias do papel."}</p></div>
        <img src="/brand/opportunity-challenge.svg" width="91" height="93" alt="" aria-hidden="true" />
      </div>
      <div className={styles.competitionMeta}>
        <span><CalendarDays size={15} aria-hidden="true" /> {date ? (competition.registrationEnd ? "Até " : "Evento: ") + date : "Confira as datas"}</span>
        <span>{competition.status === "OPEN" ? "Inscrições abertas" : "Em breve"}</span>
      </div>
      <Link className={styles.primaryAction} href={"/competitions/" + encodeURIComponent(competition.slug)}>
        {competition.status === "OPEN" ? "Ver oportunidade" : "Conhecer desafio"} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </> : <>
      <div className={styles.railEmpty}>
        <Trophy size={28} aria-hidden="true" />
        <p role="status">{failed ? "Não foi possível consultar as competições agora." : competitions ? "Nenhuma competição aberta ou anunciada no momento." : "Consultando desafios disponíveis..."}</p>
      </div>
      <Link className={styles.outlineAction} href="/competitions">Explorar competições <ArrowRight size={15} aria-hidden="true" /></Link>
    </>}
  </section>;
}
