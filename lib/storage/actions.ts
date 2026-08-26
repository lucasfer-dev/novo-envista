"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData:FormData,name:string,max=180){const value=formData.get(name);return typeof value==="string"?value.trim().slice(0,max):"";}
export async function deleteProjectAttachmentAction(formData:FormData){
 const {supabase,role}=await requireProductUser(); const id=text(formData,"attachment_id",80); const slug=text(formData,"slug",90); const base=role==="investor"?"/investor/projects":"/app/projects"; if(!id||!slug)redirect(base);
 const {data:attachment}=await supabase.from("project_attachments").select("id,path").eq("id",id).maybeSingle();
 if(!attachment)redirect(`${base}/${slug}?error=file`);
 const {error:storageError}=await supabase.storage.from("project-assets").remove([attachment.path]); if(storageError)redirect(`${base}/${slug}?error=file`);
 const {error:metadataError}=await supabase.from("project_attachments").delete().eq("id",id); if(metadataError)redirect(`${base}/${slug}?error=file`);
 revalidatePath(`${base}/${slug}`);redirect(`${base}/${slug}?status=file-deleted`);
}
