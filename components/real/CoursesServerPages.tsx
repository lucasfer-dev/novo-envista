import { notFound, redirect } from "next/navigation";
import ProductShell from "@/components/real/ProductShell";
import { CourseView, LearnView, LessonView } from "@/components/real/CoursesViews";
import { requireProductUser } from "@/lib/auth/require-product-user";

type Search=Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

async function courseStructure(supabase:any,courseId:string,userId:string){
 const [{data:modules},{data:progress}]=await Promise.all([
  supabase.from("course_modules").select("id,title,position,course_lessons(id,title,description,content_md,position,duration_minutes)").eq("course_id",courseId).order("position",{ascending:true}),
  supabase.from("lesson_progress").select("lesson_id").eq("user_id",userId),
 ]);
 const completed=new Set((progress??[]).map((item:any)=>item.lesson_id));
 return (modules??[]).map((module:any)=>({id:module.id,title:module.title,position:module.position,lessons:(module.course_lessons??[]).sort((a:any,b:any)=>a.position-b.position).map((lesson:any)=>({...lesson,completed:completed.has(lesson.id)}))}));
}

export async function LearnServerPage(){
 const {supabase,userId,appUser}=await requireProductUser("participant");
 const [{data:courses},{data:enrollments},{data:progress}]=await Promise.all([
  supabase.from("courses").select("id,slug,title,description,instructor,level,duration_minutes,course_modules(id,course_lessons(id))").eq("status","published").order("title"),
  supabase.from("course_enrollments").select("course_id").eq("user_id",userId),
  supabase.from("lesson_progress").select("lesson_id").eq("user_id",userId),
 ]);
 const enrolled=new Set((enrollments??[]).map((item:any)=>item.course_id));const done=new Set((progress??[]).map((item:any)=>item.lesson_id));
 const cards=(courses??[]).map((course:any)=>{const lessonIds=(course.course_modules??[]).flatMap((module:any)=>(module.course_lessons??[]).map((lesson:any)=>lesson.id));return {...course,totalLessons:lessonIds.length,completedLessons:lessonIds.filter((id:string)=>done.has(id)).length,enrolled:enrolled.has(course.id)};});
 return <ProductShell user={appUser} title="Aprender" variant="legacyDark"><LearnView courses={cards as never[]}/></ProductShell>;
}

export async function CourseServerPage({slug,searchParams}:{slug:string;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser("participant");const query=await searchParams;
 const {data:course}=await supabase.from("courses").select("id,slug,title,description,instructor,level,duration_minutes,status").eq("slug",slug).eq("status","published").maybeSingle();if(!course)notFound();
 const [{data:enrollment},modules]=await Promise.all([supabase.from("course_enrollments").select("course_id").eq("course_id",course.id).eq("user_id",userId).maybeSingle(),courseStructure(supabase,course.id,userId)]);
 return <ProductShell user={appUser} title={course.title} variant="legacyDark"><CourseView course={course as never} modules={modules as never[]} enrolled={Boolean(enrollment)} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}

export async function LessonServerPage({slug,lessonId,searchParams}:{slug:string;lessonId:string;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser("participant");const query=await searchParams;
 const {data:course}=await supabase.from("courses").select("id,slug,title,status").eq("slug",slug).eq("status","published").maybeSingle();if(!course)notFound();
 const {data:enrollment}=await supabase.from("course_enrollments").select("course_id").eq("course_id",course.id).eq("user_id",userId).maybeSingle();if(!enrollment)redirect(`/app/learn/${slug}`);
 const modules=await courseStructure(supabase,course.id,userId);const lesson=modules.flatMap((module:any)=>module.lessons).find((item:any)=>item.id===lessonId);if(!lesson)notFound();
 return <ProductShell user={appUser} title={lesson.title} variant="legacyDark"><LessonView course={course as never} lesson={lesson as never} modules={modules as never[]} completed={Boolean(lesson.completed)} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}
