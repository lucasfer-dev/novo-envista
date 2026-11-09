import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Compass, FolderKanban, GraduationCap,
  Lightbulb, Menu, Network, Rocket, School, Sparkles,
  Target, TrendingUp, Trophy, UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./PublicLandingV3.module.css";
import PublicSiteHeader from "./PublicSiteHeader";

type PublicProject = {
  slug: string;
  title: string;
  short_description: string | null;
  stage: string | null;
  category: string | null;
  tags: string[] | null;
  updated_at: string;
};

const steps = [
  { Icon: Lightbulb, number: "01", title: "Estruture a ideia", text: "Defina o problema, a solução e o objetivo que deseja alcançar." },
  { Icon: FolderKanban, number: "02", title: "Construa o projeto", text: "Organize sua equipe, planeje etapas e utilize ferramentas práticas." },
  { Icon: TrendingUp, number: "03", title: "Evolua com apoio", text: "Aprenda, receba feedback e melhore sua solução com a comunidade." },
  { Icon: Trophy, number: "04", title: "Encontre oportunidades", text: "Conecte seu trabalho a competições, mentores e possíveis parceiros." },
];

const features = [
  { Icon: FolderKanban, title: "Projetos vivos", text: "Páginas para documentar contexto, evolução e resultados." },
  { Icon: BookOpen, title: "Aprendizado aplicado", text: "Conteúdos e desafios para desenvolver competências na prática." },
  { Icon: Network, title: "Conexões reais", text: "Encontre pessoas e colabore em iniciativas com propósito." },
  { Icon: Trophy, title: "Oportunidades", text: "Explore competições, editais e programas de incentivo." },
  { Icon: UsersRound, title: "Gestão da equipe", text: "Organize tarefas, responsabilidades e próximos passos." },
  { Icon: TrendingUp, title: "Portfólio vivo", text: "Mostre sua trajetória e conquistas de forma organizada." },
];

const audiences = [
  { Icon: GraduationCap, title: "Estudantes", text: "Tire suas ideias do papel, aprenda na prática e construa um portfólio real.", href: "/register" },
  { Icon: UsersRound, title: "Equipes", text: "Colabore, divida responsabilidades e desenvolva projetos com impacto.", href: "/register" },
  { Icon: School, title: "Escolas", text: "Incentive a inovação e acompanhe projetos e aprendizados.", href: "/schools" },
  { Icon: Rocket, title: "Mentores e investidores", text: "Descubra talentos, oriente projetos e encontre soluções com potencial.", href: "/projects" },
];

const sampleProjects = [
  { title: "EcoTrack", description: "Conceito de monitoramento ambiental com inteligência artificial.", category: "Sustentabilidade", art: "eco" },
  { title: "AcessIA", description: "Conceito de tecnologia assistiva para experiências mais acessíveis.", category: "Inclusão", art: "tech" },
  { title: "BioCiclo", description: "Conceito de reaproveitamento inteligente de resíduos.", category: "Inovação", art: "nature" },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/" className={footer ? styles.footerBrand : styles.brand} aria-label="Envista — início">
      <Image src="/brand/envista-symbol-gradient.svg" alt="" width={36} height={46} priority={!footer} />
      <span className={styles.brandWord}>ENVISTA</span>
      {!footer && <span className={styles.brandCaption}>ECOSSISTEMA<br />DE INOVAÇÃO</span>}
    </Link>
  );
}

function ProjectCard({ project, index }: { project: PublicProject | null; index: number }) {
  const sample = sampleProjects[index] ?? sampleProjects[0];
  const isSample = !project;
  const title = project?.title || sample.title;
  const description = project?.short_description || (isSample ? sample.description : "Veja o percurso e os próximos passos deste projeto.");
  const category = project?.category || (isSample ? sample.category : "Em desenvolvimento");
  return (
    <Link href={project ? "/p/" + encodeURIComponent(project.slug) : "/projects"}
      className={styles.projectCard}
      aria-label={isSample ? "Exemplo ilustrativo: " + title + ". Explorar projetos" : "Abrir projeto " + title}>
      <div className={[styles.projectArt, styles["art" + index]].join(" ")}>
        {index === 0 ? <div className={styles.forestShape} aria-hidden="true"><span /><span /><span /><span /><span /></div> : null}
        {index === 1 ? <div className={styles.robotShape} aria-hidden="true"><Sparkles size={86} strokeWidth={1.15} /></div> : null}
        {index === 2 ? <div className={styles.sproutShape} aria-hidden="true"><span /><span /><i /></div> : null}
        <span className={styles.cardArtworkSeal}><Image src="/brand/envista-symbol-white.svg" alt="" width={18} height={24} /></span>
        {isSample ? <span className={styles.demoTag}>Exemplo ilustrativo</span> : null}
      </div>
      <div className={styles.projectCardContent}>
        <div className={styles.cardTitleLine}><h3>{title}</h3><ArrowRight size={18} aria-hidden="true" /></div>
        <p>{description}</p>
        <span className={styles.projectTag}>{category}</span>
      </div>
    </Link>
  );
}

