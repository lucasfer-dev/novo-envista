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
    copy: "Compartilhe seu projeto, receba feedback e descubra competições e oportunidades.",
  },
];

const productSignals = [
  "Projetos como portfólio vivo",
  "Equipes e colaboração no mesmo espaço",
  "Aprendizado ligado à execução",
  "Página pública pronta para compartilhar",
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
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Criar conta</Link>
        </nav>

        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
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
            <span className={styles.kicker}>PROJETOS QUE CONTINUAM DEPOIS DA ENTREGA</span>
            <h1 id="hero-title">Transforme seu projeto em portfólio, visibilidade e novas oportunidades.</h1>
            <p>
              Publique o que você está construindo, organize sua equipe, mostre evolução real e tenha uma página profissional para compartilhar em processos seletivos, competições e com quem pode ajudar o projeto a crescer.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/register">Publicar meu projeto <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/schools">Envista para escolas</Link>
            </div>
            <div className={styles.heroProof} aria-label="Principais áreas do produto">
              <span><CheckCircle2 size={15} aria-hidden="true" /> Projetos</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Equipes</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Portfólio</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Compartilhamento</span>
            </div>
          </div>

          <div className={styles.productPreview} aria-label="Resumo visual da jornada no Envista">
            <div className={styles.previewTop}>
              <span className={styles.previewBrand}><Image src="/envista-logo.png" alt="" width={22} height={22} /> Envista</span>
              <span className={styles.statusDot}>Ecossistema ativo</span>
            </div>
            <div className={styles.previewHero}>
              <div className={styles.previewIcon}><Rocket size={24} aria-hidden="true" /></div>
              <div><small>SEU PROJETO, VISÍVEL</small><strong>Construa algo que continue.</strong><p>Projeto → página pública → feedback → oportunidade</p></div>
            </div>
            <div className={styles.previewGrid}>
              <div><Users size={18} aria-hidden="true" /><strong>Equipe</strong><span>Colabore com contexto.</span></div>
              <div><Trophy size={18} aria-hidden="true" /><strong>Competições</strong><span>Descubra oportunidades.</span></div>
              <div><Eye size={18} aria-hidden="true" /><strong>Portfólio vivo</strong><span>Compartilhe evolução real.</span></div>
              <div><BookOpen size={18} aria-hidden="true" /><strong>Aprender</strong><span>Avance construindo.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="journey-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.kicker}>COMO FUNCIONA</span><h2 id="journey-title">Do trabalho de aula para um projeto que pode ser mostrado ao mundo.</h2></div>
            <p>Crie, organize, publique e compartilhe. O valor começa no seu próprio projeto e cresce conforme outras pessoas interagem com ele.</p>
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
              O Envista reúne problema, solução, equipe, links, estágio e evolução em uma página pública que você pode usar como portfólio e atualizar conforme o projeto cresce.
            </p>
            <ul>
              {productSignals.map((signal) => <li key={signal}><CheckCircle2 size={17} aria-hidden="true" /> {signal}</li>)}
            </ul>
            <Link className={styles.textLink} href="/register">Publicar meu primeiro projeto <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className={styles.workflowCard}>
            <div className={styles.workflowHead}><span>Projeto em evolução</span><span className={styles.stage}>Em validação</span></div>
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
              <span>ESTUDANTES, EQUIPES E ESCOLAS</span>
              <h3>Aprendizado que vira projeto.</h3>
              <p>Transforme trabalhos, challenges e projetos autorais em páginas profissionais, portfólio e histórico de evolução.</p>
              <Link href="/schools">Conhecer a experiência educacional <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
            <article>
              <div className={styles.audienceIcon}><BriefcaseBusiness size={22} aria-hidden="true" /></div>
              <span>EMPRESAS, MENTORES E INVESTIDORES</span>
              <h3>Descubra projetos e talentos com contexto.</h3>
              <p>Veja problema, solução, estágio, equipe e progresso antes de acompanhar, dar feedback ou demonstrar interesse.</p>
              <Link href="/login">Explorar o ecossistema <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <span className={styles.kicker}>ENVISTA</span>
          <h2>Seu próximo projeto já pode começar como portfólio.</h2>
          <p>Publique o que você já construiu, compartilhe uma página profissional e continue evoluindo depois da entrega.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/register">Publicar meu projeto <ArrowRight size={17} aria-hidden="true" /></Link>
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
