import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(){
 const supabase=await createClient();const {data:claims,error}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(error||!userId)return NextResponse.json({error:"unauthorized"},{status:401});
 const [profile,compliance,legal,memberships,projects,posts,comments,follows,conversations,messages,enrollments,progress,notifications,privacy]=await Promise.all([
  supabase.from("profiles").select("*").eq("id",userId).maybeSingle(),
  supabase.from("account_compliance").select("age_band,guardian_consent_verified_at,created_at,updated_at").eq("user_id",userId).maybeSingle(),
  supabase.from("legal_acceptances").select("document_type,document_version,context,accepted_at").eq("user_id",userId).order("accepted_at"),
  supabase.from("team_members").select("team_id,role_label,access_level,joined_at,teams(id,slug,name)").eq("user_id",userId),
  supabase.from("projects").select("id,slug,title,short_description,stage,visibility,owner_user_id,owner_team_id,created_by,created_at,updated_at").or(`owner_user_id.eq.${userId},created_by.eq.${userId}`),
  supabase.from("posts").select("id,author_user_id,author_team_id,project_id,body,visibility,created_at,updated_at").eq("created_by",userId),
  supabase.from("post_comments").select("id,post_id,body,created_at,updated_at").eq("user_id",userId),
  supabase.from("follows").select("target_profile_id,target_team_id,target_project_id,created_at").eq("follower_id",userId),
  supabase.from("direct_conversations").select("id,user_a,user_b,created_at").or(`user_a.eq.${userId},user_b.eq.${userId}`),
  supabase.from("direct_messages").select("id,conversation_id,body,created_at").eq("sender_id",userId).order("created_at"),
  supabase.from("course_enrollments").select("course_id,enrolled_at,courses(slug,title)").eq("user_id",userId),
  supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id",userId),
  supabase.from("notifications").select("kind,title,body,href,read_at,created_at").eq("user_id",userId).order("created_at"),
  supabase.from("privacy_requests").select("request_type,details,status,admin_note,requested_at,resolved_at").eq("user_id",userId).order("requested_at"),
 ]);
 const payload={exported_at:new Date().toISOString(),account_id:userId,profile:profile.data,compliance:compliance.data,legal_acceptances:legal.data??[],team_memberships:memberships.data??[],projects_created_or_owned:projects.data??[],posts_created:posts.data??[],comments_created:comments.data??[],follows:follows.data??[],conversation_metadata:conversations.data??[],messages_sent:messages.data??[],course_enrollments:enrollments.data??[],lesson_progress:progress.data??[],notifications:notifications.data??[],privacy_requests:privacy.data??[]};
 const body=JSON.stringify(payload,null,2);
 return new NextResponse(body,{status:200,headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":"attachment; filename=envista-meus-dados.json","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
}
