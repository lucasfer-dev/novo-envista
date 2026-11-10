"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
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
  const [stage, setStage] = useState(initialStage || "Todos");
  const active = Boolean(initialQuery) || initialStage !== "Todos" || initialType !== "all";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(filterUrl(base, initialQuery, stage, initialType), { scroll: false });
  };

  return <section className={styles.filtersPanel} aria-labelledby="explore-filters-heading">
    <div className={styles.panelHeading}>
      <h2 id="explore-filters-heading"><SlidersHorizontal size={18} aria-hidden="true" /> Filtros</h2>
      {active && <Link href={base}>Limpar <ArrowRight size={13} aria-hidden="true" /></Link>}
    </div>
    <form onSubmit={submit} data-envista-server-explore="true">
      <label className={styles.filterField}>
        <span>Etapa do projeto</span>
        <select aria-label="Filtrar por estágio" value={stage} onChange={event => setStage(event.target.value)}>
          <option value="Todos">Todas as etapas</option>
          <option value="Ideia">Ideia</option>
          <option value="Validação">Validação</option>
          <option value="Protótipo">Protótipo</option>
          <option value="MVP">MVP</option>
          <option value="Projeto ativo">Projeto ativo</option>
        </select>
      </label>
      <div className={styles.filterActions}>
        <button type="submit">Aplicar</button>
        {active && <Link href={base}>Limpar</Link>}
      </div>
    </form>
  </section>;
}
