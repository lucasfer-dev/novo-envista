import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./public-project.module.css";

type ProjectShare = {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  stage?: string | null;
  category?: string | null;
  location?: string | null;
  tags?: string[] | null;
  updated_at?: string | null;
  owner?: { name?: string; username?: string; headline?: string | null } | null;
  team?: { name?: string; slug?: string } | null;
};

async function load(slug: string): Promise<ProjectShare | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_project_share", { project_slug: slug });
  if (error || !data) return null;
  return data as ProjectShare;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await load(slug);
  if (!project) return { title: "Projeto não encontrado" };
  const description = project.short_description || `Conheça ${project.title} no Envista.`;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/p/${project.slug}` },
    openGraph: { title: `${project.title} | Envista`, description, url: `/p/${project.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title: `${project.title} | Envista`, description },
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await load(slug);
  if (!project) notFound();
  const tags = project.tags ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/"><img src="/envista-logo.png" alt=""/><strong>Envista</strong></Link><div><Link href="/login">Entrar</Link><Link className={styles.primary} href="/register">Criar conta</Link></div></header>
      <article className={styles.hero}>
        <div className={styles.eyebrow}><span>{project.stage || "Projeto"}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span>{project.location}</span> : null}</div>
        <h1>{project.title}</h1>
        <p className={styles.lead}>{project.short_description || "Projeto publicado no Envista."}</p>
        <div className={styles.tags}>{tags.map((tag)=><span key={tag}>{tag}</span>)}</div>
        <div className={styles.actions}><Link className={styles.primary} href="/register">Conhecer o Envista <ArrowRight size={16}/></Link><Link className={styles.secondary} href="/login">Já tenho conta <ExternalLink size={15}/></Link></div>
      </article>
      <section className={styles.content}>
        <div><h2>Sobre o projeto</h2><p>{project.description || project.short_description || "A equipe ainda não adicionou uma descrição detalhada."}</p></div>
        <aside>
          <h3>Publicado por</h3>
          {project.team?.name ? <p><strong>{project.team.name}</strong><br/><span>Equipe no Envista</span></p> : project.owner?.name ? <p><strong>{project.owner.name}</strong><br/><span>{project.owner.headline || (project.owner.username ? `@${project.owner.username}` : "Participante do Envista")}</span></p> : <p>Comunidade Envista</p>}
          {project.updated_at ? <small>Atualizado em {new Date(project.updated_at).toLocaleDateString("pt-BR")}</small> : null}
        </aside>
      </section>
      <footer>Envista · Aprenda, construa e transforme ideias em oportunidades.</footer>
    </main>
  );
}
