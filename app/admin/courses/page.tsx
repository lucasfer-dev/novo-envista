import Link from "next/link";
import { BookOpen, Clock3, FileText, Layers3, Plus, Video } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import styles from "@/components/admin/AdminViews.module.css";
import courseStyles from "./AdminCourses.module.css";
import { createCourseAdminAction } from "@/lib/admin/actions";
import { requireAdminUser } from "@/lib/admin/require-admin";

const PAGE_SIZE=20;
function pageNumber(value:string|string[]|undefined){const raw=typeof value==="string"?Number.parseInt(value,10):1;return Number.isFinite(raw)&&raw>0?raw:1;}
function duration(minutes:number){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}h${m?` ${m}min`:""}`:`${m}min`;}

export default async function AdminCourses({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {supabase,profile}=await requireAdminUser();const params=await searchParams;const page=pageNumber(params.page);const from=(page-1)*PAGE_SIZE;
 const [{data:courses,count,error},{count:publishedTotal},{count:draftTotal},{count:lessonTotal}]=await Promise.all([
  supabase.from("courses").select("id,slug,title,description,instructor,level,status,duration_minutes,updated_at,course_modules(id,course_lessons(id,course_lesson_assets(id,kind)))",{count:"exact"}).order("updated_at",{ascending:false}).range(from,from+PAGE_SIZE-1),
  supabase.from("courses").select("id",{count:"exact",head:true}).eq("status","published"),
  supabase.from("courses").select("id",{count:"exact",head:true}).eq("status","draft"),
  supabase.from("course_lessons").select("id",{count:"exact",head:true}),
 ]);
 const rows=(courses??[]).map((course:any)=>{const lessons=(course.course_modules??[]).flatMap((module:any)=>module.course_lessons??[]);const assets=lessons.flatMap((lesson:any)=>lesson.course_lesson_assets??[]);return {...course,moduleCount:(course.course_modules??[]).length,lessonCount:lessons.length,assetCount:assets.length,videoCount:assets.filter((asset:any)=>asset.kind==="video").length};});
 return <AdminShell profile={profile} title="Cursos">
  <div className={styles.head}><div><span className={styles.kicker}><BookOpen size={14}/> CONTEÚDO EDUCACIONAL</span><h1>Cursos</h1><p className={styles.muted}>Crie trilhas, organize módulos e aulas e publique vídeos e materiais para os participantes.</p></div></div>
  <div className={styles.metrics}><div className={styles.metric}><strong>{count??rows.length}</strong><span>Cursos cadastrados</span></div><div className={styles.metric}><strong>{publishedTotal??0}</strong><span>Cursos publicados</span></div><div className={styles.metric}><strong>{draftTotal??0}</strong><span>Cursos em rascunho</span></div><div className={styles.metric}><strong>{lessonTotal??0}</strong><span>Aulas cadastradas</span></div></div>
  {params.error?<div className={styles.error}>Não foi possível concluir a operação.</div>:null}{error?<div className={styles.error}>Não foi possível carregar os cursos.</div>:null}
  <div className={`${styles.courseManagerGrid} ${courseStyles.manager}`}>
   <section className={`${styles.card} ${styles.createCourseCard} ${courseStyles.createCard}`}><div className={styles.sectionTitle}><div className={styles.sectionIcon}><Plus size={18}/></div><div><h2>Novo curso</h2><p className={styles.muted}>Crie a estrutura básica e depois adicione módulos, aulas e materiais.</p></div></div><form className={styles.form} action={createCourseAdminAction}><label>Título<input name="title" maxLength={160} required placeholder="Ex.: Da ideia ao projeto"/></label><label>Slug opcional<input name="slug" maxLength={120} placeholder="gerado automaticamente pelo título"/></label><label>Descrição<textarea name="description" maxLength={3000} rows={4} placeholder="Explique o que o participante vai aprender..."/></label><div className={styles.formColumns}><label>Instrutor<input name="instructor" maxLength={160} defaultValue="Equipe Envista"/></label><label>Nível<input name="level" maxLength={80} defaultValue="Iniciante"/></label></div><div className={styles.formColumns}><label>Duração total (min)<input name="duration_minutes" type="number" min="0" max="100000" defaultValue="0"/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label></div><button className={styles.primary}>Criar curso e montar conteúdo</button></form></section>
   <section><div className={styles.catalogAdminHead}><div><h2>Cursos cadastrados</h2><p className={styles.muted}>Abra um curso para editar a trilha e anexar vídeos, PDFs e outros materiais.</p></div></div><div className={styles.adminCourseList}>{!error&&rows.length===0?<div className={styles.empty}>Nenhum curso cadastrado.</div>:rows.map((course:any)=><Link href={`/admin/courses/${course.id}`} key={course.id} className={`${styles.adminCourseCard} ${course.status==="archived"?styles.adminCourseArchived:""}`}><div className={styles.adminCourseIcon}><BookOpen size={21}/></div><div className={styles.adminCourseInfo}><div className={styles.adminCourseTitle}><h3>{course.title}</h3><span className={course.status==="published"?styles.statusPublished:course.status==="archived"?styles.statusArchived:styles.statusDraft}>{course.status==="published"?"Publicado":course.status==="draft"?"Rascunho":"Arquivado"}</span></div><p>{course.description||"Sem descrição."}</p><div className={styles.adminCourseMeta}><span><Layers3 size={13}/>{course.moduleCount} módulos</span><span><BookOpen size={13}/>{course.lessonCount} aulas</span><span><Video size={13}/>{course.videoCount} vídeos</span><span><FileText size={13}/>{course.assetCount} materiais</span><span><Clock3 size={13}/>{duration(course.duration_minutes)}</span></div><small>/{course.slug}</small></div><span className={styles.adminCourseAction}>Editar curso <b>→</b></span></Link>)}</div>{!error?<AdminPagination pathname="/admin/courses" page={page} pageSize={PAGE_SIZE} total={count??0}/>:null}</section>
  </div>
 </AdminShell>;
}
