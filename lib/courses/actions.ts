"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function enrollCourseAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const courseId = text(formData, "course_id", 80);
  const slug = text(formData, "slug", 180);
  if (!courseId || !slug) redirect("/app/learn");

  const { data: enrollment, error } = await supabase
    .from("course_enrollments")
    .insert({ course_id: courseId, user_id: userId })
    .select("course_id")
    .single();
  if (error && error.code !== "23505") redirect(`/app/learn/${slug}?error=enroll`);
  if (!enrollment && !error) redirect(`/app/learn/${slug}?error=enroll`);
  revalidatePath(`/app/learn/${slug}`);
  redirect(`/app/learn/${slug}?status=enrolled`);
}

export async function completeLessonAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const lessonId = text(formData, "lesson_id", 80);
  const slug = text(formData, "slug", 180);
  if (!lessonId || !slug) redirect("/app/learn");

  // Do not let a placeholder lesson produce artificial 100% course progress.
  const { data: lesson, error: lessonError } = await supabase.from("course_lessons")
    .select("id,module_id,content_md").eq("id", lessonId).maybeSingle();
  if (lessonError || !lesson) redirect(`/app/learn/${slug}?error=unavailable`);

  const [{ data: module }, { count: assetCount }] = await Promise.all([
    supabase.from("course_modules").select("course_id").eq("id", lesson.module_id).maybeSingle(),
    supabase.from("course_lesson_assets").select("id", { head: true, count: "exact" }).eq("lesson_id", lessonId),
  ]);
  if (!module) redirect(`/app/learn/${slug}?error=unavailable`);
  const { data: course } = await supabase.from("courses")
    .select("slug,status").eq("id", module.course_id).maybeSingle();
  if (!course || course.slug !== slug || course.status !== "published") {
    redirect(`/app/learn/${slug}?error=unavailable`);
  }
  if ((lesson.content_md || "").trim().length < 80 && !assetCount) {
    redirect(`/app/learn/${slug}/lesson/${lessonId}?error=content`);
  }

  const { data: progress, error } = await supabase
    .from("lesson_progress")
    .insert({ lesson_id: lessonId, user_id: userId })
    .select("lesson_id")
    .single();
  if (error && error.code !== "23505") redirect(`/app/learn/${slug}/lesson/${lessonId}?error=progress`);
  if (!progress && !error) redirect(`/app/learn/${slug}/lesson/${lessonId}?error=progress`);
  revalidatePath(`/app/learn/${slug}`);
  revalidatePath(`/app/learn/${slug}/lesson/${lessonId}`);
  redirect(`/app/learn/${slug}/lesson/${lessonId}?status=completed`);
}

export async function undoLessonAction(formData: FormData) {
  const { supabase, userId } = await requireProductUser("participant");
  const lessonId = text(formData, "lesson_id", 80);
  const slug = text(formData, "slug", 180);
  if (!lessonId || !slug) redirect("/app/learn");

  const { error } = await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId).eq("user_id", userId);
  if (error) redirect(`/app/learn/${slug}/lesson/${lessonId}?error=progress`);
  revalidatePath(`/app/learn/${slug}`);
  revalidatePath(`/app/learn/${slug}/lesson/${lessonId}`);
  redirect(`/app/learn/${slug}/lesson/${lessonId}`);
}
