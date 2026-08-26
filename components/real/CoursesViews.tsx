import Link from "next/link";
import { completeLessonAction, enrollCourseAction, undoLessonAction } from "@/lib/courses/actions";
import styles from "./Courses.module.css";

type CourseCard={id:string;slug:string;title:string;description:string;instructor:string;level:string;duration_minutes:number;totalLessons:number;completedLessons:number;enrolled:boolean};
type Lesson={id:string;title:string;description:string;position:number;completed:boolean};
type Module={id:string;title:string;position:number;lessons:Lesson[]};

function duration(minutes:number){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}h${m?` ${m}min`:""}`:`${m}min`;}

export function LearnView({courses}:{courses:CourseCard[]}){
 return <>
  <div className={styles.head}><div><h1>Aprender</h1><p className={styles.muted}>Cursos e progresso agora são persistidos na sua conta.</p></div></div>
  <div className={styles.grid}>{courses.length===0?<div className={styles.empty}>Nenhum curso publicado no momento.</div>:courses.map(course=>{
    const percent=course.totalLessons?Math.round(course.completedLessons/course.totalLessons*100):0;
    return <article className={styles.card} key={course.id}>
      <h2>{course.title}</h2><p className={styles.muted}>{course.description}</p>
      <div className={styles.meta}><span className={styles.pill}>{course.level}</span><span className={styles.pill}>{duration(course.duration_minutes)}</span><span className={styles.pill}>{course.instructor}</span></div>
      {course.enrolled?<><div className={styles.progress}><span style={{width:`${percent}%`}}/></div><p className={styles.muted}>{course.completedLessons}/{course.totalLessons} aulas · {percent}%</p></>:null}
      <Link className={styles.primary} href={`/app/learn/${course.slug}`}>{course.enrolled?"Continuar curso":"Ver curso"}</Link>
    </article>;
  })}</div>
 </>;
}

export function CourseView({course,modules,enrolled,status,error}:{course:{id:string;slug:string;title:string;description:string;instructor:string;level:string;duration_minutes:number};modules:Module[];enrolled:boolean;status?:string;error?:string}){
 const lessons=modules.flatMap(module=>module.lessons);const completed=lessons.filter(lesson=>lesson.completed).length;const percent=lessons.length?Math.round(completed/lessons.length*100):0;
 return <>
  <div className={styles.head}><div><Link href="/app/learn">← Cursos</Link><h1>{course.title}</h1><p className={styles.muted}>{course.description}</p><div className={styles.meta}><span className={styles.pill}>{course.level}</span><span className={styles.pill}>{duration(course.duration_minutes)}</span><span className={styles.pill}>{course.instructor}</span></div></div></div>
  {status==="enrolled"?<div className={styles.notice}>Matrícula iniciada. Seu progresso será salvo nesta conta.</div>:null}{error?<div className={styles.error}>Não foi possível concluir a ação.</div>:null}
  {!enrolled?<section className={styles.card}><h2>Começar curso</h2><p className={styles.muted}>Ao iniciar, seu progresso fica associado à sua conta.</p><form action={enrollCourseAction}><input type="hidden" name="course_id" value={course.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.primary}>Iniciar curso</button></form></section>:<section className={styles.card}><h2>Seu progresso</h2><div className={styles.progress}><span style={{width:`${percent}%`}}/></div><p>{completed}/{lessons.length} aulas concluídas · {percent}%</p>{lessons.length>0&&completed===lessons.length?<div className={styles.actions}><span className={styles.complete}>Curso concluído ✓</span><Link className={styles.primary} href="/app/projects/new">Criar projeto para o portfólio</Link></div>:null}</section>}
  <div className={styles.modules}>{modules.map(module=><section className={styles.module} key={module.id}><h2>{module.position}. {module.title}</h2>{module.lessons.map(lesson=><div className={styles.lesson} key={lesson.id}><div><Link href={enrolled?`/app/learn/${course.slug}/lesson/${lesson.id}`:`/app/learn/${course.slug}`}>{lesson.completed?"✓ ":""}{lesson.title}</Link><p className={styles.muted}>{lesson.description}</p></div>{lesson.completed?<span className={styles.complete}>Concluída</span>:null}</div>)}</section>)}</div>
 </>;
}

export function LessonView({course,lesson,modules,completed,status,error}:{course:{slug:string;title:string};lesson:{id:string;title:string;description:string;content_md:string};modules:Module[];completed:boolean;status?:string;error?:string}){
 return <>
  <div className={styles.head}><div><Link href={`/app/learn/${course.slug}`}>← {course.title}</Link><h1>{lesson.title}</h1></div></div>
  {status==="completed"?<div className={styles.notice}>Aula concluída e progresso salvo.</div>:null}{error?<div className={styles.error}>Não foi possível salvar o progresso.</div>:null}
  <div className={styles.lessonPage}>
    <article className={styles.content}><p>{lesson.description}</p>{lesson.content_md?<div>{lesson.content_md}</div>:<p className={styles.muted}>O conteúdo completo desta aula será publicado pelo administrador. A estrutura e o progresso já são reais.</p>}<div className={styles.actions}>{completed?<form action={undoLessonAction}><input type="hidden" name="lesson_id" value={lesson.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.secondary}>Marcar como não concluída</button></form>:<form action={completeLessonAction}><input type="hidden" name="lesson_id" value={lesson.id}/><input type="hidden" name="slug" value={course.slug}/><button className={styles.primary}>Concluir aula</button></form>}</div></article>
    <aside className={styles.sidebar}><h3>Conteúdo do curso</h3>{modules.map(module=><div key={module.id}><strong>{module.title}</strong>{module.lessons.map(item=><p key={item.id}><Link href={`/app/learn/${course.slug}/lesson/${item.id}`}>{item.completed?"✓ ":""}{item.title}</Link></p>)}</div>)}</aside>
  </div>
 </>;
}
