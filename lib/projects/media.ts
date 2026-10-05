import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectMedia = { url: string; name: string };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Use the viewer's client: attachment rows and signed URLs both respect RLS.
// SVG/HTML uploads are never rendered inline.
export async function loadProjectMedia(supabase: SupabaseClient, projectIds: string[]) {
  const result = new Map<string, ProjectMedia[]>();
  if (!projectIds.length) return result;
  const { data: attachments } = await supabase.from("project_attachments")
    .select("project_id,path,file_name,mime_type").in("project_id", projectIds)
    .in("mime_type", IMAGE_TYPES).order("created_at", { ascending: false }).limit(300);
  const counts = new Map<string, number>();
  const selected = (attachments ?? []).filter(file => {
    const count = counts.get(file.project_id) ?? 0;
    counts.set(file.project_id, count + 1);
    return count < 6;
  });
  if (!selected.length) return result;
  const { data: signed } = await supabase.storage.from("project-assets").createSignedUrls(selected.map(file => file.path), 900);
  selected.forEach((file, index) => {
    const url = signed?.[index]?.signedUrl;
    if (url) result.set(file.project_id, [...(result.get(file.project_id) ?? []), { url, name: file.file_name }]);
  });
  return result;
}
