import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FolderKanban,
  Menu,
  Rocket,
  School,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import styles from "./PublicLanding.module.css";

const journey = [
  {
    Icon: BookOpen,
    title: "Aprenda",
    copy: "Conteúdo prático conectado ao que você quer construir.",
  },
  {
    Icon: Users,
    title: "Forme sua equipe",
    copy: "Encontre pessoas, organize papéis e mantenha o trabalho visível.",
  },
  {
    Icon: FolderKanban,
    title: "Construa",
    copy: "Transforme a ideia em projeto, registre progresso e publique resultados.",
  },
  {
    Icon: Sparkles,
    title: "Encontre o próximo passo",
    copy: "Descubra competições, oportunidades e pessoas interessadas no projeto.",
  },
];

const productSignals = [
  "Projetos como portfólio vivo",
  "Equipes e colaboração no mesmo espaço",
  "Aprendizado ligado à execução",
  "Descoberta para participantes e investidores",
];

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Envista — página inicial">
          <Image src="/envista-logo.png" alt="" width={30} height={30} priority />
          <span>Envista</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <Link href="/about">Sobre</Link>
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Criar conta</Link>
        </nav>

        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
            <Link href="/about">Sobre</Link>
            <Link href="/schools">Para escolas</Link>
            <Link href="/login">Entrar</Link>
            <Link className={styles.headerCta} href="/register">Criar conta</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export default function PublicLandingServer() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <Header />

      <div id="conteudo">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>ECOSSISTEMA DE INOVAÇÃO</span>
            <h1 id="hero-title">Ideias não deveriam terminar depois da competição.</h1>
            <p>
              O Envista conecta aprendizado, equipes, projetos, competições e oportunidades em uma jornada única — da primeira ideia ao próximo passo.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/register">Começar agora <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/about">Conhecer o Envista</Link>
            </div>
            <div className={styles.heroProof} aria-label="Principais áreas do produto">
              <span><CheckCircle2 size={15} aria-hidden="true" /> Projetos</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Equipes</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Aprendizado</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Oportunidades</span>
            </div>
          </div>

          <div className={styles.productPreview} aria-label="Resumo visual da jornada no Envista">
            <div className={styles.previewTop}>
              <span className={styles.previewBrand}><Image src="/envista-logo.png" alt="" width={22} height={22} /> Envista</span>
              <span className={styles.statusDot}>Ecossistema ativo</span>
            </div>
            <div className={styles.previewHero}>
              <div className={styles.previewIcon}><Rocket size={24} aria-hidden="true" /></div>
              <div><small>SEU PRÓXIMO PASSO</small><strong>Construa algo que continue.</strong><p>Aprender → equipe → projeto → oportunidade</p></div>
            </div>
            <div className={styles.previewGrid}>
              <div><Users size={18} aria-hidden="true" /><strong>Equipe</strong><span>Colabore com contexto.</span></div>
              <div><Trophy size={18} aria-hidden="true" /><strong>Competições</strong><span>Descubra oportunidades.</span></div>
              <div><Eye size={18} aria-hidden="true" /><strong>Visibilidade</strong><span>Mostre evolução real.</span></div>
              <div><BookOpen size={18} aria-hidden="true" /><strong>Aprender</strong><span>Avance construindo.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="journey-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.kicker}>COMO FUNCIONA</span><h2 id="journey-title">Uma jornada clara para transformar intenção em progresso.</h2></div>
            <p>Menos ferramentas soltas. Mais continuidade entre aprender, colaborar, construir e encontrar oportunidades.</p>
          </div>
          <div className={styles.journeyGrid}>
            {journey.map(({ Icon, title, copy }, index) => (
              <article className={styles.journeyCard} key={title}>
                <span className={styles.step}>0{index + 1}</span>
                <Icon size={21} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.productSection} aria-labelledby="product-title">
          <div className={styles.productCopy}>
            <span className={styles.kicker}>UM PRODUTO, NÃO UM ARQUIVO MORTO</span>
            <h2 id="product-title">Seu projeto continua evoluindo depois da apresentação.</h2>
            <p>
              O Envista organiza o que normalmente fica espalhado: quem está construindo, o que mudou, o que falta aprender e qual oportunidade faz sentido agora.
            </p>
            <ul>
              {productSignals.map((signal) => <li key={signal}><CheckCircle2 size={17} aria-hidden="true" /> {signal}</li>)}
            </ul>
            <Link className={styles.textLink} href="/register">Criar meu espaço no Envista <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className={styles.workflowCard}>
            <div className={styles.workflowHead}><span>Projeto em evolução</span><span className={styles.stage}>MVP</span></div>
            <h3>Da ideia para algo demonstrável</h3>
            <p>Problema, solução, equipe, atualizações e próximos passos ficam no mesmo contexto.</p>
            <div className={styles.progressTrack}><i /></div>
            <div className={styles.workflowMeta}><span>Validação</span><strong>72%</strong></div>
            <div className={styles.workflowRows}>
              <span><CheckCircle2 size={16} aria-hidden="true" /> Problema definido</span>
              <span><CheckCircle2 size={16} aria-hidden="true" /> Equipe formada</span>
              <span><Rocket size={16} aria-hidden="true" /> Próximo: testar protótipo</span>
            </div>
          </div>
        </section>

        <section className={styles.audiences} aria-labelledby="audiences-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.kicker}>PARA QUEM CONSTRÓI E PARA QUEM DESCOBRE</span><h2 id="audiences-title">O mesmo ecossistema, com experiências diferentes.</h2></div>
          </div>
          <div className={styles.audienceGrid}>
            <article>
              <div className={styles.audienceIcon}><School size={22} aria-hidden="true" /></div>
              <span>PARTICIPANTES E ESCOLAS</span>
              <h3>Aprendizado que vira projeto.</h3>
              <p>Organize equipes, construa portfólio e acompanhe a evolução sem perder o contexto entre uma etapa e outra.</p>
              <Link href="/schools">Conhecer a experiência educacional <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
            <article>
              <div className={styles.audienceIcon}><BriefcaseBusiness size={22} aria-hidden="true" /></div>
              <span>INVESTIDORES</span>
              <h3>Descoberta com contexto, não só um pitch.</h3>
              <p>Entenda problema, solução, estágio, equipe e progresso antes de decidir acompanhar ou demonstrar interesse.</p>
              <Link href="/login">Acessar como investidor <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <span className={styles.kicker}>ENVISTA</span>
          <h2>Existe uma ideia esperando pelo próximo passo.</h2>
          <p>Comece com o que você já tem. O Envista ajuda a organizar o que vem depois.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/register">Criar conta <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className={styles.secondary} href="/login">Já tenho uma conta</Link>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/"><Image src="/envista-logo.png" alt="" width={26} height={26} /><span>Envista</span></Link>
        <p>Aprenda, construa e transforme ideias em oportunidades.</p>
        <nav aria-label="Links institucionais"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/login">Entrar</Link></nav>
      </footer>
    </main>
  );
}
