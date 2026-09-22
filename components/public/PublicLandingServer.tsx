import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Menu,
  MessageSquareText,
  Radar,
  Rocket,
  School,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./PublicLanding.module.css";

type PublicProject = {
  slug: string;
  title: string;
  short_description: string | null;
  stage: string | null;
  category: string | null;
  tags: string[] | null;
  updated_at: string;
};

const incubationSteps = [
  {
    Icon: Lightbulb,
    index: "01",
    title: "Estruture a ideia",
    copy: "Defina problema, solução, público e objetivo antes de transformar o trabalho em uma página pública.",
  },
  {
    Icon: Users,
    index: "02",
    title: "Construa com equipe",
    copy: "Organize pessoas, responsabilidades e contexto para o projeto continuar evoluindo depois da entrega.",
  },
  {
    Icon: Rocket,
    index: "03",
    title: "Publique a evolução",
    copy: "Mostre estágio, links, atualizações e aprendizados em um portfólio vivo que pode ser compartilhado.",
  },
  {
    Icon: Trophy,
    index: "04",
    title: "Encontre oportunidades",
    copy: "Use o projeto como base para descobrir competições, receber feedback e abrir novas conexões.",
  },
];

const ecosystemPillars = [
  {
    Icon: FolderKanban,
    title: "Projetos vivos",
    copy: "Uma página organizada para mostrar contexto, solução, estágio e evolução real.",
  },
  {
    Icon: GraduationCap,
    title: "Aprendizado aplicado",
    copy: "Conteúdo e execução no mesmo ecossistema, sem separar estudo do que está sendo construído.",
  },
  {
    Icon: Radar,
    title: "Oportunidades",
    copy: "Competições e próximos passos conectados ao perfil do projeto e da equipe.",
  },
  {
    Icon: MessageSquareText,
    title: "Feedback com contexto",
    copy: "Quem acompanha entende o projeto antes de comentar, seguir ou demonstrar interesse.",
  },
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
          <Link href="/projects">Projetos</Link>
          <a href="#como-funciona">Como funciona</a>
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Começar projeto</Link>
        </nav>

        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
            <Link href="/projects">Projetos</Link>
            <a href="#como-funciona">Como funciona</a>
            <Link href="/schools">Para escolas</Link>
            <Link href="/login">Entrar</Link>
            <Link className={styles.headerCta} href="/register">Começar projeto</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <Link className={styles.projectCard} href={`/p/${project.slug}`}>
      <div className={styles.projectTopline}>
        <span>{project.stage || "Projeto em evolução"}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </div>
      <h3>{project.title}</h3>
      <p>{project.short_description || "Projeto publicado no Envista."}</p>
      <div className={styles.projectMeta}>
        {project.category ? <span>{project.category}</span> : null}
        {(project.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </Link>
  );
}

export default async function PublicLandingServer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("slug,title,short_description,stage,category,tags,updated_at")
    .eq("visibility", "platform")
    .order("updated_at", { ascending: false })
    .limit(6);

  const projects = (data ?? []) as PublicProject[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://useenvista.com.br/#organization",
        name: "Envista",
        url: "https://useenvista.com.br",
        logo: "https://useenvista.com.br/envista-logo.png",
      },
      {
        "@type": "WebSite",
        "@id": "https://useenvista.com.br/#website",
        url: "https://useenvista.com.br",
        name: "Envista",
        inLanguage: "pt-BR",
        publisher: { "@id": "https://useenvista.com.br/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        name: "Envista",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: "https://useenvista.com.br",
        description: "Incubadora digital para estudantes e equipes transformarem projetos em portfólios vivos e oportunidades.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <Header />

      <div id="conteudo">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>INCUBADORA DIGITAL DE PROJETOS</span>
            <h1 id="hero-title">Ideias não precisam morrer depois da apresentação.</h1>
            <p>
              O Envista ajuda estudantes e equipes a transformar trabalhos, desafios e projetos autorais em algo que continua evoluindo: com portfólio, equipe, feedback e oportunidades no mesmo lugar.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/register">Começar um projeto <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/projects">Explorar projetos</Link>
            </div>
            <div className={styles.heroSignals}>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Portfólio vivo</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Equipes</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Competições</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Feedback</span>
            </div>
          </div>

          <div className={styles.incubatorPanel} aria-label="Fluxo de incubação no Envista">
            <div className={styles.panelHeader}>
              <div>
                <span>FLUXO DO ENVISTA</span>
                <strong>Projeto em evolução</strong>
              </div>
              <span className={styles.liveBadge}>Ativo</span>
            </div>

            <div className={styles.projectPulse}>
              <div className={styles.projectPulseIcon}><Rocket size={24} aria-hidden="true" /></div>
              <div>
                <small>DO PRIMEIRO RASCUNHO AO PORTFÓLIO</small>
                <h2>Construa → publique → evolua</h2>
                <p>O projeto ganha contexto, histórico e um próximo passo claro.</p>
              </div>
            </div>

            <div className={styles.incubatorTimeline}>
              <div className={styles.timelineItem} data-active="true"><span>01</span><div><strong>Ideia</strong><small>Problema e solução</small></div></div>
              <div className={styles.timelineItem} data-active="true"><span>02</span><div><strong>Construção</strong><small>Equipe e entregas</small></div></div>
              <div className={styles.timelineItem} data-active="true"><span>03</span><div><strong>Portfólio</strong><small>Página pública</small></div></div>
              <div className={styles.timelineItem}><span>04</span><div><strong>Oportunidade</strong><small>Feedback e competições</small></div></div>
            </div>
          </div>
        </section>

        <section className={styles.featuredProjects} aria-labelledby="featured-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>PORTFÓLIO DO ECOSSISTEMA</span>
              <h2 id="featured-title">Projetos para descobrir, acompanhar e compartilhar.</h2>
            </div>
            <div className={styles.sectionAside}>
              <p>Uma vitrine organizada do que estudantes e equipes estão construindo no Envista.</p>
              <Link className={styles.textLink} href="/projects">Ver todos os projetos <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>

          {projects.length ? (
            <div className={styles.projectsGrid}>
              {projects.map((project) => <ProjectCard key={project.slug} project={project} />)}
            </div>
          ) : (
            <div className={styles.emptyProjects}>
              <Sparkles size={22} aria-hidden="true" />
              <div><strong>Os primeiros projetos públicos estão chegando.</strong><span>Publique o seu e transforme-o em uma página que continua evoluindo.</span></div>
              <Link href="/register">Publicar projeto <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          )}
        </section>

        <section className={styles.processSection} id="como-funciona" aria-labelledby="process-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>UM PROCESSO, NÃO SÓ UMA VITRINE</span>
              <h2 id="process-title">Do primeiro rascunho até a próxima oportunidade.</h2>
            </div>
            <div className={styles.sectionAside}>
              <p>O Envista organiza a jornada do projeto em etapas simples para que evolução e contexto não se percam.</p>
            </div>
          </div>

          <div className={styles.stepsGrid}>
            {incubationSteps.map(({ Icon, index, title, copy }) => (
              <article className={styles.stepCard} key={title}>
                <div className={styles.stepCardTop}><span>{index}</span><Icon size={21} aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ecosystemSection} aria-labelledby="ecosystem-title">
          <div className={styles.ecosystemIntro}>
            <span className={styles.kicker}>ECOSSISTEMA ORGANIZADO</span>
            <h2 id="ecosystem-title">Tudo que faz o projeto continuar.</h2>
            <p>Em vez de espalhar o trabalho entre links, arquivos, mensagens e apresentações, o Envista reúne o contexto que realmente importa.</p>
            <Link className={styles.primaryDark} href="/register">Criar meu espaço <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className={styles.pillarsGrid}>
            {ecosystemPillars.map(({ Icon, title, copy }) => (
              <article key={title}>
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.audienceSection} aria-labelledby="audience-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>DOIS LADOS DO MESMO ECOSSISTEMA</span>
              <h2 id="audience-title">Quem constrói encontra quem pode impulsionar.</h2>
            </div>
          </div>

          <div className={styles.audienceGrid}>
            <article className={styles.audienceCard}>
              <div className={styles.audienceIcon}><School size={23} aria-hidden="true" /></div>
              <span>ESTUDANTES, EQUIPES E ESCOLAS</span>
              <h3>Projeto como parte da aprendizagem.</h3>
              <p>Organize iniciativas, challenges e trabalhos em um formato que valoriza processo, colaboração e resultado.</p>
              <Link href="/schools">Conhecer o Envista para escolas <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>

            <article className={styles.audienceCard}>
              <div className={styles.audienceIcon}><Compass size={23} aria-hidden="true" /></div>
              <span>MENTORES, EMPRESAS E INVESTIDORES</span>
              <h3>Descoberta com contexto antes do contato.</h3>
              <p>Veja problema, solução, equipe e estágio antes de acompanhar, orientar ou demonstrar interesse em um projeto.</p>
              <Link href="/projects">Explorar projetos <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          </div>
        </section>

        <section className={styles.opportunityStrip} aria-labelledby="opportunity-title">
          <div className={styles.opportunityIcon}><Target size={24} aria-hidden="true" /></div>
          <div>
            <span className={styles.kicker}>PRÓXIMO PASSO</span>
            <h2 id="opportunity-title">O projeto fica pronto para oportunidades, não só para avaliação.</h2>
            <p>Competições, feedback, conexões e novas entregas passam a fazer parte da mesma jornada.</p>
          </div>
          <Link className={styles.primaryDark} href="/register">Começar agora <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </div>

      <footer className={styles.footer}>
        <div>
          <Link className={styles.brand} href="/"><Image src="/envista-logo.png" alt="" width={26} height={26} /><span>Envista</span></Link>
          <p>Projetos que continuam depois da entrega.</p>
        </div>
        <nav aria-label="Links institucionais">
          <Link href="/projects">Projetos</Link>
          <Link href="/schools">Para escolas</Link>
          <Link href="/privacy">Privacidade</Link>
          <Link href="/terms">Termos</Link>
          <Link href="/login">Entrar</Link>
        </nav>
      </footer>
    </main>
  );
}
