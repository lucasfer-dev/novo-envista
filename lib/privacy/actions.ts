"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData:FormData,name:string,max:number){const value=formData.get(name);return typeof value==="string"?value.trim().slice(0,max):"";}

export async function createPrivacyRequestAction(formData:FormData){
 const {supabase,userId}=await requireProductUser();const type=text(formData,"request_type",20);const allowed=["access","correction","deletion","export","other"];
 if(!allowed.includes(type))redirect("/account/privacy?error=type");
 if(type==="deletion"){
  const {data:existing}=await supabase.from("privacy_requests").select("id").eq("user_id",userId).eq("request_type","deletion").in("status",["open","in_review"]).limit(1);
  if(existing?.length)redirect("/account/privacy?status=already-requested");
 }
 const {error}=await supabase.from("privacy_requests").insert({user_id:userId,request_type:type,details:text(formData,"details",2000),status:"open",admin_note:""});
 if(error)redirect("/account/privacy?error=request");revalidatePath("/account/privacy");redirect("/account/privacy?status=requested");
}
