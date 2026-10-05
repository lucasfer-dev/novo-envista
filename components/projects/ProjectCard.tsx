import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import type { ReactNode } from "react";
import ProjectCover from "./ProjectCover";
import styles from "./ProjectCard.module.css";

export type ProjectCardData = { title: string; short_description?: string | null; stage?: string | null; category?: string | null; location?: string | null; tags?: string[] | null; updated_at?: string | null };

export default function ProjectCard({ project, href, cover, owner, action }: { project: ProjectCardData; href: string; cover?: string | null; owner?: string; action?: ReactNode }) {
  return <article className={styles.card}>
    <Link href={href} className={styles.mediaLink} aria-label={`Abrir projeto ${project.title}`}><ProjectCover title={project.title} category={project.category} src={cover} /><span className={styles.open}><ArrowUpRight size={18} /></span></Link>
    <div className={styles.body}>
      <div className={styles.meta}><span>{project.stage || "Em evolução"}</span><span>{project.category || "Projeto"}</span></div>
      <h3><Link href={href}>{project.title}</Link></h3>
      <p>{project.short_description || "Conheça o que está sendo construído."}</p>
      {project.tags?.length ? <div className={styles.tags}>{project.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div> : null}
      <footer><span><Users size={14} aria-hidden="true" />{owner || project.location || "Comunidade Envista"}</span>{project.updated_at ? <time dateTime={project.updated_at}>{new Date(project.updated_at).toLocaleDateString("pt-BR")}</time> : null}</footer>
      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  </article>;
}