export default async function PublicLandingV3Server() {
  let projects: PublicProject[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl && !supabaseUrl.includes("example.supabase.co")) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("projects")
        .select("slug,title,short_description,stage,category,tags,updated_at")
        .eq("visibility", "platform")
        .order("updated_at", { ascending: false }).limit(3);
      projects = (data ?? []) as PublicProject[];
    } catch {
      projects = [];
    }
  }

  return (
    <div className={styles.page} data-envista-public-shell>
      <a href="#conteudo" className={styles.skip}>Pular para o conteúdo</a>
      <PublicSiteHeader />
      <main id="conteudo">
        <section className={styles.hero} aria-labelledby="envista-hero">
          <div className={styles.heroPattern} aria-hidden="true" />
          <div className={styles.earth} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}><span className={styles.glowDot} /> ECOSSISTEMA DE INOVAÇÃO <span className={styles.edition}>IDEIAS QUE GANHAM VIDA</span></div>
              <h1 id="envista-hero">Tire sua ideia do<br />papel e <span>vá além.</span></h1>
              <p>O Envista é um ecossistema de inovação que oferece ferramentas, conhecimento e conexões para desenvolver ideias, construir projetos e encontrar oportunidades reais.</p>
              <div className={styles.heroActions}>
                <Link className={styles.primary} href="/register">Começar meu projeto <ArrowRight aria-hidden="true" size={19} /></Link>
                <a className={styles.secondary} href="#como-funciona"><span className={styles.play} aria-hidden="true">▶</span> Ver como funciona</a>
              </div>
            </div>
            <div className={styles.heroVisual} aria-label="Prévia ilustrativa do Envista no celular">
              <Image className={styles.brandGhost} src="/brand/envista-symbol-gradient.svg" alt="" width={280} height={380} aria-hidden="true" />
              <span className={[styles.orbit, styles.orbitOne].join(" ")} aria-hidden="true" />
              <span className={[styles.orbit, styles.orbitTwo].join(" ")} aria-hidden="true" />
              <div className={[styles.floatCard, styles.floatOne].join(" ")}><Rocket size={23} aria-hidden="true" /><strong>Ferramentas<br />para construir</strong></div>
              <div className={[styles.floatCard, styles.floatTwo].join(" ")}><BookOpen size={23} aria-hidden="true" /><strong>Conhecimento<br />para evoluir</strong></div>
              <div className={[styles.floatCard, styles.floatThree].join(" ")}><UsersRound size={24} aria-hidden="true" /><strong>Conexões que<br />aceleram</strong></div>
              <div className={[styles.floatCard, styles.floatFour].join(" ")}><Trophy size={23} aria-hidden="true" /><strong>Oportunidades<br />reais</strong></div>
              <div className={styles.phone} aria-hidden="true">
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneStatus}><span>9:41</span><span className={styles.phoneNotch} /><span>● ▰ ▰</span></div>
                  <div className={styles.phoneNav}><span><Image src="/brand/envista-symbol-gradient.svg" alt="" width={18} height={23} /> ENVISTA</span><Menu size={17} /></div>
                  <div className={styles.phoneContent}>
                    <span className={styles.phoneCaption}>PRÉVIA DA EXPERIÊNCIA</span>
                    <h2>Meus projetos</h2>
                    <div className={styles.phoneProjectCover}><span>EcoTrack</span></div>
                    <h3>EcoTrack</h3>
                    <p>Monitoramento ambiental com IA e dados em tempo real.</p>
                    <div className={styles.phoneTags}><span>Sustentabilidade</span><span>Tecnologia</span></div>
                    <div className={styles.phoneProgressLabel}>Evolução do projeto <strong>60%</strong></div>
                    <div className={styles.phoneProgress}><i /></div>
                  </div>
                  <div className={styles.phoneBottom}><span>⌂<small>Início</small></span><span>▣<small>Projetos</small></span><span className={styles.phonePlus}>+</span><span>♧<small>Aprender</small></span><span>♙<small>Perfil</small></span></div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.journey} aria-label="Da ideia às oportunidades">
            <span><Lightbulb aria-hidden="true" /> Ideia</span><ArrowRight className={styles.journeyArrow} aria-hidden="true" />
            <span><FolderKanban aria-hidden="true" /> Projetos</span><ArrowRight className={styles.journeyArrow} aria-hidden="true" />
            <span><UsersRound aria-hidden="true" /> Conexões</span><ArrowRight className={styles.journeyArrow} aria-hidden="true" />
            <span><Trophy aria-hidden="true" /> Oportunidades</span>
          </div>
        </section>

        <section className={styles.featured} id="projetos" aria-labelledby="featured-title">
          <div className={styles.container}>
            <div className={styles.featuredLayout}>
              <div className={styles.featuredIntro}>
                <span className={styles.kicker}>EM DESTAQUE NO ENVISTA</span>
                <h2 id="featured-title">Projetos que transformam ideias em <em>impacto.</em></h2>
                <p>Descubra iniciativas que ganham forma, conectam pessoas e evoluem com apoio do ecossistema.</p>
                <Link href="/projects" className={styles.textLink}>Explorar todos os projetos <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
              <div className={styles.projectsGrid}>
                {[0, 1, 2].map(index => <ProjectCard key={index} index={index} project={projects[index] ?? null} />)}
              </div>
            </div>
            {projects.length < 3 ? <p className={styles.demoDisclaimer}>As prévias identificadas como “Exemplo ilustrativo” demonstram possibilidades de uso, não projetos publicados por usuários.</p> : null}
          </div>
        </section>

        <section className={styles.process} id="como-funciona" aria-labelledby="process-title">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div><span className={styles.kicker}>DO CONCEITO À REALIDADE</span><h2 id="process-title">Uma jornada<br />simples e <em>guiada.</em></h2></div>
              <p>Você evolui no seu ritmo, com apoio, ferramentas e conexões em cada etapa do projeto.</p>
            </div>
            <div className={styles.stepsGrid}>
              {steps.map(({ Icon, number, title, text }, i) => (
                <div className={styles.stepWrap} key={number}>
                  <article className={styles.step}>
                    <div className={styles.stepIcon}><Icon aria-hidden="true" size={25} /></div>
                    <span className={styles.stepIndex}>{number}</span>
                    <h3>{title}</h3><p>{text}</p>
                  </article>
                  {i < steps.length - 1 && <ArrowRight className={styles.betweenSteps} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ecosystem} id="ecossistema" aria-labelledby="ecosystem-title">
          <div className={styles.container}>
            <div className={styles.ecosystemLayout}>
              <div className={styles.ecosystemIntro}><span className={styles.kicker}>O ECOSSISTEMA</span><h2 id="ecosystem-title">Tudo o que você precisa para <em>inovar,</em> em um só lugar.</h2></div>
              <div className={styles.featureGrid}>
                {features.map(({ Icon, title, text }) => <article className={styles.feature} key={title}><Icon size={27} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.audience} id="publicos" aria-labelledby="audience-title">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div><span className={styles.kicker}>PARA QUEM É O ENVISTA</span><h2 id="audience-title">Diferentes perfis,<br /><em>o mesmo propósito.</em></h2></div>
              <p>Um ambiente para aprender, colaborar, orientar e transformar ideias em projetos reais.</p>
            </div>
            <div className={styles.audienceGrid}>
              {audiences.map(({ Icon, title, text, href }) => (
                <Link className={styles.audienceCard} key={title} href={href}>
                  <Icon size={28} aria-hidden="true" /><h3>{title}</h3><p>{text}</p>
                  <span className={styles.audienceArrow}><ArrowRight size={17} aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalSection} aria-labelledby="final-title">
          <div className={styles.container}>
            <div className={styles.banner}>
              <div className={styles.bannerSymbol}><Image src="/brand/envista-symbol-gradient.svg" alt="" width={55} height={72} /></div>
              <div className={styles.bannerHeadline}><span className={styles.bannerKicker}>PRÓXIMO PASSO</span><h2 id="final-title">Comece hoje a construir você também.</h2></div>
              <p>Crie seu projeto, monte sua equipe, acompanhe a evolução e conecte-se com oportunidades reais.</p>
              <Link href="/register" className={styles.bannerButton}>Criar meu projeto <ArrowRight aria-hidden="true" size={19} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerColumns}>
            <div className={styles.footerIntro}><Brand footer /><p>Ecossistema de inovação para ideias que ganham vida.</p></div>
            <div><h3>Produto</h3><nav aria-label="Produto"><a href="#como-funciona">Como funciona</a><Link href="/projects">Explorar projetos</Link><a href="#ecossistema">Aprender</a></nav></div>
            <div><h3>Para escolas</h3><nav aria-label="Escolas"><Link href="/schools">Soluções educacionais</Link><Link href="/schools">Conhecer mais</Link></nav></div>
            <div><h3>Institucional</h3><nav aria-label="Institucional"><Link href="/about">Sobre o Envista</Link><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos de uso</Link></nav></div>
          </div>
          <div className={styles.footerBottom}>© {new Date().getFullYear()} Envista. Projetos que continuam.</div>
        </div>
      </footer>
    </div>
  );
}
