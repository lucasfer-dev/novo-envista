"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./Uploaders.module.css";
const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf","text/plain"]);
function safeName(name:string){return name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(-150)||"arquivo";}
export default function ProjectAttachmentUploader({projectId,userId}:{projectId:string;userId:string}){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function upload(){if(!file)return;setBusy(true);setMessage("");setError("");let uploadedPath="";try{if(!allowed.has(file.type))throw new Error("Formato não permitido. Use JPG, PNG, WebP, PDF ou TXT.");if(file.size<=0||file.size>10*1024*1024)throw new Error("O arquivo deve ter no máximo 10 MB.");const supabase=createClient();uploadedPath=`${projectId}/${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error:e1}=await supabase.storage.from("project-assets").upload(uploadedPath,file,{contentType:file.type,upsert:false});if(e1)throw e1;const {error:e2}=await supabase.from("project_attachments").insert({project_id:projectId,uploaded_by:userId,path:uploadedPath,file_name:file.name.slice(0,180),mime_type:file.type,size_bytes:file.size});if(e2){await supabase.storage.from("project-assets").remove([uploadedPath]);throw e2;}setMessage("Arquivo enviado.");setFile(null);window.location.reload();}catch(e){setError(e instanceof Error?e.message:"Falha no upload.");}finally{setBusy(false);}}
 return <div className={styles.box}><span className={styles.label}>Adicionar arquivo</span><p className={styles.hint}>JPG, PNG, WebP, PDF ou TXT. Máximo 10 MB. Downloads usam URL assinada temporária.</p><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={e=>setFile(e.target.files?.[0]??null)}/><button className={styles.button} type="button" disabled={!file||busy} onClick={upload}>{busy?"Enviando…":"Enviar arquivo"}</button>{message&&<span className={styles.ok}>{message}</span>}{error&&<span className={styles.error}>{error}</span>}</div>;
}
