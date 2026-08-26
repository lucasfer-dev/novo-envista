"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./Uploaders.module.css";

const allowed: Record<string,string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp" };

export default function AvatarUploader({ userId, currentPath }: { userId: string; currentPath?: string | null }) {
  const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function upload(){
    if(!file)return; setBusy(true);setMessage("");setError("");
    try{
      const ext=allowed[file.type]; if(!ext)throw new Error("Use JPG, PNG ou WebP."); if(file.size>2*1024*1024)throw new Error("O avatar deve ter no máximo 2 MB.");
      const supabase=createClient(); const path=`${userId}/avatar-${Date.now()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"}); if(uploadError)throw uploadError;
      const {error:updateError}=await supabase.from("profiles").update({avatar_path:path}).eq("id",userId); if(updateError){await supabase.storage.from("avatars").remove([path]);throw updateError;}
      if(currentPath&&currentPath!==path&&currentPath.startsWith(`${userId}/`)) await supabase.storage.from("avatars").remove([currentPath]);
      setMessage("Avatar atualizado.");setFile(null);window.dispatchEvent(new Event("envista-profile-updated"));
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível enviar o avatar.");}finally{setBusy(false);}
  }
  return <div className={styles.box}><span className={styles.label}>Foto de perfil</span><p className={styles.hint}>JPG, PNG ou WebP. Máximo 2 MB. O arquivo fica em bucket privado.</p><input className={styles.input} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]??null)}/><button className={styles.button} type="button" disabled={!file||busy} onClick={upload}>{busy?"Enviando…":"Enviar avatar"}</button>{message&&<span className={styles.ok}>{message}</span>}{error&&<span className={styles.error}>{error}</span>}</div>;
}
