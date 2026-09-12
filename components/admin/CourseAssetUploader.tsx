"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AdminViews.module.css";

const MAX_BYTES = 100 * 1024 * 1024;
const allowed = new Set([
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function safeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-160) || "arquivo";
}

export default function CourseAssetUploader({ lessonId, userId }: { lessonId: string; userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    let path = "";

    try {
      if (!allowed.has(file.type)) throw new Error("Formato não permitido.");
      if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("O arquivo deve ter no máximo 100 MB.");

      path = `${lessonId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const kind = file.type.startsWith("video/") ? "video" : "file";

      const { error: metadataError } = await supabase.from("course_lesson_assets").insert({
        lesson_id: lessonId,
        uploaded_by: userId,
        path,
        file_name: file.name.slice(0, 180),
        mime_type: file.type,
        size_bytes: file.size,
        kind,
      });
      if (metadataError) throw new Error("Não foi possível registrar o material.");

      const { error: storageError } = await supabase.storage
        .from("course-assets")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (storageError) {
        await supabase.from("course_lesson_assets").delete().eq("path", path);
        throw new Error("Não foi possível enviar o arquivo.");
      }

      setFile(null);
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.uploadBox}>
      <div>
        <strong>Vídeos e materiais da aula</strong>
        <p className={styles.muted}>MP4/WebM, PDF, DOC/DOCX, PPT/PPTX, ZIP, TXT e imagens. Até 100 MB por arquivo.</p>
      </div>
      <input
        className={styles.fileInput}
        type="file"
        accept="video/mp4,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.zip,text/plain,image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button type="button" className={styles.secondary} disabled={!file || busy} onClick={upload}>
        {busy ? "Enviando…" : "Anexar material"}
      </button>
      {error ? <span className={styles.inlineError}>{error}</span> : null}
    </div>
  );
}
