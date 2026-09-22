import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FolderKanban, Menu, Sparkles, Target, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./projects.module.css";

export const metadata: Metadata = {
  title: "Projetos de estudantes e equipes",
  description: "Explore projetos públicos criados por estudantes e equipes no Envista. Descubra soluções, portfólios, tecnologias e projetos em evolução.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projetos de estudantes e equipes | Envista",
    description: "Explore projetos públicos, portfólios e soluções criadas no Envista.",
    url: "/projects",
    type: "website",
  },
};

type PublicProject = {
  slug: string;
  title: string;
  short_description: string;
  stage: string;
  category: string;
  tags: string[];
  updated_at: string;
};

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Envista — página inicial">
          <Image src="/brand/envista-symbol-gradient.svg" alt="" width={30} height={30} priority />
          <span>Envista</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <Link className={styles.activeNav} href="/projects">Projetos</Link>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/schools">Para escolas</Link>
          <Link href="/login">Entrar</Link>
          <Link className={styles.headerCta} href="/register">Começar projeto</Link>
        </nav>

        <details className={styles.mobileNav}>
          <summary aria-label="Abrir navegação"><Menu size={20} aria-hidden="true" /></summary>
          <nav aria-label="Navegação principal no celular">
            <Link href="/projects">Projetos</Link>
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/schools">Para escolas</Link>
            <Link href="/login">Entrar</Link>
            <Link className={styles.headerCta} href="/register">Começar projeto</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (authData.user) redirect("/app/projects");

  const { data } = await supabase
    .from("projects")
    .select("slug,title,short_description,stage,category,tags,updated_at")
    .eq("visibility", "platform")
    .order("updated_at", { ascending: false })
    .limit(100);

  const projects = (data ?? []) as PublicProject[];

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#projetos">Pular para os projetos</a>
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>PROJETOS NO ENVISTA</span>
            <h1>Explore projetos que <span>continuam depois da entrega.</span></h1>
            <p>Descubra trabalhos acadêmicos, projetos autorais e soluções em evolução publicados por estudantes e equipes.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/register">Publicar meu projeto <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/schools">Conhecer o Envista para escolas</Link>
            </div>
          </div>

          <aside className={styles.heroPanel} aria-label="Sobre o portfólio público do Envista">
            <div className={styles.panelHeader}>
              <div>
                <span>PORTFÓLIO DO ECOSSISTEMA</span>
                <strong>Projetos públicos no Envista</strong>
              </div>
              <span className={styles.panelCount}>{projects.length}</span>
            </div>

            <div className={styles.panelLead}>
              <div className={styles.panelIcon}><FolderKanban size={23} aria-hidden="true" /></div>
              <div>
                <small>VITRINE VIVA</small>
                <h2>Descubra → acompanhe → compartilhe</h2>
                <p>Cada projeto pode reunir contexto, evolução, equipe e próximos passos em uma única página.</p>
              </div>
            </div>

            <div className={styles.panelRows}>
              <div><Sparkles size={17} aria-hidden="true" /><span><strong>Projetos em evolução</strong><small>Mais do que uma entrega final.</small></span></div>
              <div><Target size={17} aria-hidden="true" /><span><strong>Portfólio compartilhável</strong><small>Uma página pública para mostrar o trabalho.</small></span></div>
              <div><Trophy size={17} aria-hidden="true" /><span><strong>Próximas oportunidades</strong><small>Competição, feedback e novas conexões.</small></span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.projectsSection} id="projetos" aria-labelledby="projects-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.kicker}>PORTFÓLIO DO ECOSSISTEMA</span>
            <h2 id="projects-title">O que está sendo construído agora.</h2>
          </div>
          <p>Abra um projeto para entender o problema, a solução, o estágio atual e a trajetória de quem está construindo.</p>
        </div>

        {projects.length ? (
          <div className={styles.grid} aria-label="Projetos públicos">
            {projects.map((project) => (
              <Link className={styles.card} href={`/p/${project.slug}`} key={project.slug}>
                <div className={styles.cardTopline}>
                  <span>{project.stage || "Projeto em evolução"}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
                <h3>{project.title}</h3>
                <p>{project.short_description || "Projeto publicado no Envista."}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.meta}>
                    {project.category ? <span>{project.category}</span> : null}
                    {project.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <span className={styles.openLabel}>Ver projeto</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Sparkles size={23} aria-hidden="true" /></div>
            <div>
              <h3>Os primeiros projetos estão chegando.</h3>
              <p>Publique o seu e transforme-o em uma página pública de portfólio que continua evoluindo.</p>
            </div>
            <Link className={styles.primary} href="/register">Criar meu projeto <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      <section className={styles.ctaStrip}>
        <div className={styles.ctaIcon}><Target size={23} aria-hidden="true" /></div>
        <div>
          <span className={styles.kicker}>SEU PROJETO TAMBÉM PODE ESTAR AQUI</span>
          <h2>Transforme uma entrega em algo que continua crescendo.</h2>
          <p>Organize o projeto, publique a evolução e use a página como parte do seu portfólio.</p>
        </div>
        <Link className={styles.darkCta} href="/register">Começar projeto <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>

      <footer className={styles.footer}>
        <div>
          <Link className={styles.brand} href="/">
            <Image src="/brand/envista-symbol-gradient.svg" alt="" width={26} height={26} />
            <span>Envista</span>
          </Link>
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
