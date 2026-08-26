import Link from "next/link";
import { updateProjectPortfolioAction } from "@/lib/projects/portfolio-actions";
import styles from "./Projects.module.css";

type Project={id:string;slug:string;impact?:string;needs?:string[];website_url?:string;repository_url?:string;category?:string;location?:string;tags?:string[]};
type Update={id:string;body:string;created_at:string};

export default function ProjectPortfolioPanel({project,updates,canEdit}:{project:Project;updates:Update[];canEdit:boolean}){
 return <div className={styles.stack} style={{marginBottom:16}}>
  <section className={styles.card}>
   <h2>Impacto</h2><p className={styles.body}>{project.impact||"O impacto esperado ainda não foi descrito."}</p>
   <div className={styles.section}><h2>O que o projeto procura</h2>{project.needs?.length?<div className={styles.meta}>{project.needs.map(item=><span className={styles.pill} key={item}>{item}</span>)}</div>:<p className={styles.muted}>Ainda não foram informadas necessidades como mentoria, parceiros ou investimento.</p>}</div>
   <div className={styles.section}><h2>Links</h2><div className={styles.actions}>{project.website_url?<Link className={styles.secondary} href={project.website_url} target="_blank" rel="noreferrer">Site / demonstração</Link>:null}{project.repository_url?<Link className={styles.secondary} href={project.repository_url} target="_blank" rel="noreferrer">Repositório</Link>:null}{!project.website_url&&!project.repository_url?<span className={styles.muted}>Nenhum link externo informado.</span>:null}</div></div>
  </section>
  <section className={styles.card}><h2>Atualizações do projeto</h2>{updates.length?<div className={styles.stack}>{updates.map(update=><div key={update.id}><p className={styles.body}>{update.body}</p><span className={styles.muted}>{new Date(update.created_at).toLocaleDateString("pt-BR")}</span></div>)}</div>:<p className={styles.muted}>Nenhuma atualização vinculada a este projeto ainda.</p>}</section>
  {canEdit?<section className={styles.card}><h3>Editar informações de portfólio</h3><form className={styles.form} action={updateProjectPortfolioAction}><input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="slug" value={project.slug}/><label>Impacto<textarea name="impact" defaultValue={project.impact||""} maxLength={6000} placeholder="Que transformação este projeto pretende gerar?"/></label><label>O que o projeto procura<input name="needs" defaultValue={(project.needs||[]).join(", ")} maxLength={1200} placeholder="Mentoria, investimento, parceiros, validação..."/></label><label>Site ou demonstração<input name="website_url" type="url" defaultValue={project.website_url||""} maxLength={500}/></label><label>Repositório<input name="repository_url" type="url" defaultValue={project.repository_url||""} maxLength={500}/></label><button className={styles.primary} type="submit">Salvar portfólio</button></form></section>:null}
 </div>;
}
