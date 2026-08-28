"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LiveCompetition, LiveCompetitionsResponse, CompetitionStatus } from "@/lib/competitions/types";
import styles from "./Competitions.module.css";

type Tab = "OPEN" | "UPCOMING" | "CLOSED" | "ALL";

const labels: Record<Tab, string> = { OPEN: "Abertas", UPCOMING: "Em breve", CLOSED: "Encerradas", ALL: "Todas" };
const statusLabels: Record<CompetitionStatus, string> = { OPEN: "Inscrições abertas", UPCOMING: "Em breve", CLOSED: "Encerrada", UNKNOWN: "Não confirmado" };

function fmt(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function ageLabel(item: LiveCompetition) {
  if (item.minAge == null && item.maxAge == null) return item.eligibility || "Conferir regulamento";
  if (item.minAge != null && item.maxAge != null) return `${item.minAge} a ${item.maxAge} anos`;
  if (item.minAge != null) return `A partir de ${item.minAge} anos`;
  return `Até ${item.maxAge} anos`;
}

function statusClass(status: CompetitionStatus) {
  if (status === "OPEN") return styles.open;
  if (status === "UPCOMING") return styles.upcoming;
  if (status === "CLOSED") return styles.closed;
  return styles.unknown;
}

export function CompetitionsBrowser({ basePath }: { basePath: "/app/competitions" | "/investor/competitions" }) {
  const [data, setData] = useState<LiveCompetitionsResponse | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("OPEN");
  const [q, setQ] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("ALL");
  const [modality, setModality] = useState("ALL");

  useEffect(() => {
    let active = true;
    fetch("/api/competitions", { credentials: "same-origin" })
      .then(async (response) => {
        const json = (await response.json()) as LiveCompetitionsResponse;
        if (!response.ok) throw new Error(json.errors?.[0] || "Não foi possível atualizar as competições.");
        if (active) setData(json);
      })
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : "Falha ao carregar competições."));
    return () => { active = false; };
  }, []);

  const items = data?.items || [];
  const states = useMemo(() => Array.from(new Set(items.map((item) => item.state).filter(Boolean))).sort(), [items]);
  const modalities = useMemo(() => Array.from(new Set(items.flatMap((item) => item.modalities))).sort(), [items]);
  const counts = useMemo(() => ({ OPEN: items.filter((item) => item.status === "OPEN").length, UPCOMING: items.filter((item) => item.status === "UPCOMING").length, CLOSED: items.filter((item) => item.status === "CLOSED").length, ALL: items.length }), [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("pt-BR");
    const ageNumber = Number(age);
    return items.filter((item) => {
      if (tab !== "ALL" && item.status !== tab) return false;
      if (state !== "ALL" && item.state !== state) return false;
      if (modality !== "ALL" && !item.modalities.includes(modality)) return false;
      if (needle && ![item.name, item.organizer, item.city, item.state, item.level, ...item.modalities].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) return false;
      if (age && Number.isFinite(ageNumber)) {
        if (item.minAge == null && item.maxAge == null) return false;
        if (item.minAge != null && ageNumber < item.minAge) return false;
        if (item.maxAge != null && ageNumber > item.maxAge) return false;
      }
      return true;
    });
  }, [items, tab, q, age, state, modality]);

  return <div className={styles.page}>
    <div className={styles.head}>
      <div><h1>Competições</h1><p>Oportunidades encontradas automaticamente em fontes oficiais, com status de inscrição, faixa etária, modalidade, local e etapas.</p></div>
      <span className={styles.live}>{data ? `Atualizado ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.checkedAt))}` : "Atualizando fontes oficiais…"}</span>
    </div>

    <div className={styles.tabs}>
      {(["OPEN", "UPCOMING", "CLOSED", "ALL"] as Tab[]).map((value) => <button key={value} data-active={tab === value} onClick={() => setTab(value)}>{labels[value]} <b>{counts[value]}</b></button>)}
    </div>

    <div className={styles.filters}>
      <input aria-label="Pesquisar competições" placeholder="Pesquisar competição, cidade, modalidade..." value={q} onChange={(event) => setQ(event.target.value)} />
      <input aria-label="Filtrar por idade" type="number" min="1" max="99" placeholder="Idade" value={age} onChange={(event) => setAge(event.target.value)} />
      <select aria-label="Filtrar por estado" value={state} onChange={(event) => setState(event.target.value)}><option value="ALL">Todos os estados</option>{states.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Filtrar por modalidade" value={modality} onChange={(event) => setModality(event.target.value)}><option value="ALL">Todas as modalidades</option>{modalities.map((value) => <option key={value}>{value}</option>)}</select>
    </div>

    {!data && !error && <div className={styles.loading}>Buscando competições e conferindo os períodos de inscrição…</div>}
    {error && <div className={styles.error}>{error}</div>}
    {data && !filtered.length && <div className={styles.empty}>Nenhuma competição encontrada com esses filtros.</div>}

    <div className={styles.grid}>
      {filtered.map((item) => <Link className={styles.card} href={`${basePath}/${item.slug}`} key={item.id}>
        <div className={styles.banner}><span className={`${styles.status} ${statusClass(item.status)}`}>{statusLabels[item.status]}</span><span>{item.level}</span></div>
        <div className={styles.body}>
          <h3>{item.name}</h3><p>{item.organizer}</p>
          <div className={styles.meta}><span>📍 {[item.city, item.state].filter(Boolean).join(" — ") || item.country}</span><span>👥 {ageLabel(item)}</span><span>📅 Inscrição: {fmt(item.registrationStart)} → {fmt(item.registrationEnd)}</span>{item.eventDate && <span>🏁 Evento: {fmt(item.eventDate)}</span>}</div>
          <div className={styles.chips}>{item.modalities.slice(0, 4).map((value) => <span key={value}>{value}</span>)}</div>
        </div>
      </Link>)}
    </div>
  </div>;
}

