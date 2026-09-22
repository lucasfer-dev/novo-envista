import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ShareProjectButton from "@/components/public/ShareProjectButton";
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
  repository_url?: string | null;
  demo_url?: string | null;
  design_url?: string | null;
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
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${project.title} no Envista` };
  return {
    title: project.title,
    description,
    alternates: { canonical: `/p/${project.slug}` },
    openGraph: {
      title: `${project.title} | Envista`,
      description,
      url: `/p/${project.slug}`,
      type: "website",
      siteName: "Envista",
      locale: "pt_BR",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Envista`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await load(slug);
  if (!project) notFound();
  const tags = project.tags ?? [];
  const projectLinks = [
    [project.demo_url, "Ver demo"],
    [project.repository_url, "Código / repositório"],
    [project.design_url, "Design / protótipo"],
  ].filter((entry): entry is [string, string] => Boolean(entry[0]));

  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/"><img src="/envista-logo.png" alt=""/><strong>Envista</strong></Link><div><Link href="/login">Entrar</Link><Link className={styles.primary} href="/register">Criar conta</Link></div></header>
      <article className={styles.hero}>
        <div className={styles.eyebrow}><span>{project.stage || "Projeto"}</span>{project.category ? <span>{project.category}</span> : null}{project.location ? <span>{project.location}</span> : null}</div>
        <h1>{project.title}</h1>
        <p className={styles.lead}>{project.short_description || "Projeto publicado no Envista."}</p>
        <div className={styles.tags}>{tags.map((tag)=><span key={tag}>{tag}</span>)}</div>
        <div className={styles.actions}>{projectLinks.map(([href,label])=><a className={styles.secondary} href={href} target="_blank" rel="noreferrer" key={label}>{label} <ExternalLink size={15}/></a>)}<ShareProjectButton className={styles.secondary} title={project.title} href={`/p/${project.slug}`} /><Link className={styles.primary} href="/register">Publique seu projeto <ArrowRight size={16}/></Link></div>
      </article>
      <section className={styles.sharePitch} aria-label="Sobre páginas públicas no Envista"><strong>Este projeto tem uma página pública no Envista.</strong><span>Crie a sua para usar como portfólio, compartilhar em processos seletivos e continuar registrando a evolução depois da entrega.</span><Link href="/register">Criar minha página de projeto <ArrowRight size={15} aria-hidden="true" /></Link></section>
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
