import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, FolderKanban, Menu, Rocket, Users } from "lucide-react";
import styles from "@/components/public/PublicLanding.module.css";

export const metadata = {
  title: "Sobre | Envista",
  description: "Conheça o Envista e como a plataforma conecta aprendizado, equipes, projetos e oportunidades.",
};

const pillars = [
  { Icon: BookOpen, title: "Aprendizado aplicado", copy: "Cursos e conteúdos ganham contexto quando levam a algo que pode ser construído e demonstrado." },
  { Icon: Users, title: "Construção em equipe", copy: "Pessoas, papéis e colaboração ficam conectados ao projeto, não espalhados em ferramentas isoladas." },
  { Icon: FolderKanban, title: "Portfólio vivo", copy: "Projetos registram problema, solução, progresso, evidências e próximos passos ao longo do tempo." },
  { Icon: Rocket, title: "Continuidade", copy: "O objetivo é ajudar uma boa ideia a continuar evoluindo depois de uma aula, evento ou competição." },
];

function Header() {
  return <header className={styles.header}><div className={styles.headerInner}>
    <Link className={styles.brand} href="/" aria-label="Envista — página inicial"><Image src="/envista-logo.png" alt="" width={30} height={30} priority /><span>Envista</span></Link>
    <nav className={styles.desktopNav} aria-label="Navegação principal"><Link href="/about">Sobre</Link><Link href="/schools">Para escolas</Link><Link href="/login">Entrar</Link><Link className={styles.headerCta} href="/register">Criar conta</Link></nav>
    <details className={styles.mobileNav}><summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary><nav aria-label="Navegação principal no celular"><Link href="/about">Sobre</Link><Link href="/schools">Para escolas</Link><Link href="/login">Entrar</Link><Link className={styles.headerCta} href="/register">Criar conta</Link></nav></details>
  </div></header>;
}

export default function AboutPage() {
  return <main className={styles.page}>
    <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a><Header />
    <div id="conteudo">
      <section className={styles.hero} style={{ gridTemplateColumns: "1fr" }}>
        <div className={styles.heroCopy}><span className={styles.kicker}>SOBRE O ENVISTA</span><h1>Boas ideias precisam de continuidade.</h1><p>O Envista é uma plataforma para transformar aprendizado e colaboração em projetos que podem evoluir, ganhar contexto e encontrar novas oportunidades.</p><div className={styles.heroActions}><Link className={styles.primary} href="/register">Criar conta <ArrowRight size={17} aria-hidden="true" /></Link><Link className={styles.secondary} href="/schools">Envista para escolas</Link></div></div>
      </section>
      <section className={styles.section} aria-labelledby="about-pillars"><div className={styles.sectionHeading}><div><span className={styles.kicker}>O QUE CONECTAMOS</span><h2 id="about-pillars">Da aprendizagem ao projeto, sem perder o contexto no caminho.</h2></div><p>A plataforma reúne etapas que normalmente ficam separadas para que participantes, equipes e organizações acompanhem a evolução real do trabalho.</p></div><div className={styles.journeyGrid}>{pillars.map(({ Icon, title, copy }, index) => <article className={styles.journeyCard} key={title}><span className={styles.step}>0{index + 1}</span><Icon size={21} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className={styles.finalCta}><span className={styles.kicker}>PRÓXIMO PASSO</span><h2>Comece com o que você já está construindo.</h2><p>Crie seu perfil, organize uma equipe ou transforme um projeto em um portfólio que continue evoluindo.</p><div className={styles.heroActions}><Link className={styles.primary} href="/register">Começar agora <ArrowRight size={17} aria-hidden="true" /></Link><Link className={styles.secondary} href="/login">Já tenho uma conta</Link></div></section>
    </div>
    <footer className={styles.footer}><Link className={styles.brand} href="/"><Image src="/envista-logo.png" alt="" width={26} height={26} /><span>Envista</span></Link><p>Aprenda, construa e transforme ideias em oportunidades.</p><nav aria-label="Links institucionais"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/login">Entrar</Link></nav></footer>
  </main>;
}
