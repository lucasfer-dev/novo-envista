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
          <Image src="/brand/envista-symbol-gradient.svg" alt="" width={31} height={42} priority />
          <span className={styles.brandName}>ENVISTA<span className={styles.brandPeriod}>.</span></span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Começar projeto</Link>
        </nav>

        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
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

function ProjectCard({ project, index }: { project: PublicProject; index: number }) {
  return (
    <Link className={styles.projectCard} href={`/p/${project.slug}`}>
      <div className={styles.projectArtwork} aria-hidden="true">
        <span className={styles.projectArtworkIndex}>{String(index + 1).padStart(2, "0")}</span>
        <Image src="/brand/envista-symbol-white.svg" alt="" width={88} height={116} />
        <span className={styles.projectArtworkLabel}>ENVISTA / PROJETOS</span>
      </div>
      <div className={styles.projectTopline}>
        <span>{project.stage || "Em desenvolvimento"}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </div>
      <div className={styles.projectCardCopy}>
        <h3>{project.title}</h3>
        <p>{project.short_description || "Conheça o percurso e os próximos passos deste projeto."}</p>
        <div className={styles.projectMeta}>
          {project.category ? <span>{project.category}</span> : null}
          {(project.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
    </Link>
  );
}

export default async function PublicLandingServer() {
  let projects: PublicProject[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  // Keep the public landing resilient when Supabase is unavailable (and in the
  // browser E2E environment, which intentionally uses a placeholder endpoint).
  if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("projects")
        .select("slug,title,short_description,stage,category,tags,updated_at")
        .eq("visibility", "platform")
        .order("updated_at", { ascending: false })
        .limit(6);
      projects = (data ?? []) as PublicProject[];
    } catch {
      projects = [];
    }
  }

  const spotlight = projects[0] ?? null;

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
    <main className={styles.page} data-envista-public-shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <Header />

      <div id="conteudo">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <div className={styles.heroMeta}>
              <span className={styles.kicker}>INCUBADORA DE PROJETOS / 2026</span>
              <span className={styles.heroEdition}>IDÉIAS QUE CONTINUAM</span>
            </div>
            <h1 id="hero-title">
              Seu projeto<br />
              merece ir <span className={styles.heroAccent}>além.</span>
            </h1>
            <p>
              Da primeira ideia ao mundo real. Organize sua equipe, dê vida ao seu
              portfólio e encontre oportunidades para o que você está construindo.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.editorialCta} href="/register">
                Começar meu projeto <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className={styles.editorialOutline} href="/projects">
                Explorar a comunidade <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.heroSignals} aria-label="O que você encontra no Envista">
              <span><span className={styles.signalDot} /> Uma ideia</span>
              <span><span className={styles.signalDot} /> Muitas conexões</span>
              <span><span className={styles.signalDot} /> Novos caminhos</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroVisualPattern} aria-hidden="true" />
            <div className={styles.heroVisualSignature} aria-hidden="true">
              <Image src="/brand/envista-symbol-gradient.svg" alt="" width={270} height={360} />
            </div>
            <div className={styles.heroVisualCaption}>
              <span>01 / PENSE</span><span>02 / CRIE</span><span>03 / COMPARTILHE</span>
            </div>

            <div className={styles.showcaseWindow}>
              <div className={styles.showcaseChrome}>
                <div className={styles.showcaseChromeDots} aria-hidden="true"><i /><i /><i /></div>
                <span>PORTFÓLIO · ENVISTA</span>
                <span className={styles.showcaseChromeArrow}>↗</span>
              </div>
              <div className={styles.showcaseCover}>
                <span>{spotlight ? "UM PROJETO DA COMUNIDADE" : "PRÉVIA DA EXPERIÊNCIA"}</span>
                <div className={styles.showcaseCoverSymbol}>
                  <Image src="/brand/envista-symbol-white.svg" alt="" width={82} height={110} />
                </div>
                <span>DE IDEIA A IMPACTO / <strong>∞</strong></span>
              </div>
              <div className={styles.showcaseBody}>
                <div className={styles.showcaseState}><span className={styles.showcaseStateDot} />
                  {spotlight?.stage || "Seu próximo capítulo"}
                </div>
                <h2>{spotlight?.title || "O futuro começa com o que você cria."}</h2>
                <p>{spotlight?.short_description || "Crie um espaço para mostrar a evolução do seu trabalho e conectá-lo a novas oportunidades."}</p>
                <div className={styles.showcaseChips}>
                  <span>Projeto</span><span>Equipe</span><span>Portfólio</span>
                </div>
              </div>
              <div className={styles.showcaseBottom}>
                <span>UM PROJETO. INFINITAS POSSIBILIDADES.</span>
                <Link href={spotlight ? `/p/${spotlight.slug}` : "/projects"} aria-label={spotlight ? "Abrir projeto em destaque" : "Explorar projetos"}>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className={styles.heroVisualStamp} aria-hidden="true">FEITO PARA<br />IR ALÉM ↗</div>
          </div>
        </section>

        <div className={styles.manifestoStrip} aria-label="Da ideia às oportunidades">
          <span>IDEIAS</span><b>✳</b><span>PROJETOS</span><b>✳</b><span>CONEXÕES</span><b>✳</b><span>OPORTUNIDADES</span>
        </div>

        <section className={styles.featuredProjects} aria-labelledby="featured-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>PORTFÓLIO DO ECOSSISTEMA</span>
              <h2 id="featured-title">Projetos que não ficam <em>na gaveta.</em></h2>
            </div>
            <div className={styles.sectionAside}>
              <p>Uma vitrine organizada do que estudantes e equipes estão construindo no Envista.</p>
              <Link className={styles.textLink} href="/projects">Ver todos os projetos <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>

          {projects.length ? (
            <div className={styles.projectsGrid}>
              {projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}
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
              <h2 id="process-title">Uma ideia é só <em>o começo.</em></h2>
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
            <h2 id="ecosystem-title">Tudo o que uma boa ideia precisa para <em>acontecer.</em></h2>
            <p>Em vez de espalhar o trabalho entre links, arquivos, mensagens e apresentações, o Envista reúne o contexto que realmente importa.</p>
            <Link className={styles.lightCta} href="/register">Criar meu espaço <ArrowRight size={17} aria-hidden="true" /></Link>
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
              <h2 id="audience-title">Diferentes pessoas. <em>O mesmo impulso.</em></h2>
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
            <h2 id="opportunity-title">Não termine na apresentação. <em>Comece por ela.</em></h2>
            <p>Competições, feedback, conexões e novas entregas passam a fazer parte da mesma jornada.</p>
          </div>
          <Link className={styles.lightCta} href="/register">Começar agora <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </div>

      <footer className={styles.footer}>
        <div>
          <Link className={styles.brand} href="/" aria-label="Página inicial do Envista"><Image src="/brand/envista-symbol-gradient.svg" alt="" width={27} height={36} /><span className={styles.brandName}>ENVISTA<span className={styles.brandPeriod}>.</span></span></Link>
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
