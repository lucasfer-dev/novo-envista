"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./Uploaders.module.css";
const allowed:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
export default function TeamLogoUploader({teamId,userId,currentPath}:{teamId:string;userId:string;currentPath?:string|null}){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function upload(){if(!file)return;setBusy(true);setMessage("");setError("");try{const ext=allowed[file.type];if(!ext)throw new Error("Use JPG, PNG ou WebP.");if(file.size>4*1024*1024)throw new Error("A imagem deve ter no máximo 4 MB.");const supabase=createClient();const path=`${teamId}/${userId}/logo-${Date.now()}.${ext}`;const {error:e1}=await supabase.storage.from("team-assets").upload(path,file,{contentType:file.type,upsert:false});if(e1)throw e1;const {error:e2}=await supabase.from("teams").update({logo_path:path}).eq("id",teamId);if(e2){await supabase.storage.from("team-assets").remove([path]);throw e2;}if(currentPath&&currentPath!==path&&currentPath.startsWith(`${teamId}/`))await supabase.storage.from("team-assets").remove([currentPath]);setMessage("Logo atualizado.");setFile(null);window.location.reload();}catch(e){setError(e instanceof Error?e.message:"Falha no upload.");}finally{setBusy(false);}}
 return <div className={styles.box}><span className={styles.label}>Logo da equipe</span><p className={styles.hint}>JPG, PNG ou WebP. Máximo 4 MB.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]??null)}/><button className={styles.button} type="button" disabled={!file||busy} onClick={upload}>{busy?"Enviando…":"Enviar logo"}</button>{message&&<span className={styles.ok}>{message}</span>}{error&&<span className={styles.error}>{error}</span>}</div>;
}
