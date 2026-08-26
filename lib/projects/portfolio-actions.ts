"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";

function text(formData:FormData,name:string,max:number){const value=formData.get(name);return typeof value==="string"?value.trim().slice(0,max):"";}
function safeUrl(raw:string){if(!raw)return "";try{const url=new URL(raw);return url.protocol==="http:"||url.protocol==="https:"?url.toString().slice(0,500):"";}catch{return "";}}
function list(raw:string){return [...new Set(raw.split(",").map(item=>item.trim()).filter(Boolean))].slice(0,20);}

export async function updateProjectPortfolioAction(formData:FormData){
 const {supabase,userId,role}=await requireProductUser();
 const projectId=text(formData,"project_id",80);const slug=text(formData,"slug",160);if(!projectId||!slug)redirect(role==="investor"?"/investor/projects":"/app/projects");
 const {data:project}=await supabase.from("projects").select("owner_user_id,owner_team_id").eq("id",projectId).maybeSingle();if(!project)redirect(`/${role==="investor"?"investor":"app"}/projects/${slug}?error=portfolio`);
 let canEdit=project.owner_user_id===userId;
 if(!canEdit&&project.owner_team_id){const {data:membership}=await supabase.from("team_members").select("user_id").eq("team_id",project.owner_team_id).eq("user_id",userId).maybeSingle();canEdit=Boolean(membership);}
 if(!canEdit)redirect(`/${role==="investor"?"investor":"app"}/projects/${slug}?error=portfolio`);
 const payload={impact:text(formData,"impact",6000),needs:list(text(formData,"needs",1200)),website_url:safeUrl(text(formData,"website_url",500)),repository_url:safeUrl(text(formData,"repository_url",500))};
 const {error}=await supabase.from("projects").update(payload).eq("id",projectId);const base=`/${role==="investor"?"investor":"app"}/projects/${slug}`;if(error)redirect(`${base}?error=portfolio`);revalidatePath(base);redirect(`${base}?status=portfolio-saved`);
}
