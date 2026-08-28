"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LiveCompetition, LiveCompetitionsResponse, CompetitionStatus } from "@/lib/competitions/types";
import {
  hasRecommendationContext,
  recommendCompetition,
  type CompetitionMatch,
  type CompetitionRecommendationContext,
} from "@/lib/competitions/recommendations";
import styles from "./Competitions.module.css";

type Tab = "OPEN" | "UPCOMING" | "CLOSED" | "ALL";

const labels: Record<Tab, string> = { OPEN: "Abertas", UPCOMING: "Em breve", CLOSED: "Encerradas", ALL: "Todas" };
const statusLabels: Record<CompetitionStatus, string> = { OPEN: "Inscrições abertas", UPCOMING: "Em breve", CLOSED: "Encerrada", UNKNOWN: "A confirmar" };

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

function MatchBadge({ match }: { match: CompetitionMatch }) {
  const project = match.kind === "project";
  return (
    <div className={project ? styles.projectMatch : styles.teamMatch}>
      <strong>{project ? `Boa oportunidade para ${match.entityName}` : `Compatível com equipe ${match.entityName}`}</strong>
      <span>{match.reasons.join(" + ")}</span>
    </div>
  );
}

export function CompetitionsBrowser({
  basePath,
  recommendationContext,
}: {
  basePath: "/app/competitions" | "/investor/competitions";
  recommendationContext: CompetitionRecommendationContext;
}) {
  const [data, setData] = useState<LiveCompetitionsResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("OPEN");
  const [q, setQ] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("ALL");
  const [modality, setModality] = useState("ALL");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  const loadCompetitions = useCallback(async (fresh = false) => {
    setError("");
    if (fresh) setRefreshing(true);
    try {
      const response = await fetch(`/api/competitions${fresh ? "?fresh=1" : ""}`, {
        credentials: "same-origin",
        cache: fresh ? "no-store" : "default",
      });
      const json = (await response.json()) as LiveCompetitionsResponse;
      if (!response.ok) throw new Error(json.errors?.[0] || "Não foi possível atualizar as competições.");
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar competições.");
    } finally {
      if (fresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCompetitions(false);
  }, [loadCompetitions]);

  const items = data?.items || [];
  const hasContext = hasRecommendationContext(recommendationContext);
  const states = useMemo(() => Array.from(new Set(items.map((item) => item.state).filter(Boolean))).sort(), [items]);
  const modalities = useMemo(() => Array.from(new Set(items.flatMap((item) => item.modalities))).sort(), [items]);
  const counts = useMemo(() => ({ OPEN: items.filter((item) => item.status === "OPEN").length, UPCOMING: items.filter((item) => item.status === "UPCOMING").length, CLOSED: items.filter((item) => item.status === "CLOSED").length, ALL: items.length }), [items]);

  const ranked = useMemo(() => items.map((item) => ({ item, recommendation: recommendCompetition(item, recommendationContext) })), [items, recommendationContext]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("pt-BR");
    const ageNumber = Number(age);
    return ranked
      .filter(({ item, recommendation }) => {
        if (tab !== "ALL" && item.status !== tab) return false;
        if (state !== "ALL" && item.state !== state) return false;
        if (modality !== "ALL" && !item.modalities.includes(modality)) return false;
        if (recommendedOnly && recommendation.score === 0) return false;
        if (needle && ![item.name, item.organizer, item.city, item.state, item.level, item.eligibility, ...item.modalities].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) return false;
        if (age && Number.isFinite(ageNumber)) {
          if (item.minAge == null && item.maxAge == null) return false;
          if (item.minAge != null && ageNumber < item.minAge) return false;
          if (item.maxAge != null && ageNumber > item.maxAge) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (hasContext && a.recommendation.score !== b.recommendation.score) return b.recommendation.score - a.recommendation.score;
        const aDate = a.item.registrationEnd || a.item.eventDate || "9999-12-31";
        const bDate = b.item.registrationEnd || b.item.eventDate || "9999-12-31";
        return aDate.localeCompare(bDate);
      });
  }, [ranked, tab, q, age, state, modality, recommendedOnly, hasContext]);

  return <div className={styles.page}>
    <div className={styles.head}>
      <div>
        <h1>Competições</h1>
        <p>O Envista consulta páginas oficiais de competições e verifica inscrições, datas e modalidades. Os resultados abaixo não são exemplos nem dados mock.</p>
      </div>
      <div className={styles.liveActions}>
        <span className={styles.live}>{data ? `Verificado ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.checkedAt))}` : "Consultando fontes oficiais…"}</span>
        <button className={styles.refreshButton} type="button" disabled={refreshing} onClick={() => void loadCompetitions(true)}>{refreshing ? "Buscando…" : "↻ Buscar agora"}</button>
      </div>
    </div>

    {data && <div className={styles.scanInfo}>
      <span><b>{data.sourcesChecked}</b> fontes oficiais consultadas</span>
      <span><b>{data.items.length}</b> competições/etapas encontradas</span>
      <span><b>{counts.OPEN}</b> com inscrição aberta</span>
      {data.errors.length > 0 && <span className={styles.scanWarning}>{data.errors.length} fonte{data.errors.length === 1 ? "" : "s"} com falha nesta consulta</span>}
    </div>}

    {hasContext && <div className={styles.recommendationIntro}>
      <div><strong>Recomendações personalizadas</strong><span>Comparação por área, tags e localização dos seus projetos e equipes. Não usa IA.</span></div>
      <label><input type="checkbox" checked={recommendedOnly} onChange={(event) => setRecommendedOnly(event.target.checked)} /> Só recomendadas para mim</label>
    </div>}

    <div className={styles.tabs}>
      {(["OPEN", "UPCOMING", "CLOSED", "ALL"] as Tab[]).map((value) => <button key={value} data-active={tab === value} onClick={() => setTab(value)}>{labels[value]} <b>{counts[value]}</b></button>)}
    </div>

    <div className={styles.filters}>
      <input aria-label="Pesquisar competições" placeholder="Pesquisar competição, cidade, modalidade..." value={q} onChange={(event) => setQ(event.target.value)} />
      <input aria-label="Filtrar por idade" type="number" min="1" max="99" placeholder="Idade" value={age} onChange={(event) => setAge(event.target.value)} />
      <select aria-label="Filtrar por estado" value={state} onChange={(event) => setState(event.target.value)}><option value="ALL">Todos os estados</option>{states.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Filtrar por modalidade" value={modality} onChange={(event) => setModality(event.target.value)}><option value="ALL">Todas as modalidades</option>{modalities.map((value) => <option key={value}>{value}</option>)}</select>
    </div>

    {!data && !error && <div className={styles.loading}>Buscando competições diretamente nas fontes oficiais…</div>}
    {error && <div className={styles.error}><b>Não foi possível concluir a busca agora.</b><span>{error}</span><button className={styles.refreshButton} type="button" onClick={() => void loadCompetitions(true)}>Tentar novamente</button></div>}
    {data && !filtered.length && <div className={styles.empty}>{recommendedOnly ? "Nenhuma competição compatível foi encontrada com esses filtros." : "Nenhuma competição encontrada com esses filtros."}</div>}

    <div className={styles.grid}>
      {filtered.map(({ item, recommendation }) => <Link prefetch={false} className={styles.card} href={`${basePath}/${item.slug}`} key={item.id}>
        <div className={styles.banner}><span className={`${styles.status} ${statusClass(item.status)}`}>{statusLabels[item.status]}</span><span>{item.level}</span></div>
        <div className={styles.body}>
          {(recommendation.project || recommendation.team) && <div className={styles.matchStack}>
            {recommendation.project && <MatchBadge match={recommendation.project} />}
            {recommendation.team && <MatchBadge match={recommendation.team} />}
          </div>}
          <h3>{item.name}</h3><p>{item.organizer}</p>
          <div className={styles.meta}><span>📍 {[item.city, item.state].filter(Boolean).join(" — ") || item.country}</span><span>👥 {ageLabel(item)}</span><span>📅 Inscrição: {fmt(item.registrationStart)} → {fmt(item.registrationEnd)}</span>{item.eventDate && <span>🏁 Evento: {fmt(item.eventDate)}</span>}</div>
          <div className={styles.chips}>{item.modalities.slice(0, 4).map((value) => <span key={value}>{value}</span>)}</div>
          <small className={styles.verifiedSource}>Fonte: {item.sourceName} · {item.confidence}% de confiança</small>
        </div>
      </Link>)}
    </div>
  </div>;
}

export function CompetitionDetailClient({
  basePath,
  slug,
  recommendationContext,
}: {
  basePath: "/app/competitions" | "/investor/competitions";
  slug: string;
  recommendationContext: CompetitionRecommendationContext;
}) {
  const [item, setItem] = useState<LiveCompetition | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/competitions", { credentials: "same-origin" }).then((response) => response.json()).then((data: LiveCompetitionsResponse) => setItem(data.items.find((candidate) => candidate.slug === slug) || null)).finally(() => setLoaded(true));
  }, [slug]);

  if (!loaded) return <div className={styles.loading}>Carregando detalhes da competição…</div>;
  if (!item) return <div className={styles.page}><Link prefetch={false} className={styles.back} href={basePath}>← Competições</Link><div className={styles.empty}>Competição não encontrada ou removida da fonte oficial.</div></div>;

  const recommendation = recommendCompetition(item, recommendationContext);

  return <div className={styles.page}>
    <Link prefetch={false} className={styles.back} href={basePath}>← Competições</Link>
    {(recommendation.project || recommendation.team) && <section className={styles.recommendationPanel}>
      <div><strong>Por que esta oportunidade combina com você</strong><span>O Envista comparou os dados desta competição com seus projetos e equipes.</span></div>
      <div className={styles.matchStack}>
        {recommendation.project && <MatchBadge match={recommendation.project} />}
        {recommendation.team && <MatchBadge match={recommendation.team} />}
      </div>
    </section>}
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
        <h2>Fonte oficial</h2><p>Os dados vieram da página oficial indicada abaixo. Confira o regulamento final antes de enviar uma inscrição.</p>
        <a className={styles.official} href={item.officialUrl} target="_blank" rel="noreferrer">Abrir fonte oficial ↗</a>
      </aside>
    </div>
  </div>;
}
