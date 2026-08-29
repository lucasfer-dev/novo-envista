import ProjectAttachmentUploader from "@/components/storage/ProjectAttachmentUploader";
import { deleteProjectAttachmentAction } from "@/lib/storage/actions";
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
    const { data } = await supabase.storage.from("project-assets").createSignedUrl(item.path, 900, { download: item.file_name });
    return { ...item, url: data?.signedUrl ?? null };
  }));

  const totalBytes = files.reduce((sum, file) => sum + Number(file.size_bytes || 0), 0);

  return (
    <div className={styles.box}>
      <span className={styles.label}>Arquivos do projeto</span>
      <p className={styles.hint}>Bucket privado. Downloads expiram em 15 minutos e são enviados como anexo. {files.length}/50 arquivos · {Math.ceil(totalBytes / 1024 / 1024)} MB/100 MB usados.</p>
      {canEdit ? <ProjectAttachmentUploader projectId={projectId} userId={userId} /> : null}
      <div className={styles.files}>
        {files.length === 0 ? <span className={styles.hint}>Nenhum arquivo enviado.</span> : files.map((file) => (
          <div className={styles.file} key={file.id}>
            <div>{file.url ? <a href={file.url}>{file.file_name}</a> : <strong>{file.file_name}</strong>}<small>{Math.ceil(file.size_bytes / 1024)} KB · {file.mime_type}</small></div>
            {(canEdit || file.uploaded_by === userId) ? <form action={deleteProjectAttachmentAction}><input type="hidden" name="attachment_id" value={file.id}/><input type="hidden" name="slug" value={slug}/><button className={styles.danger}>Excluir</button></form> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