export function CompetitionDetailClient({ basePath, slug }: { basePath: "/app/competitions" | "/investor/competitions"; slug: string }) {
  const [item, setItem] = useState<LiveCompetition | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/competitions", { credentials: "same-origin" }).then((response) => response.json()).then((data: LiveCompetitionsResponse) => setItem(data.items.find((candidate) => candidate.slug === slug) || null)).finally(() => setLoaded(true));
  }, [slug]);

  if (!loaded) return <div className={styles.loading}>Carregando detalhes da competição…</div>;
  if (!item) return <div className={styles.page}><Link className={styles.back} href={basePath}>← Competições</Link><div className={styles.empty}>Competição não encontrada ou removida da fonte oficial.</div></div>;

  return <div className={styles.page}>
    <Link className={styles.back} href={basePath}>← Competições</Link>
    <div className={styles.detail}>
      <section className={styles.panel}>
        <span className={`${styles.status} ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
        <h1>{item.name}</h1><p>{item.organizer}</p>
        <h2>Quem pode participar</h2><p>{ageLabel(item)}</p>
        <h2>Modalidades</h2><div className={styles.chips}>{item.modalities.map((value) => <span key={value}>{value}</span>)}</div>
        <h2>Etapas</h2><div className={styles.chips}>{item.stages.map((value) => <span key={value}>{value}</span>)}</div>
        <h2>Como o status foi verificado</h2><p>{item.evidence}</p>
        <p className={styles.source}>Fonte: {item.sourceName} · confiança {item.confidence}%</p>
      </section>
      <aside className={styles.panel}>
        <div className={styles.facts}>
          <div className={styles.fact}><small>Local</small><b>{[item.city, item.state].filter(Boolean).join(" — ") || item.country}</b></div>
          <div className={styles.fact}><small>Nível</small><b>{item.level}</b></div>
          <div className={styles.fact}><small>Abertura</small><b>{fmt(item.registrationStart)}</b></div>
          <div className={styles.fact}><small>Prazo</small><b>{fmt(item.registrationEnd)}</b></div>
          <div className={styles.fact}><small>Evento</small><b>{fmt(item.eventDate)}</b></div>
          <div className={styles.fact}><small>Idade</small><b>{item.minAge != null || item.maxAge != null ? ageLabel(item) : "Por categoria/regulamento"}</b></div>
        </div>
        <h2>Fonte oficial</h2><p>Confira o regulamento e os dados finais diretamente com a organização antes de enviar uma inscrição.</p>
        <a className={styles.official} href={item.officialUrl} target="_blank" rel="noreferrer">Ver site oficial ↗</a>
      </aside>
    </div>
  </div>;
}
