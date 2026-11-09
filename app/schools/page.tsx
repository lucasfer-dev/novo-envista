import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BookOpen, CheckCircle2,
  ChevronRight, Compass, FolderKanban, GraduationCap,
  Lightbulb, Layers3, School, Sparkles, Trophy, UsersRound,
} from "lucide-react";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import styles from "./schools.module.css";

export const metadata = {
  title: "Para escolas — projetos que continuam | Envista",
  description: "Leve ideias, trabalhos e desafios da escola além da apresentação. O Envista conecta aprendizagem aplicada, equipes, portfólios e oportunidades.",
  alternates: { canonical: "/schools" },
};

const journey = [
  {
    Icon: Lightbulb, number: "01", title: "Uma ideia nasce",
    copy: "Um desafio ou problema dá origem ao projeto. O aluno registra o que quer resolver.",
  },
  {
    Icon: UsersRound, number: "02", title: "A equipe se organiza",
    copy: "Integrantes compartilham contexto, responsabilidades e os próximos passos.",
  },
  {
    Icon: FolderKanban, number: "03", title: "O trabalho ganha forma",
    copy: "Solução, evolução e aprendizados ficam reunidos em um projeto vivo.",
  },
  {
    Icon: Trophy, number: "04", title: "A jornada continua",
    copy: "O portfólio pode ser compartilhado e abrir caminho para novas oportunidades.",
  },
];

const benefits = [
  {
    Icon: Layers3, title: "Projetos com contexto",
    copy: "Reúna a proposta, os objetivos, a equipe e a evolução de cada iniciativa.",
  },
  {
    Icon: UsersRound, title: "Colaboração organizada",
    copy: "Dê continuidade ao trabalho mesmo quando a atividade em sala termina.",
  },
  {
    Icon: BookOpen, title: "Aprender fazendo",
    copy: "Conecte os conteúdos estudados a desafios e soluções desenvolvidos na prática.",
  },
  {
    Icon: Compass, title: "Novos caminhos",
    copy: "Apresente a evolução dos projetos e explore possibilidades de aprendizado e conexão.",
  },
];

const questions = [
  {
    question: "O Envista substitui a plataforma de aulas da escola?",
    answer: "Não. O Envista é um ambiente complementar para estruturar iniciativas, colaborar e dar continuidade aos projetos. A escola pode manter sua própria metodologia e ferramentas de ensino.",
  },
  {
    question: "Preciso envolver a instituição inteira para começar?",
    answer: "Não. É possível conhecer o fluxo começando com uma ideia, um grupo ou um projeto. Depois, a experiência pode evoluir conforme a necessidade dos participantes.",
  },
  {
    question: "Todos os projetos precisam ser públicos?",
    answer: "Não necessariamente. A visibilidade depende das opções disponíveis na plataforma e das permissões aplicáveis a cada conta e projeto. Antes de compartilhar informações de alunos, é importante verificar essas configurações.",
  },
];

