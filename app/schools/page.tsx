import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FolderKanban,
  Menu,
  School,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import styles from "@/components/public/PublicLanding.module.css";

export const metadata = {
  title: "Para escolas | Envista",
  description: "Use o Envista para conectar aprendizagem prática, equipes, projetos e oportunidades dentro da escola.",
};

const schoolJourney = [
  { Icon: BookOpen, index: "01", title: "Aprender", copy: "Conteúdos e atividades viram entregas concretas, em vez de terminar em uma aula isolada." },
  { Icon: Users, index: "02", title: "Formar equipes", copy: "Alunos organizam colaboração, papéis e contexto ao redor do que estão construindo." },
  { Icon: FolderKanban, index: "03", title: "Construir projetos", copy: "Problema, solução, progresso e evidências permanecem registrados em um portfólio vivo." },
  { Icon: Trophy, index: "04", title: "Encontrar oportunidades", copy: "Competições e novas etapas passam a fazer parte de uma jornada contínua de desenvolvimento." },
];

const schoolPillars = [
  { Icon: School, title: "Visão da jornada", copy: "A instituição acompanha projetos como processo, não apenas como entrega final." },
  { Icon: Users, title: "Colaboração", copy: "Equipes, papéis e evolução ficam organizados no mesmo ambiente." },
  { Icon: FolderKanban, title: "Portfólio vivo", copy: "Cada projeto ganha uma página compartilhável que continua evoluindo." },
  { Icon: Trophy, title: "Próximos passos", copy: "Oportunidades e competições deixam de ficar desconectadas do projeto." },
];

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Envista — página inicial">
          <Image src="/brand/envista-symbol-gradient.svg" alt="" width={30} height={30} priority />
          <span className={styles.brandWord}>Envista</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <Link href="/projects">Projetos</Link>
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Começar projeto</Link>
        </nav>
        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
            <Link href="/projects">Projetos</Link>
            <Link href="/schools">Para escolas</Link>
            <Link href="/login">Entrar</Link>
            <Link className={styles.headerCta} href="/register">Começar projeto</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export default function SchoolsPage() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <Header />
      <div id="conteudo">
        <section className={styles.hero} aria-labelledby="school-title">
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>ENVISTA PARA ESCOLAS</span>
            <h1 id="school-title">Projetos dos alunos não precisam terminar <span className={styles.heroAccent}>na apresentação.</span></h1>
            <p>O Envista cria continuidade entre aprendizagem prática, formação de equipes, desenvolvimento de projetos e descoberta de oportunidades.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/register">Experimentar o Envista <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/projects">Explorar projetos</Link>
            </div>
            <div className={styles.heroSignals}>
              <span>Aprendizagem prática</span><span>Equipes</span><span>Portfólio</span><span>Competições</span>
            </div>
          </div>

          <div className={styles.incubatorPanel} aria-label="Jornada educacional no Envista">
            <div className={styles.panelHeader}>
              <div><span>JORNADA EDUCACIONAL</span><strong>Do conteúdo ao projeto</strong></div>
              <span className={styles.liveBadge}>Contínua</span>
            </div>
            <div className={styles.projectPulse}>
              <div className={styles.projectPulseIcon}><School size={24} aria-hidden="true" /></div>
              <div><small>APRENDER CONSTRUINDO</small><h2>Aula → equipe → projeto → oportunidade</h2><p>O progresso deixa de ficar espalhado entre arquivos, links e apresentações.</p></div>
            </div>
            <div className={styles.incubatorTimeline}>
              <div className={styles.timelineItem} data-active="true"><span>01</span><div><strong>Aprender</strong><small>Conteúdo aplicado</small></div></div>
              <div className={styles.timelineItem} data-active="true"><span>02</span><div><strong>Colaborar</strong><small>Equipe organizada</small></div></div>
              <div className={styles.timelineItem} data-active="true"><span>03</span><div><strong>Construir</strong><small>Projeto em evolução</small></div></div>
              <div className={styles.timelineItem}><span>04</span><div><strong>Avançar</strong><small>Portfólio e oportunidades</small></div></div>
            </div>
          </div>
        </section>

        <section className={styles.processSection} aria-labelledby="school-journey">
          <div className={styles.sectionHeading}>
            <div><span className={styles.kicker}>UMA JORNADA PARA O ALUNO</span><h2 id="school-journey">Estrutura para aprender, colaborar e continuar evoluindo.</h2></div>
            <div className={styles.sectionAside}><p>O Envista não substitui professor ou metodologia. Ele organiza a continuidade do trabalho e torna o progresso mais visível.</p></div>
          </div>
          <div className={styles.stepsGrid}>
            {schoolJourney.map(({ Icon, index, title, copy }) => (
              <article className={styles.stepCard} key={title}>
                <div className={styles.stepCardTop}><span>{index}</span><Icon size={21} aria-hidden="true" /></div>
                <h3>{title}</h3><p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ecosystemSection} aria-labelledby="school-ecosystem">
          <div className={styles.ecosystemIntro}>
            <span className={styles.kicker}>ECOSSISTEMA DA INSTITUIÇÃO</span>
            <h2 id="school-ecosystem">Mais contexto para quem ensina e para quem constrói.</h2>
            <p>Projetos deixam de ser arquivos isolados e passam a ter histórico, equipe, apresentação pública e próximos passos claros.</p>
            <Link className={styles.primaryDark} href="/register">Criar uma conta <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className={styles.pillarsGrid}>
            {schoolPillars.map(({ Icon, title, copy }) => <article key={title}><Icon size={20} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className={styles.opportunityStrip}>
          <div className={styles.opportunityIcon}><Target size={24} aria-hidden="true" /></div>
          <div><span className={styles.kicker}>COMECE PEQUENO</span><h2>Uma turma, uma equipe ou um projeto já é um começo.</h2><p>A experiência pode crescer junto com o uso real da instituição e dos participantes.</p></div>
          <Link className={styles.primaryDark} href="/register">Começar agora <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </div>

      <footer className={styles.footer}>
        <div>
          <Link className={styles.brand} href="/"><Image src="/brand/envista-symbol-gradient.svg" alt="" width={26} height={26} /><span className={styles.brandWord}>Envista</span></Link>
          <p>Projetos que continuam depois da entrega.</p>
        </div>
        <nav aria-label="Links institucionais"><Link href="/projects">Projetos</Link><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/login">Entrar</Link></nav>
      </footer>
    </main>
  );
}
