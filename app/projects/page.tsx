import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  // `/projects` is the public SEO showcase for visitors. If an authenticated
  // participant reaches it through an old/stale navigation link, send them
  // back into the product shell so "Meus projetos" keeps the sidebar.
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
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><img src="/envista-logo.png" alt="" /><strong>Envista</strong></Link>
        <nav><Link href="/schools">Para escolas</Link><Link href="/login">Entrar</Link><Link className={styles.primary} href="/register">Publicar projeto</Link></nav>
      </header>

      <section className={styles.hero}>
        <span>PROJETOS NO ENVISTA</span>
        <h1>Explore projetos que continuam depois da entrega.</h1>
        <p>Descubra trabalhos acadêmicos, projetos autorais e soluções em evolução publicados por estudantes e equipes.</p>
        <Link className={styles.primary} href="/register">Publicar meu projeto <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>

      <section className={styles.grid} aria-label="Projetos públicos">
        {projects.length ? projects.map((project) => (
          <article className={styles.card} key={project.slug}>
            <div className={styles.meta}><span>{project.stage || "Projeto"}</span>{project.category ? <span>{project.category}</span> : null}</div>
            <h2><Link href={`/p/${project.slug}`}>{project.title}</Link></h2>
            <p>{project.short_description || "Projeto publicado no Envista."}</p>
            {project.tags?.length ? <div className={styles.tags}>{project.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
            <Link className={styles.projectLink} href={`/p/${project.slug}`}>Ver projeto <ArrowRight size={15} aria-hidden="true" /></Link>
          </article>
        )) : (
          <div className={styles.empty}>
            <h2>Os primeiros projetos estão chegando.</h2>
            <p>Publique o seu e transforme-o em uma página pública de portfólio.</p>
            <Link className={styles.primary} href="/register">Criar meu projeto</Link>
          </div>
        )}
      </section>
    </main>
  );
}
