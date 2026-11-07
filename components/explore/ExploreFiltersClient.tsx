"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Filter } from "lucide-react";
import type { ExploreKind } from "./ExploreView";
import styles from "./Explore.module.css";

function filterUrl(base: string, query: string, stage: string, type: ExploreKind) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (stage !== "Todos" && (type === "all" || type === "projects")) params.set("stage", stage);
  if (type !== "all") params.set("type", type);
  const suffix = params.toString();
  return suffix ? base + "?" + suffix : base;
}

export default function ExploreFiltersClient({
  base, initialQuery, initialStage, initialType = "all",
}: {
  base: string; initialQuery: string; initialStage: string; initialType?: ExploreKind;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [stage, setStage] = useState(initialStage || "Todos");
  const [type, setType] = useState<ExploreKind>(initialType);
  const enabledStages = type === "all" || type === "projects";
  const active = Boolean(initialQuery) || initialStage !== "Todos" || initialType !== "all";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(filterUrl(base, query, enabledStages ? stage : "Todos", type), { scroll: false });
  };

  return <section className={styles.filtersPanel} aria-labelledby="explore-filters-heading">
    <div className={styles.panelHeading}>
      <h2 id="explore-filters-heading"><Filter size={18} aria-hidden="true" /> Filtrar resultados</h2>
      {active && <Link href={base}>Limpar <ArrowRight size={13} aria-hidden="true" /></Link>}
    </div>
    <form onSubmit={submit} data-envista-server-explore="true">
      <label className={styles.filterField}>
        <span>Tipo</span>
        <select aria-label="Tipo de resultado" value={type} onChange={event => setType(event.target.value as ExploreKind)}>
          <option value="all">Todos</option>
          <option value="projects">Projetos</option>
          <option value="teams">Equipes</option>
          <option value="people">Pessoas</option>
        </select>
      </label>
      <label className={styles.filterField}>
        <span>Etapa do projeto</span>
        <select aria-label="Filtrar por estágio" value={enabledStages ? stage : "Todos"} disabled={!enabledStages} onChange={event => setStage(event.target.value)}>
          <option value="Todos">Todas as etapas</option>
          <option value="Ideia">Ideia</option>
          <option value="Validação">Validação</option>
          <option value="Protótipo">Protótipo</option>
          <option value="MVP">MVP</option>
          <option value="Projeto ativo">Projeto ativo</option>
        </select>
      </label>
      <label className={styles.filterField}>
        <span>Buscar por área, nome ou palavra-chave</span>
        <input aria-label="Buscar projetos, pessoas ou equipes" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Ex.: tecnologia, impacto..." autoComplete="off" maxLength={120} />
      </label>
      <p className={styles.filterHint}>Os resultados são consultados no Envista e organizados pelas informações publicadas.</p>
      <div className={styles.filterActions}>
        <button type="submit">Aplicar filtros</button>
        {active && <Link href={base}>Limpar</Link>}
      </div>
    </form>
  </section>;
}
