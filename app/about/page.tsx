import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, FolderKanban, UsersRound } from "lucide-react";
import styles from "./About.module.css";

export const metadata: Metadata = {
  title: "Sobre o Envista | Ecossistema de inovação",
  description: "Conheça a proposta do Envista: aprender na prática, desenvolver projetos, formar equipes e encontrar oportunidades.",
};

const pillars = [
  { Icon: FolderKanban, title: "Projetos", description: "Organize sua ideia, registre etapas e acompanhe a evolução do seu trabalho." },
  { Icon: UsersRound, title: "Conexões", description: "Encontre pessoas com interesses em comum e forme equipes para construir junto." },
  { Icon: BookOpen, title: "Aprendizado", description: "Desenvolva habilidades com conteúdos e atividades que aproximam teoria e prática." },
  { Icon: Compass, title: "Oportunidades", description: "Descubra desafios, competições externas e iniciativas relacionadas ao seu projeto." },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.headerInner} aria-label="Navegação institucional">
          <Link href="/" className={styles.brand} aria-label="Envista — página inicial">
            <Image src="/brand/envista-symbol-gradient.svg" width={33} height={44} alt="" />
            <strong>ENVISTA</strong>
          </Link>
          <div className={styles.headerActions}>
            <Link href="/projects">Explorar projetos</Link>
            <Link href="/login" className={styles.login}>Entrar</Link>
          </div>
        </nav>
      </header>
      <main id="conteudo" className={styles.main}>
        <section className={styles.hero} aria-labelledby="about-title">
          <span className={styles.kicker}>SOBRE O ENVISTA</span>
          <h1 id="about-title">Ideias ganham força quando <em>encontram pessoas.</em></h1>
          <p>O Envista é um ecossistema digital para transformar ideias em projetos, documentar sua evolução e conectar estudantes, equipes e pessoas interessadas em inovação.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/register">Começar meu projeto <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className={styles.secondary} href="/projects">Conhecer projetos <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="ecosystem-heading">
          <span className={styles.kicker}>COMO FUNCIONA</span>
          <h2 id="ecosystem-heading">Da primeira ideia ao próximo passo.</h2>
          <div className={styles.grid}>
            {pillars.map(({ Icon, title, description }) => (
              <article className={styles.card} key={title}>
                <Icon size={25} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.audience} id="para-quem" aria-labelledby="audience-heading">
          <span className={styles.kicker}>PARA QUEM É</span>
          <h2 id="audience-heading">Uma comunidade para quem está construindo.</h2>
          <p>Estudantes e equipes podem usar o Envista para aprender e desenvolver projetos. Educadores, mentores e outras pessoas interessadas em inovação podem conhecer a proposta e acompanhar as iniciativas publicadas conforme a visibilidade permitida por seus autores.</p>
          <p>Os recursos disponíveis variam conforme o tipo de conta. Planos pagos e funcionalidades anunciadas como futuras ainda estão em preparação.</p>
          <Link href="/plans">Conhecer os planos <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Envista</span>
        <nav aria-label="Links legais">
          <Link href="/privacy">Privacidade</Link>
          <Link href="/terms">Termos de uso</Link>
          <Link href="/privacy/contact">Contato de privacidade</Link>
        </nav>
      </footer>
    </div>
  );
}
