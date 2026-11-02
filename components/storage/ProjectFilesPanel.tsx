import ProjectAttachmentUploader from "@/components/storage/ProjectAttachmentUploader";
import { deleteProjectAttachmentAction } from "@/lib/storage/actions";
import { setProjectCoverAction } from "@/lib/storage/project-cover-actions";
import { requireProductUser } from "@/lib/auth/require-product-user";
import styles from "./Uploaders.module.css";

export default async function ProjectFilesPanel({ projectId, slug, canEdit }: { projectId: string; slug: string; canEdit: boolean }) {
  const { supabase, userId } = await requireProductUser();
  const { data: attachments } = await supabase
    .from("project_attachments")
    .select("id,path,file_name,mime_type,size_bytes,uploaded_by,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const files = await Promise.all((attachments ?? []).map(async (item) => {
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(item.mime_type);
    const [{ data: download }, preview] = await Promise.all([
      supabase.storage.from("project-assets").createSignedUrl(item.path, 900, { download: item.file_name }),
      isImage ? supabase.storage.from("project-assets").createSignedUrl(item.path, 900) : Promise.resolve({ data: null }),
    ]);
    return { ...item, url: download?.signedUrl ?? null, isImage, previewUrl: preview.data?.signedUrl ?? null };
  }));
  const totalBytes = files.reduce((sum, file) => sum + Number(file.size_bytes || 0), 0);

  return (
    <div className={styles.box}>
      <span className={styles.label}>Arquivos e galeria do projeto</span>
      <p className={styles.hint}>Bucket privado. Os links expiram em 15 minutos. {files.length}/50 arquivos · {Math.ceil(totalBytes / 1024 / 1024)} MB/100 MB usados.</p>
      {canEdit ? <><ProjectAttachmentUploader projectId={projectId} userId={userId} /><p className={styles.hint}>Envie uma imagem JPG, PNG ou WebP e selecione "Usar como capa". As imagens enviadas compõem a galeria.</p></> : null}
      <div className={styles.files}>
        {files.length === 0 ? <span className={styles.hint}>Nenhum arquivo enviado.</span> : files.map((file) => (
          <div className={styles.file} key={file.id}>
            <div>
              {file.previewUrl ? <a href={file.url || file.previewUrl} target="_blank" rel="noopener noreferrer">
                <img src={file.previewUrl} alt={file.file_name} loading="lazy" style={{ display: "block", width: 160, maxWidth: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
              </a> : null}
              {file.url ? <a href={file.url}>{file.file_name}</a> : <strong>{file.file_name}</strong>}
              <small>{Math.ceil(file.size_bytes / 1024)} KB · {file.mime_type}</small>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {canEdit && file.isImage ? <form action={setProjectCoverAction}>
                <input type="hidden" name="attachment_id" value={file.id} />
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="slug" value={slug} />
                <button type="submit">Usar como capa</button>
              </form> : null}
              {(canEdit || file.uploaded_by === userId) ? <form action={deleteProjectAttachmentAction}>
                <input type="hidden" name="attachment_id" value={file.id}/>
                <input type="hidden" name="slug" value={slug}/>
                <button className={styles.danger} type="submit">Excluir</button>
              </form> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
