"use client";

import { useEffect, useMemo, useState } from "react";
import { BRAZIL_STATES } from "@/lib/brazil-locations";

type Props = {
  defaultCity?: string;
  defaultState?: string;
  gridClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  optional?: boolean;
};

export default function BrazilLocationFields({
  defaultCity = "",
  defaultState = "",
  gridClassName,
  fieldClassName,
  labelClassName,
  helperClassName,
  optional = true,
}: Props) {
  const [state, setState] = useState(defaultState.toUpperCase());
  const [city, setCity] = useState(defaultCity);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const listId = useMemo(() => `envista-cities-${state || "all"}`, [state]);

  useEffect(() => {
    if (!state) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) return { cities: [] as string[] };
        return response.json() as Promise<{ cities?: string[] }>;
      })
      .then((payload) => setCities(Array.isArray(payload.cities) ? payload.cities : []))
      .catch(() => setCities([]))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [state]);

  return (
    <div className={gridClassName}>
      <label className={fieldClassName}>
        <span className={labelClassName}>Estado {optional ? <span className={helperClassName}>(opcional)</span> : null}</span>
        <select
          name="public_state"
          value={state}
          onChange={(event) => {
            setState(event.target.value);
            setCity("");
          }}
          autoComplete="address-level1"
          required={!optional}
        >
          <option value="">{optional ? "Selecione ou deixe em branco" : "Selecione"}</option>
          {BRAZIL_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
        </select>
      </label>

      <label className={fieldClassName}>
        <span className={labelClassName}>Cidade {optional ? <span className={helperClassName}>(opcional)</span> : null}</span>
        <input
          name="public_city"
          list={listId}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          autoComplete="address-level2"
          maxLength={100}
          placeholder={state ? (loading ? "Carregando cidades…" : "Escolha ou digite sua cidade") : "Selecione primeiro o estado"}
          disabled={!state}
          required={!optional}
        />
        <datalist id={listId}>
          {cities.map((name) => <option key={name} value={name} />)}
        </datalist>
        {state ? <span className={helperClassName}>{cities.length ? `${cities.length} municípios de ${state} disponíveis.` : loading ? "Consultando municípios…" : "Você também pode digitar manualmente se necessário."}</span> : null}
      </label>
    </div>
  );
}
