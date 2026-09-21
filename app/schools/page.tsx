import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, FolderKanban, Menu, School, Trophy, Users } from "lucide-react";
import styles from "@/components/public/PublicLanding.module.css";

export const metadata = {
  title: "Para escolas | Envista",
  description: "Use o Envista para conectar aprendizagem prática, equipes, projetos e oportunidades dentro da escola.",
};

const schoolJourney = [
  { Icon: BookOpen, title: "Aprender", copy: "Conteúdos e atividades podem levar a entregas concretas, em vez de terminar em uma aula isolada." },
  { Icon: Users, title: "Formar equipes", copy: "Alunos organizam colaboração, papéis e contexto ao redor do que estão construindo." },
  { Icon: FolderKanban, title: "Construir projetos", copy: "Problema, solução, progresso e evidências permanecem registrados em um portfólio vivo." },
  { Icon: Trophy, title: "Encontrar oportunidades", copy: "Competições e novas etapas passam a fazer parte de uma jornada contínua de desenvolvimento." },
];

function Header() {
  return <header className={styles.header}><div className={styles.headerInner}>
    <Link className={styles.brand} href="/" aria-label="Envista — página inicial"><Image src="/envista-logo.png" alt="" width={30} height={30} priority /><span>Envista</span></Link>
    <nav className={styles.desktopNav} aria-label="Navegação principal"><Link href="/about">Sobre</Link><Link href="/schools">Para escolas</Link><Link href="/login">Entrar</Link><Link className={styles.headerCta} href="/register">Criar conta</Link></nav>
    <details className={styles.mobileNav}><summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary><nav aria-label="Navegação principal no celular"><Link href="/about">Sobre</Link><Link href="/schools">Para escolas</Link><Link href="/login">Entrar</Link><Link className={styles.headerCta} href="/register">Criar conta</Link></nav></details>
  </div></header>;
}

export default function SchoolsPage() {
  return <main className={styles.page}>
    <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a><Header />
    <div id="conteudo">
      <section className={styles.hero} style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(360px,.85fr)" }}>
        <div className={styles.heroCopy}><span className={styles.kicker}>ENVISTA PARA ESCOLAS</span><h1>Projetos dos alunos não precisam terminar na apresentação.</h1><p>O Envista cria continuidade entre aprendizagem prática, formação de equipes, desenvolvimento de projetos e descoberta de oportunidades.</p><div className={styles.heroActions}><Link className={styles.primary} href="/register">Experimentar o Envista <ArrowRight size={17} aria-hidden="true" /></Link><Link className={styles.secondary} href="/about">Conhecer a plataforma</Link></div></div>
        <div className={styles.productPreview}><div className={styles.previewTop}><span className={styles.previewBrand}><Image src="/envista-logo.png" alt="" width={22} height={22} /> Envista</span><span className={styles.statusDot}>Jornada contínua</span></div><div className={styles.previewHero}><div className={styles.previewIcon}><School size={24} aria-hidden="true" /></div><div><small>AMBIENTE EDUCACIONAL</small><strong>Aprender construindo.</strong><p>Conteúdo → equipe → projeto → oportunidade</p></div></div><div className={styles.previewGrid}><div><BookOpen size={18} aria-hidden="true" /><strong>Aprendizado</strong><span>Conteúdo ligado à prática.</span></div><div><Users size={18} aria-hidden="true" /><strong>Equipes</strong><span>Colaboração com contexto.</span></div><div><FolderKanban size={18} aria-hidden="true" /><strong>Projetos</strong><span>Evolução registrada.</span></div><div><Trophy size={18} aria-hidden="true" /><strong>Oportunidades</strong><span>Próximos passos visíveis.</span></div></div></div>
      </section>
      <section className={styles.section} aria-labelledby="school-journey"><div className={styles.sectionHeading}><div><span className={styles.kicker}>UMA JORNADA PARA O ALUNO</span><h2 id="school-journey">Estrutura para aprender, colaborar e continuar evoluindo.</h2></div><p>O Envista não substitui o professor nem a metodologia da instituição. Ele organiza a continuidade do trabalho e torna o progresso mais visível.</p></div><div className={styles.journeyGrid}>{schoolJourney.map(({ Icon, title, copy }, index) => <article className={styles.journeyCard} key={title}><span className={styles.step}>0{index + 1}</span><Icon size={21} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className={styles.finalCta}><span className={styles.kicker}>COMECE PEQUENO</span><h2>Uma turma, uma equipe ou um projeto já é um começo.</h2><p>Crie uma conta para conhecer a experiência atual do produto. A plataforma pode evoluir junto com o uso real das instituições e dos participantes.</p><div className={styles.heroActions}><Link className={styles.primary} href="/register">Criar conta <ArrowRight size={17} aria-hidden="true" /></Link><Link className={styles.secondary} href="/login">Entrar</Link></div></section>
    </div>
    <footer className={styles.footer}><Link className={styles.brand} href="/"><Image src="/envista-logo.png" alt="" width={26} height={26} /><span>Envista</span></Link><p>Aprenda, construa e transforme ideias em oportunidades.</p><nav aria-label="Links institucionais"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/login">Entrar</Link></nav></footer>
  </main>;
}
