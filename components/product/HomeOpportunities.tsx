"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import type { LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";

const statusLabels = { OPEN: "Inscrições abertas", UPCOMING: "Em breve", UNKNOWN: "Confira o regulamento" };

export default function HomeOpportunities() {
  const [items, setItems] = useState<LiveCompetition[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/competitions", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("competitions");
        const data = await response.json() as LiveCompetitionsResponse;
        setItems(data.items.filter((item) => item.status !== "CLOSED").slice(0, 3));
      }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  return <section className="section-block" aria-labelledby="opportunity-title">
    <div className="section-row"><h2 id="opportunity-title"><Trophy size={22} aria-hidden="true" /> Oportunidades para explorar</h2>
      <Link className="text-btn" href="/competitions">Ver todas <ArrowRight size={15} aria-hidden="true" /></Link></div>
    {items?.length ? <div className="dashboard-opportunity-grid">{items.map((item) => <Link className="panel dashboard-opportunity-card" href={`/competitions/${encodeURIComponent(item.slug)}`} key={item.id}>
      <img src={/ciência|cient|science|mostratec/i.test(`${item.name} ${item.type}`) ? "/brand/opportunity-science.svg" : "/brand/opportunity-challenge.svg"} alt="" width="320" height="200" loading="lazy" />
      <div><span className="stage" data-status={item.status}>{statusLabels[item.status as keyof typeof statusLabels]}</span><h3>{item.name}</h3><p>{item.description || item.organizer}</p><small>{item.organizer}</small>
        <span className="dashboard-opportunity-cta">Ver oportunidade <ArrowRight size={15} aria-hidden="true" /></span></div>
    </Link>)}</div> : <div className="panel dashboard-opportunity">
      <img className="dashboard-opportunity-art" src="/brand/opportunity-challenge.svg" alt="" width="320" height="200" />
      <div className="grow"><h3>Seu projeto pode ir mais longe.</h3><p role="status">{failed ? "Não foi possível carregar as oportunidades agora." : items ? "Explore o catálogo e confira os próximos eventos." : "Buscando oportunidades nas fontes oficiais…"}</p></div>
      <Link className="secondary" href="/competitions">Explorar oportunidades <ArrowRight size={17} aria-hidden="true" /></Link>
    </div>}
  </section>;
}
