import { LessonServerPage } from "@/components/real/CoursesServerPages";

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string; lessonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug, lessonId } = await params;
  return <LessonServerPage slug={slug} lessonId={lessonId} searchParams={searchParams} />;
}
