import Link from "next/link";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/lib/projects/actions";
import styles from "./Projects.module.css";

type Role = "participant" | "investor";
type TeamOption = { id: string; name: string };
type ProjectView = {
  id: string; slug: string; title: string; short_description: string; problem: string; solution: string;
  stage: string; category: string; location: string; tags: string[]; readme: string; visibility: "private"|"platform";
  owner_user_id: string|null; owner_team_id: string|null; created_by: string; ownerLabel?: string;
};
function prefix(role: Role){ return role === "investor" ? "/investor/projects" : "/app/projects"; }
function firstMessage(status?: string){ return status === "deleted" ? "Projeto excluído." : status === "created" ? "Projeto criado." : status === "saved" ? "Projeto atualizado." : null; }
function errorMessage(error?: string){ if(!error)return null; return error === "owner" ? "Você não pode publicar em nome dessa equipe." : error === "title" ? "Informe um título válido." : "Não foi possível concluir a ação."; }

export function ProjectsIndex({role,projects,status,error}:{role:Role;projects:ProjectView[];status?:string;error?:string}){
 const base=prefix(role); const notice=firstMessage(status); const failure=errorMessage(error);
 return <>
  <div className={styles.head}><div><h1>Meus projetos</h1><p className={styles.muted}>Projetos pessoais e de equipes em que você participa, salvos no Supabase.</p></div><Link className={styles.primary} href={`${base}/new`}>Criar projeto</Link></div>
  {notice&&<div className={styles.notice}>{notice}</div>}{failure&&<div className={styles.error}>{failure}</div>}
  {projects.length===0?<div className={styles.empty}>Você ainda não possui projetos reais. Crie o primeiro para começar.</div>:<div className={styles.grid}>{projects.map(project=><article className={styles.card} key={project.id}><Link href={`${base}/${project.slug}`}><h2>{project.title}</h2></Link><p className={styles.muted}>{project.short_description||"Sem descrição curta."}</p><p className={styles.owner}>{project.ownerLabel||"Autoria não informada"}</p><div className={styles.meta}><span className={styles.pill}>{project.stage}</span>{project.category&&<span className={styles.pill}>{project.category}</span>}<span className={styles.pill}>{project.visibility==="private"?"Privado":"Na plataforma"}</span>{project.tags.slice(0,3).map(tag=><span className={styles.pill} key={tag}>{tag}</span>)}</div></article>)}</div>}
 </>;
}

export function NewProjectView({role,teams,error}:{role:Role;teams:TeamOption[];error?:string}){
 const base=prefix(role); const failure=errorMessage(error);
 return <><div className={styles.head}><div><h1>Criar projeto</h1><p className={styles.muted}>Escolha se o projeto é pessoal ou publicado por uma equipe da qual você participa.</p></div><Link className={styles.secondary} href={base}>Voltar</Link></div>{failure&&<div className={styles.error}>{failure}</div>}
 <form className={`${styles.card} ${styles.form}`} action={createProjectAction}>
  <label>Publicar como<select name="owner" defaultValue="personal"><option value="personal">Meu perfil</option>{teams.map(team=><option key={team.id} value={team.id}>Equipe · {team.name}</option>)}</select></label>
  <label>Título<input required minLength={2} maxLength={140} name="title"/></label>
  <label>Descrição curta<textarea name="short_description" maxLength={320}/></label>
  <label>Problema<textarea name="problem" maxLength={4000}/></label>
  <label>Solução<textarea name="solution" maxLength={4000}/></label>
  <label>Estágio<select name="stage" defaultValue="Ideia"><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
  <label>Categoria<input name="category" maxLength={100}/></label><label>Localização<input name="location" maxLength={160}/></label>
  <label>Tags<input name="tags" maxLength={700} placeholder="IA, saúde, educação"/></label>
  <label>Descrição completa / README<textarea name="readme" maxLength={20000}/></label>
  <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privado</option></select></label>
  <div className={styles.actions}><button className={styles.primary}>Criar projeto</button><Link className={styles.secondary} href={base}>Cancelar</Link></div>
 </form></>;
}

export function ProjectDetailView({role,project,canEdit,canDelete,status,error}:{role:Role;project:ProjectView;canEdit:boolean;canDelete:boolean;status?:string;error?:string}){
 const base=prefix(role); const notice=firstMessage(status); const failure=errorMessage(error);
 return <><div className={styles.head}><div><Link className={styles.back} href={base}>← Meus projetos</Link><h1>{project.title}</h1><p className={styles.muted}>{project.short_description}</p><p className={styles.owner}>{project.ownerLabel}</p></div><div className={styles.meta}><span className={styles.pill}>{project.stage}</span><span className={styles.pill}>{project.visibility==="private"?"Privado":"Na plataforma"}</span></div></div>{notice&&<div className={styles.notice}>{notice}</div>}{failure&&<div className={styles.error}>{failure}</div>}
 <div className={styles.twoCol}><div className={styles.stack}><section className={styles.card}><h2>Problema</h2><p className={styles.body}>{project.problem||"Ainda não descrito."}</p><div className={styles.section}><h2>Solução</h2><p className={styles.body}>{project.solution||"Ainda não descrita."}</p></div><div className={styles.section}><h2>Sobre o projeto</h2><p className={styles.body}>{project.readme||"Sem descrição completa."}</p></div><div className={styles.meta}>{project.tags.map(tag=><span className={styles.pill} key={tag}>{tag}</span>)}</div></section></div>
 <aside className={styles.stack}>{canEdit&&<section className={styles.card}><h3>Editar projeto</h3><form className={styles.form} action={updateProjectAction}><input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="slug" value={project.slug}/><label>Título<input required name="title" defaultValue={project.title} maxLength={140}/></label><label>Descrição curta<textarea name="short_description" defaultValue={project.short_description} maxLength={320}/></label><label>Problema<textarea name="problem" defaultValue={project.problem} maxLength={4000}/></label><label>Solução<textarea name="solution" defaultValue={project.solution} maxLength={4000}/></label><label>Estágio<select name="stage" defaultValue={project.stage}><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label><label>Categoria<input name="category" defaultValue={project.category} maxLength={100}/></label><label>Localização<input name="location" defaultValue={project.location} maxLength={160}/></label><label>Tags<input name="tags" defaultValue={project.tags.join(", ")} maxLength={700}/></label><label>README<textarea name="readme" defaultValue={project.readme} maxLength={20000}/></label><label>Visibilidade<select name="visibility" defaultValue={project.visibility}><option value="platform">Na plataforma</option><option value="private">Privado</option></select></label><button className={styles.primary}>Salvar alterações</button></form></section>}{canDelete&&<section className={styles.card}><h3>Zona de controle</h3><form action={deleteProjectAction}><input type="hidden" name="project_id" value={project.id}/><button className={styles.danger}>Excluir projeto</button></form></section>}</aside></div></>;
}
