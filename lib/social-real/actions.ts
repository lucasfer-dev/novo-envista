"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { safeInternalPath } from "@/lib/auth/validation";

function text(formData:FormData,name:string,max:number){const value=formData.get(name);return typeof value==="string"?value.trim().slice(0,max):"";}
function back(formData:FormData,fallback:string){return safeInternalPath(formData.get("return_to"),fallback);}

export async function createPostAction(formData:FormData){
 const {supabase,userId,role}=await requireProductUser(); const fallback=role==="investor"?"/investor/social":"/app/social"; const returnTo=back(formData,fallback); const body=text(formData,"body",5000); if(!body)redirect(`${returnTo}?error=post`);
 const author=text(formData,"author",80); const personal=!author||author==="personal"; let authorTeamId:string|null=null;
 if(!personal){const {data:membership}=await supabase.from("team_members").select("team_id").eq("team_id",author).eq("user_id",userId).maybeSingle();if(!membership)redirect(`${returnTo}?error=author`);authorTeamId=author;}
 const {error}=await supabase.from("posts").insert({author_user_id:personal?userId:null,author_team_id:authorTeamId,created_by:userId,body,visibility:formData.get("visibility")==="private"?"private":"platform"}); if(error)redirect(`${returnTo}?error=post`); revalidatePath(returnTo);redirect(`${returnTo}?status=posted`);
}

export async function deletePostAction(formData:FormData){const {supabase,role}=await requireProductUser();const fallback=role==="investor"?"/investor/social":"/app/social";const returnTo=back(formData,fallback);const postId=text(formData,"post_id",80);if(postId)await supabase.from("posts").delete().eq("id",postId);revalidatePath(returnTo);redirect(returnTo);}

export async function togglePostLikeAction(formData:FormData){const {supabase,userId,role}=await requireProductUser();const fallback=role==="investor"?"/investor/social":"/app/social";const returnTo=back(formData,fallback);const postId=text(formData,"post_id",80);if(!postId)redirect(returnTo);const {data:existing}=await supabase.from("post_likes").select("post_id").eq("post_id",postId).eq("user_id",userId).maybeSingle();if(existing)await supabase.from("post_likes").delete().eq("post_id",postId).eq("user_id",userId);else await supabase.from("post_likes").insert({post_id:postId,user_id:userId});revalidatePath(returnTo);redirect(returnTo);}

export async function addPostCommentAction(formData:FormData){const {supabase,userId,role}=await requireProductUser();const fallback=role==="investor"?"/investor/social":"/app/social";const returnTo=back(formData,fallback);const postId=text(formData,"post_id",80),body=text(formData,"body",2000);if(postId&&body)await supabase.from("post_comments").insert({post_id:postId,user_id:userId,body});revalidatePath(returnTo);redirect(returnTo);}

export async function deletePostCommentAction(formData:FormData){const {supabase,role}=await requireProductUser();const fallback=role==="investor"?"/investor/social":"/app/social";const returnTo=back(formData,fallback);const id=text(formData,"comment_id",80);if(id)await supabase.from("post_comments").delete().eq("id",id);revalidatePath(returnTo);redirect(returnTo);}

export async function toggleFollowAction(formData:FormData){
 const {supabase,userId,role}=await requireProductUser(); const fallback=role==="investor"?"/investor":"/app"; const returnTo=back(formData,fallback); const type=text(formData,"target_type",20); const id=text(formData,"target_id",80); if(!id||!["profile","team","project"].includes(type))redirect(returnTo);
 const column=type==="profile"?"target_profile_id":type==="team"?"target_team_id":"target_project_id";
 const {data:existing}=await supabase.from("follows").select("follower_id").eq("follower_id",userId).eq(column,id).maybeSingle();
 if(existing)await supabase.from("follows").delete().eq("follower_id",userId).eq(column,id);else await supabase.from("follows").insert({follower_id:userId,[column]:id});
 revalidatePath(returnTo);redirect(returnTo);
}