function SchoolJourneyIllustration() {
  return (
    <div className={styles.journeyPanel} aria-label="Exemplo ilustrativo da jornada de um projeto no Envista">
      <div className={styles.journeyPanelTop}>
        <div className={styles.panelBrand}>
          <Image src="/brand/envista-symbol-gradient.svg" alt="" width={28} height={39} />
          <span>ENVISTA <small>EDUCAÇÃO</small></span>
        </div>
        <span className={styles.panelLabel}><span /> MODELO DE JORNADA</span>
      </div>
      <div className={styles.panelTitleBlock}>
        <span>DA IDEIA À EVOLUÇÃO</span>
        <h2>Um projeto.<br /><em>Muitos próximos passos.</em></h2>
      </div>
      <div className={styles.panelStages}>
        <div className={styles.panelStage}><span className={styles.stageIcon}><Lightbulb size={20} /></span><div><small>ETAPA 01</small><strong>Definir o desafio</strong></div><CheckCircle2 size={17} className={styles.check} /></div>
        <div className={styles.panelConnector} />
        <div className={styles.panelStage}><span className={styles.stageIcon}><UsersRound size={20} /></span><div><small>ETAPA 02</small><strong>Construir em equipe</strong></div><CheckCircle2 size={17} className={styles.check} /></div>
        <div className={styles.panelConnector} />
        <div className={styles.panelStage}><span className={styles.stageIcon}><Layers3 size={20} /></span><div><small>ETAPA 03</small><strong>Registrar a evolução</strong></div><ChevronRight size={19} className={styles.stageArrow} /></div>
      </div>
      <div className={styles.panelBottom}>
        <span><Sparkles size={16} aria-hidden="true" /> Uma jornada que não para na entrega</span>
        <span className={styles.panelBottomMark} aria-hidden="true">↗</span>
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <div className={styles.page} data-envista-public-shell>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <PublicSiteHeader context="schools" />
      <main id="conteudo">
        <section className={styles.hero} aria-labelledby="school-title">
          <div className={styles.heroPattern} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}><span className={styles.dot} /> ENVISTA PARA ESCOLAS <span className={styles.eyebrowRule} /> APRENDER É IR ALÉM</div>
              <h1 id="school-title">Da sala de aula para <span>o mundo real.</span></h1>
              <p>Transforme trabalhos e desafios em projetos que continuam evoluindo. Um espaço para organizar equipes, registrar aprendizados e dar visibilidade ao que os alunos constroem.</p>
              <div className={styles.heroActions}>
                <Link href="/register" className={styles.primary}>Começar meu projeto <ArrowRight size={19} aria-hidden="true" /></Link>
                <a href="#como-funciona" className={styles.secondary}>Conhecer a jornada <ArrowUpRight size={18} aria-hidden="true" /></a>
              </div>
              <div className={styles.heroFootnote}>
                <span><CheckCircle2 size={16} aria-hidden="true" /> Aprendizagem aplicada</span>
                <span><CheckCircle2 size={16} aria-hidden="true" /> Projetos em evolução</span>
              </div>
            </div>
            <SchoolJourneyIllustration />
          </div>
          <div className={styles.heroBottomBar} aria-label="Princípios do Envista para educação">
            <span>IDEIAS</span><ArrowRight aria-hidden="true" /><span>COLABORAÇÃO</span><ArrowRight aria-hidden="true" /><span>PROJETOS</span><ArrowRight aria-hidden="true" /><span>OPORTUNIDADES</span>
          </div>
        </section>

        <section className={styles.process} id="como-funciona" aria-labelledby="journey-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.label}>01 / COMO FUNCIONA</span>
                <h2 id="journey-title">Toda boa ideia merece <em>continuidade.</em></h2>
              </div>
              <p>Uma jornada simples para que o projeto não desapareça depois da apresentação. O aluno aprende, cria, registra e pode continuar.</p>
            </div>
            <div className={styles.steps}>
              {journey.map(({ Icon, number, title, copy }, index) => (
                <div className={styles.stepWrap} key={number}>
                  <article className={styles.step}>
                    <div className={styles.stepTop}><span>{number}</span><span className={styles.stepIcon}><Icon size={23} aria-hidden="true" /></span></div>
                    <h3>{title}</h3><p>{copy}</p>
                  </article>
                  {index < journey.length - 1 ? <ArrowRight className={styles.stepArrow} size={22} aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.benefits} id="beneficios" aria-labelledby="benefits-title">
          <div className={styles.container}>
            <div className={styles.benefitsLayout}>
              <div className={styles.benefitsIntro}>
                <span className={styles.label}>02 / MAIS DO QUE UMA ENTREGA</span>
                <h2 id="benefits-title">O trabalho continua. <em>O aprendizado também.</em></h2>
                <p>O Envista oferece um ambiente para conectar as partes de uma iniciativa: o problema, as pessoas, a construção e o que vem depois.</p>
                <a href="#na-pratica" className={styles.textLink}>Veja uma aplicação prática <ArrowRight size={17} aria-hidden="true" /></a>
              </div>
              <div className={styles.benefitsGrid}>
                {benefits.map(({ Icon, title, copy }) => (
                  <article className={styles.benefit} key={title}>
                    <Icon size={26} aria-hidden="true" />
                    <h3>{title}</h3><p>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.example} id="na-pratica" aria-labelledby="example-title">
          <div className={styles.container}>
            <div className={styles.exampleLayout}>
              <div className={styles.exampleCopy}>
                <span className={styles.label}>03 / NA PRÁTICA</span>
                <h2 id="example-title">Imagine o que sua turma <em>pode construir.</em></h2>
                <p>Um desafio ambiental, um aplicativo, uma solução para a comunidade. O tema muda, mas a jornada pode seguir a mesma lógica.</p>
                <span className={styles.exampleDisclaimer}>Exemplo de aplicação pedagógica, não um projeto real cadastrado.</span>
              </div>
              <div className={styles.exampleFlow}>
                <div><span>01</span><div><strong>O professor propõe um desafio</strong><p>Uma questão real vira ponto de partida para investigação e criação.</p></div></div>
                <div><span>02</span><div><strong>Os alunos formam equipes</strong><p>Ideias, responsabilidades e decisões passam a ter contexto.</p></div></div>
                <div><span>03</span><div><strong>O projeto ganha uma trajetória</strong><p>A solução evolui com entregas, aprendizados e próximos passos.</p></div></div>
                <div><span>04</span><div><strong>O resultado pode ir além da sala</strong><p>O portfólio ajuda a apresentar o trabalho e descobrir novas possibilidades.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.forWhom} aria-labelledby="for-whom-title">
          <div className={styles.container}>
            <div className={styles.sectionHeadingDark}>
              <span className={styles.label}>04 / PARA QUEM É</span>
              <h2 id="for-whom-title">Uma experiência conectada <em>a quem participa.</em></h2>
            </div>
            <div className={styles.audienceGrid}>
              <article className={styles.audienceCard}>
                <span className={styles.audienceIcon}><GraduationCap size={26} aria-hidden="true" /></span>
                <span className={styles.audienceNumber}>01 / ESTUDANTES E EQUIPES</span>
                <h3>Projetos com espaço para crescer.</h3>
                <p>Organize o que está construindo, colabore com outras pessoas e desenvolva um portfólio que conte sua trajetória.</p>
              </article>
              <article className={styles.audienceCard}>
                <span className={styles.audienceIcon}><School size={26} aria-hidden="true" /></span>
                <span className={styles.audienceNumber}>02 / EDUCADORES E ESCOLAS</span>
                <h3>Mais continuidade para o aprendizado.</h3>
                <p>Proponha atividades conectadas a projetos e incentive os alunos a registrar seu processo e compartilhar resultados quando apropriado.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={styles.container}>
            <div className={styles.faqLayout}>
              <div className={styles.faqIntro}>
                <span className={styles.label}>DÚVIDAS FREQUENTES</span>
                <h2 id="faq-title">Antes de começar.</h2>
                <p>O Envista complementa o trabalho pedagógico, respeitando o ritmo de quem está aprendendo.</p>
              </div>
              <div className={styles.faqQuestions}>
                {questions.map(({ question, answer }) => (
                  <details key={question}>
                    <summary>{question}<span aria-hidden="true">+</span></summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalSection} aria-labelledby="final-title">
          <div className={styles.container}>
            <div className={styles.finalBanner}>
              <div className={styles.finalIcon}><Image src="/brand/envista-symbol-white.svg" width={54} height={74} alt="" /></div>
              <div>
                <span className={styles.label}>O PRÓXIMO PASSO</span>
                <h2 id="final-title">O próximo projeto pode começar <em>agora.</em></h2>
                <p>Comece com uma ideia. Dê a ela um espaço para continuar.</p>
              </div>
              <Link href="/register" className={styles.finalButton}>Começar projeto <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerIdentity}>
              <Link href="/" aria-label="Envista — início">
                <Image src="/brand/envista-symbol-gradient.svg" width={30} height={39} alt="" />
                <strong>ENVISTA</strong>
              </Link>
              <p>Projetos que continuam depois da entrega.</p>
            </div>
            <nav aria-label="Links institucionais">
              <Link href="/">Início</Link>
              <a href="#como-funciona">Como funciona</a>
              <Link href="/privacy">Privacidade</Link>
              <Link href="/terms">Termos</Link>
              <Link href="/login">Entrar</Link>
            </nav>
          </div>
          <div className={styles.copyright}>© {new Date().getFullYear()} Envista.</div>
        </div>
      </footer>
    </div>
  );
}
