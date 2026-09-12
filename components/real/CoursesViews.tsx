import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, FileText, GraduationCap, PlayCircle, Sparkles, Video } from "lucide-react";
import { completeLessonAction, enrollCourseAction, undoLessonAction } from "@/lib/courses/actions";
import styles from "./Courses.module.css";

type CourseCard={id:string;slug:string;title:string;description:string;instructor:string;level:string;duration_minutes:number;totalLessons:number;completedLessons:number;enrolled:boolean};
type Lesson={id:string;title:string;description:string;position:number;duration_minutes?:number;completed:boolean;assetCount?:number};
type Module={id:string;title:string;position:number;lessons:Lesson[]};
type LessonAsset={id:string;file_name:string;mime_type:string;size_bytes:number;kind:"video"|"file";url:string|null};

function duration(minutes:number){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}h${m?` ${m}min`:""}`:`${m}min`;}
function percent(course:CourseCard){return course.totalLessons?Math.round(course.completedLessons/course.totalLessons*100):0;}

export function LearnView({courses}:{courses:CourseCard[]}){
 const enrolled=courses.filter(course=>course.enrolled);
 const featured=enrolled.find(course=>percent(course)<100)??courses[0];
 const completed=enrolled.filter(course=>percent(course)===100).length;
 return <div className={styles.learnPage}>
  <div className={styles.learnHeading}><div><span className={styles.eyebrow}><Sparkles size={14}/> TRILHAS ENVISTA</span><h1>Aprender</h1><p>Desenvolva habilidades, avance no seu ritmo e transforme aprendizado em projetos para o portfólio.</p></div><div className={styles.learnStats}><div><strong>{courses.length}</strong><span>Cursos</span></div><div><strong>{enrolled.length}</strong><span>Em andamento</span></div><div><strong>{completed}</strong><span>Concluídos</span></div></div></div>
  {featured?<section className={styles.featured}>
   <div className={styles.featuredGlow}/><div className={styles.featuredContent}><span className={styles.featuredLabel}>{featured.enrolled?"CONTINUAR APRENDENDO":"CURSO EM DESTAQUE"}</span><h2>{featured.title}</h2><p>{featured.description}</p><div className={styles.featuredMeta}><span><GraduationCap size={15}/>{featured.level}</span><span><Clock3 size={15}/>{duration(featured.duration_minutes)}</span><span><BookOpen size={15}/>{featured.totalLessons} aulas</span></div>{featured.enrolled?<><div className={styles.progressLabel}><span>Seu progresso</span><strong>{percent(featured)}%</strong></div><div className={styles.progress}><span style={{width:`${percent(featured)}%`}}/></div></>:null}<div className={styles.featuredActions}><Link prefetch={false} className={styles.primary} href={`/app/learn/${featured.slug}`}>{featured.enrolled?"Continuar curso":"Conhecer curso"}<PlayCircle size={16}/></Link></div></div><div className={styles.featuredVisual}><div className={styles.visualMark}><GraduationCap size={42}/></div><span>Aprender · construir · evoluir</span></div>
  </section>:null}
  <div className={styles.catalogHead}><div><h2>Explore os cursos</h2><p className={styles.muted}>Conteúdos práticos criados para acompanhar sua evolução no Envista.</p></div><span className={styles.catalogCount}>{courses.length} disponíveis</span></div>
  <div className={styles.grid}>{courses.length===0?<div className={styles.empty}>Nenhum curso publicado no momento.</div>:courses.map(course=>{
    const value=percent(course);
    return <article className={styles.courseCard} key={course.id}>
      <div className={styles.courseCover}><span className={styles.coverIcon}><BookOpen size={28}/></span><span className={styles.levelBadge}>{course.level}</span>{course.enrolled?<span className={styles.enrolledBadge}>{value===100?"Concluído":"Em andamento"}</span>:null}</div>
      <div className={styles.courseBody}><h3>{course.title}</h3><p>{course.description}</p><div className={styles.courseMeta}><span><Clock3 size={14}/>{duration(course.duration_minutes)}</span><span><BookOpen size={14}/>{course.totalLessons} aulas</span></div>{course.enrolled?<div className={styles.cardProgress}><div><span>Progresso</span><strong>{value}%</strong></div><div className={styles.progress}><span style={{width:`${value}%`}}/></div></div>:null}<div className={styles.courseFooter}><span>{course.instructor}</span><Link prefetch={false} href={`/app/learn/${course.slug}`}>{course.enrolled?"Continuar":"Ver curso"}</Link></div></div>
    </article>;
  })}</div>
 </div>;
}

export function CourseView({course,modules,enrolled,status,error}:{course:{id:string;slug:string;title:string;description:string;instructor:string;level:string;duration_minutes:number};modules:Module[];enrolled:boolean;status?:string;error?:string}){
 const lessons=modules.flatMap(module=>module.lessons);const completed=lessons.filter(lesson=>lesson.completed).length;const value=lessons.length?Math.round(completed/lessons.length*100):0;
 return <div className={styles.coursePage}>
  <Link className={styles.backLink} href="/app/learn">← Voltar para Aprender</Link>
  <section className={styles.courseHero}><div><span className={styles.eyebrow}><GraduationCap size={14}/> CURSO ENVISTA</span><h1>{course.title}</h1><p>{course.description}</p><div className={styles.featuredMeta}><span><GraduationCap size={15}/>{course.level}</span><span><Clock3 size={15}/>{duration(course.duration_minutes)}</span><span><BookOpen size={15}/>{lessons.length} aulas</span></div></div><div className={styles.courseHeroSide}>{enrolled?<><span>Seu progresso</span><strong>{value}%</strong><div className={styles.progress}><span style={{width:`${value}%`}}/></div><small>{completed} de {lessons.length} aulas concluídas</small></>:<><span>Pronto para começar?</span><strong>{lessons.length}</strong><small>aulas organizadas em {modules.length} módulos</small></>}</div></section>
  {status==="enrolled"?<div className={styles.notice}>Matrícula iniciada. Seu progresso será salvo nesta conta.</div>:null}{error?<div className={styles.error}>Não foi possível concluir a ação.</div>:null}
  {!enrolled?<section className={styles.startCard}><div><h2>Comece esta trilha</h2><p>Ao iniciar, seu progresso ficará associado à sua conta e você terá acesso aos vídeos e materiais das aulas.</p></div><form action={enrollCourseAction}><input type="hidden" name="course_id" value={course.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.primary}>Iniciar curso <PlayCircle size={16}/></button></form></section>:value===100?<div className={styles.completeBanner}><CheckCircle2 size={20}/><div><strong>Curso concluído</strong><span>Leve o aprendizado para o portfólio criando um projeto.</span></div><Link className={styles.primary} href="/app/projects/new">Criar projeto</Link></div>:null}
  <div className={styles.modules}>{modules.map(module=><section className={styles.module} key={module.id}><div className={styles.moduleTitle}><span>Módulo {module.position}</span><h2>{module.title}</h2><small>{module.lessons.length} aulas</small></div><div className={styles.lessonList}>{module.lessons.map(lesson=><div className={styles.lesson} key={lesson.id}><div className={styles.lessonNumber}>{lesson.completed?<CheckCircle2 size={17}/>:lesson.position}</div><div className={styles.lessonInfo}><Link prefetch={false} href={enrolled?`/app/learn/${course.slug}/lesson/${lesson.id}`:`/app/learn/${course.slug}`}>{lesson.title}</Link><p className={styles.muted}>{lesson.description}</p><div className={styles.lessonMeta}>{lesson.duration_minutes?<span><Clock3 size={13}/>{lesson.duration_minutes} min</span>:null}{lesson.assetCount?<span><FileText size={13}/>{lesson.assetCount} materiais</span>:null}</div></div>{lesson.completed?<span className={styles.complete}>Concluída</span>:enrolled?<span className={styles.openLesson}>Abrir aula →</span>:<span className={styles.locked}>Inicie o curso</span>}</div>)}</div></section>)}</div>
 </div>;
}

export function LessonView({course,lesson,modules,assets,completed,status,error}:{course:{slug:string;title:string};lesson:{id:string;title:string;description:string;content_md:string};modules:Module[];assets:LessonAsset[];completed:boolean;status?:string;error?:string}){
 const videos=assets.filter(asset=>asset.kind==="video"&&asset.url);const files=assets.filter(asset=>asset.kind==="file");
 return <div className={styles.lessonShell}>
  <div className={styles.lessonTop}><div><Link className={styles.backLink} href={`/app/learn/${course.slug}`}>← {course.title}</Link><span className={styles.eyebrow}>AULA</span><h1>{lesson.title}</h1><p>{lesson.description}</p></div><div className={completed?styles.lessonStatusDone:styles.lessonStatus}><CheckCircle2 size={16}/>{completed?"Concluída":"Em andamento"}</div></div>
  {status==="completed"?<div className={styles.notice}>Aula concluída e progresso salvo.</div>:null}{error?<div className={styles.error}>Não foi possível salvar o progresso.</div>:null}
  <div className={styles.lessonPage}>
    <article className={styles.content}>{videos.map(video=><div className={styles.videoWrap} key={video.id}><video controls preload="metadata"><source src={video.url??undefined} type={video.mime_type}/></video><span>{video.file_name}</span></div>)}<div className={styles.lessonText}>{lesson.content_md?<p style={{whiteSpace:"pre-wrap"}}>{lesson.content_md}</p>:<p className={styles.muted}>O conteúdo textual desta aula ainda não foi publicado.</p>}</div>{files.length?<section className={styles.materials}><h2>Materiais complementares</h2><div>{files.map(file=><a href={file.url??"#"} key={file.id} target="_blank" rel="noreferrer"><span className={styles.materialIcon}><FileText size={18}/></span><span><strong>{file.file_name}</strong><small>{Math.max(1,Math.ceil(file.size_bytes/1024))} KB</small></span><span>Baixar</span></a>)}</div></section>:null}<div className={styles.actions}>{completed?<form action={undoLessonAction}><input type="hidden" name="lesson_id" value={lesson.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.secondary}>Marcar como não concluída</button></form>:<form action={completeLessonAction}><input type="hidden" name="lesson_id" value={lesson.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.primary}>Concluir aula <CheckCircle2 size={16}/></button></form>}</div></article>
    <aside className={styles.sidebar}><div className={styles.sidebarHead}><span>Conteúdo do curso</span><BookOpen size={17}/></div>{modules.map(module=><div key={module.id}><strong>{module.position}. {module.title}</strong>{module.lessons.map(item=><p key={item.id}><Link prefetch={false} className={item.id===lesson.id?styles.currentLesson:""} href={`/app/learn/${course.slug}/lesson/${item.id}`}>{item.completed?"✓ ":""}{item.title}</Link></p>)}</div>)}</aside>
  </div>
 </div>;
}
