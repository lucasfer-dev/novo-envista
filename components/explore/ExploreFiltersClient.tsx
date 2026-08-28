"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

function hrefFor(base: string, query: string, stage: string) {
  const params = new URLSearchParams();
  const cleanQuery = query.trim();
  if (cleanQuery) params.set("q", cleanQuery);
  if (stage && stage !== "Todos") params.set("stage", stage);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export default function ExploreFiltersClient({
  base,
  initialQuery,
  initialStage,
}: {
  base: string;
  initialQuery: string;
  initialStage: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [stage, setStage] = useState(initialStage || "Todos");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(hrefFor(base, query, stage), { scroll: false });
  };

  const clear = () => {
    setQuery("");
    setStage("Todos");
    router.push(base, { scroll: false });
  };

  const hasFilters = Boolean(query.trim()) || stage !== "Todos";

  return (
    <form className="filters" onSubmit={submit} data-envista-server-explore="true">
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Buscar projetos, pessoas ou equipes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar projetos, pessoas ou equipes..."
          autoComplete="off"
        />
      </label>
      <select
        aria-label="Filtrar por estágio"
        value={stage}
        onChange={(event) => setStage(event.target.value)}
      >
        <option value="Todos">Todos os estágios</option>
        <option value="Ideia">Ideia</option>
        <option value="Validação">Validação</option>
        <option value="Protótipo">Protótipo</option>
        <option value="MVP">MVP</option>
        <option value="Projeto ativo">Projeto ativo</option>
      </select>
      <button className="primary" type="submit">Filtrar</button>
      {hasFilters && <button className="secondary" type="button" onClick={clear}>Limpar</button>}
    </form>
  );
}
