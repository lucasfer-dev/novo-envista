"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/require-admin";

function text(formData:FormData,name:string,max:number){const value=formData.get(name);return typeof value==="string"?value.trim().slice(0,max):"";}
function integer(formData:FormData,name:string,min=0,max=100000){const value=Number(formData.get(name));return Number.isFinite(value)?Math.max(min,Math.min(max,Math.trunc(value))):min;}
function slugify(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100);}

async function audit(supabase:any,userId:string,action:string,targetType:string,targetId:string,metadata:Record<string,unknown>={}){
 await supabase.from("admin_audit_log").insert({admin_user_id:userId,action,target_type:targetType,target_id:targetId,metadata});
}

export async function createCourseAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const title=text(formData,"title",160);const slug=slugify(text(formData,"slug",120)||title);if(!title||!slug)redirect("/admin/courses?error=course");
 const payload={slug,title,description:text(formData,"description",3000),instructor:text(formData,"instructor",160)||"Equipe Envista",level:text(formData,"level",80)||"Iniciante",duration_minutes:integer(formData,"duration_minutes"),status:["draft","published","archived"].includes(text(formData,"status",20))?text(formData,"status",20):"draft"};
 const {data,error}=await supabase.from("courses").insert(payload).select("id").single();if(error||!data)redirect("/admin/courses?error=course");await audit(supabase,userId,"course.create","course",data.id,{status:payload.status});revalidatePath("/admin/courses");redirect(`/admin/courses/${data.id}?status=created`);
}

export async function updateCourseAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const id=text(formData,"course_id",80);if(!id)redirect("/admin/courses");const title=text(formData,"title",160);const status=text(formData,"status",20);
 const payload={title,description:text(formData,"description",3000),instructor:text(formData,"instructor",160)||"Equipe Envista",level:text(formData,"level",80)||"Iniciante",duration_minutes:integer(formData,"duration_minutes"),status:["draft","published","archived"].includes(status)?status:"draft"};
 const {error}=await supabase.from("courses").update(payload).eq("id",id);if(error)redirect(`/admin/courses/${id}?error=save`);await audit(supabase,userId,"course.update","course",id,{status:payload.status});revalidatePath("/admin/courses");revalidatePath(`/admin/courses/${id}`);redirect(`/admin/courses/${id}?status=saved`);
}

export async function createModuleAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const courseId=text(formData,"course_id",80),title=text(formData,"title",160);if(!courseId||!title)redirect("/admin/courses");const position=integer(formData,"position",1,1000);
 const {data,error}=await supabase.from("course_modules").insert({course_id:courseId,title,position}).select("id").single();if(error||!data)redirect(`/admin/courses/${courseId}?error=module`);await audit(supabase,userId,"course.module.create","course_module",data.id,{course_id:courseId});revalidatePath(`/admin/courses/${courseId}`);redirect(`/admin/courses/${courseId}?status=module-created`);
}

export async function createLessonAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const courseId=text(formData,"course_id",80),moduleId=text(formData,"module_id",80),title=text(formData,"title",180);if(!courseId||!moduleId||!title)redirect("/admin/courses");
 const payload={module_id:moduleId,title,description:text(formData,"description",3000),content_md:text(formData,"content_md",50000),position:integer(formData,"position",1,1000),duration_minutes:integer(formData,"duration_minutes",0,10000)};
 const {data,error}=await supabase.from("course_lessons").insert(payload).select("id").single();if(error||!data)redirect(`/admin/courses/${courseId}?error=lesson`);await audit(supabase,userId,"course.lesson.create","course_lesson",data.id,{course_id:courseId,module_id:moduleId});revalidatePath(`/admin/courses/${courseId}`);redirect(`/admin/courses/${courseId}?status=lesson-created`);
}

export async function updateLessonAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const courseId=text(formData,"course_id",80),lessonId=text(formData,"lesson_id",80);if(!courseId||!lessonId)redirect("/admin/courses");
 const payload={title:text(formData,"title",180),description:text(formData,"description",3000),content_md:text(formData,"content_md",50000),position:integer(formData,"position",1,1000),duration_minutes:integer(formData,"duration_minutes",0,10000)};
 const {error}=await supabase.from("course_lessons").update(payload).eq("id",lessonId);if(error)redirect(`/admin/courses/${courseId}?error=lesson-save`);await audit(supabase,userId,"course.lesson.update","course_lesson",lessonId,{course_id:courseId});revalidatePath(`/admin/courses/${courseId}`);redirect(`/admin/courses/${courseId}?status=lesson-saved`);
}

export async function deleteLessonAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const courseId=text(formData,"course_id",80),lessonId=text(formData,"lesson_id",80);if(lessonId){const {error}=await supabase.from("course_lessons").delete().eq("id",lessonId);if(!error)await audit(supabase,userId,"course.lesson.delete","course_lesson",lessonId,{course_id:courseId});}revalidatePath(`/admin/courses/${courseId}`);redirect(`/admin/courses/${courseId}`);
}

export async function updateMessageReportAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const id=text(formData,"report_id",80);const status=text(formData,"status",20);if(!id||!["open","reviewing","resolved","dismissed"].includes(status))redirect("/admin/moderation?error=report");const resolved=["resolved","dismissed"].includes(status)?new Date().toISOString():null;
 const {error}=await supabase.from("message_reports").update({status,admin_note:text(formData,"admin_note",2000),resolved_at:resolved}).eq("id",id);if(error)redirect("/admin/moderation?error=report");await audit(supabase,userId,"message_report.update","message_report",id,{status});revalidatePath("/admin/moderation");redirect("/admin/moderation?status=saved");
}

export async function updatePrivacyRequestAdminAction(formData:FormData){
 const {supabase,userId}=await requireAdminUser();const id=text(formData,"request_id",80),status=text(formData,"status",20);if(!id||!["open","in_review","completed","rejected"].includes(status))redirect("/admin/privacy?error=request");const resolved=["completed","rejected"].includes(status)?new Date().toISOString():null;
 const {error}=await supabase.from("privacy_requests").update({status,admin_note:text(formData,"admin_note",2000),resolved_at:resolved}).eq("id",id);if(error)redirect("/admin/privacy?error=request");await audit(supabase,userId,"privacy_request.update","privacy_request",id,{status});revalidatePath("/admin/privacy");redirect("/admin/privacy?status=saved");
}
