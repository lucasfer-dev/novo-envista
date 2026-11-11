import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Crown, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./Plans.module.css";

export const metadata: Metadata = {
  title: "Planos do Envista",
  description: "Conheça os planos Gratuito, Pro e Investidor previstos para o ecossistema Envista.",
};

const plans = [
  {
    name: "Gratuito",
    subtitle: "Comece sem custo.",
    price: "R$ 0",
    period: "/mês",
    Icon: Sparkles,
    benefits: ["Criar projetos", "Participar de competições", "Acessar conteúdos"],
    available: true,
    featured: false,
  },
  {
    name: "Pro",
    subtitle: "Mais recursos e visibilidade.",
    price: "R$ 29,90",
    period: "/mês",
    Icon: Rocket,
    benefits: ["Projetos ilimitados", "Equipe expandida", "Destaque na exploração", "Insights e métricas"],
    available: false,
    featured: true,
  },
  {
    name: "Investidor",
    subtitle: "Encontre e apoie projetos.",
    price: "R$ 49,90",
    period: "/mês",
    Icon: ShieldCheck,
    benefits: ["Acesso a projetos selecionados", "Filtros avançados", "Acompanhamento de metas"],
    available: false,
    featured: false,
  },
] as const;

export default function PlansPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Envista — início">
            <Image src="/brand/envista-symbol-gradient.svg" width={34} height={43} alt="" />
            <span>ENVISTA</span>
          </Link>
          <Link className={styles.back} href="/"><ArrowLeft size={17} aria-hidden="true" /> Voltar ao Envista</Link>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.hero} aria-labelledby="plans-heading">
          <span className={styles.eyebrow}><Crown size={15} aria-hidden="true" /> PLANOS ENVISTA</span>
          <h1 id="plans-heading">Planos para <span>cada jornada.</span></h1>
          <p>Escolha o plano ideal para o seu momento. Comece a construir agora e conheça as possibilidades para evoluir com o Envista.</p>
          <div className={styles.heroAccent} aria-hidden="true"><Rocket size={43} strokeWidth={1.5} /></div>
        </section>

        <section className={styles.grid} aria-label="Opções de planos">
          {plans.map((plan) => (
            <article key={plan.name} className={`${styles.card} ${plan.featured ? styles.featured : ""}`}>
              {plan.featured && <span className={styles.featuredTag}><Sparkles size={13} aria-hidden="true" /> MAIS POPULAR</span>}
              <div className={styles.cardTop}>
                <div className={styles.planIcon}><plan.Icon size={24} strokeWidth={1.8} aria-hidden="true" /></div>
                <span className={styles.planAvailability}>{plan.available ? "Disponível" : "Planejado"}</span>
              </div>
              <h2>{plan.name}</h2>
              <p className={styles.subtitle}>{plan.subtitle}</p>
              <div className={styles.price}>
                <strong>{plan.price}</strong><span>{plan.period}</span>
              </div>
              {!plan.available && <p className={styles.priceNote}>Valor indicativo — sujeito a alteração no lançamento.</p>}
              <div className={styles.separator} />
              <ul className={styles.benefits}>
                {plan.benefits.map((benefit) => (
                  <li key={benefit}><Check size={16} aria-hidden="true" />{benefit}</li>
                ))}
              </ul>
              {plan.available ? (
                <Link className={styles.action} href="/register">Começar grátis <ArrowRight size={17} aria-hidden="true" /></Link>
              ) : (
                <span className={styles.unavailable} aria-label={`Plano ${plan.name} ainda não disponível para contratação`}>Disponível em breve</span>
              )}
            </article>
          ))}
        </section>

        <aside className={styles.notice}>
          <span className={styles.noticeIcon}><Sparkles size={20} aria-hidden="true" /></span>
          <div>
            <strong>Os planos pagos estão em preparação.</strong>
            <p>Os recursos e valores do Pro e do Investidor são propostas de lançamento. Ainda não é possível realizar pagamentos ou assinar esses planos.</p>
          </div>
        </aside>

        <footer className={styles.footer}>
          <p>O próximo passo da sua ideia começa aqui.</p>
          <Link href="/">Voltar ao ecossistema <ArrowRight size={16} aria-hidden="true" /></Link>
        </footer>
      </div>
    </main>
  );
}
