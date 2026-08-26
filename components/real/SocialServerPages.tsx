import { notFound } from "next/navigation";
import ProductShell from "@/components/real/ProductShell";
import { ExploreView, PublicProfileView, SocialFeedView } from "@/components/real/SocialViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:T|T[]|null|undefined):T|null{return !value?null:Array.isArray(value)?value[0]??null:value;}
function root(role:ProductRole){return role==="investor"?"/investor":"/app";}

export async function SocialServerPage({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
  const {supabase,userId,appUser}=await requireProductUser(expectedRole);
  const query=await searchParams;
  const [{data:memberships},{data:posts}]=await Promise.all([
    supabase.from("team_members").select("team_id,access_level,teams(id,name)").eq("user_id",userId),
    supabase.from("posts").select("id,body,visibility,created_at,created_by,author_user_id,author_team_id,author_user:profiles!posts_author_user_id_fkey(id,username,display_name,role),author_team:teams!posts_author_team_id_fkey(id,slug,name)").order("created_at",{ascending:false}).limit(50),
  ]);
  const teamOptions=(memberships??[]).map((item:any)=>one(item.teams)).filter(Boolean) as {id:string;name:string}[];
  const managerTeams=new Set((memberships??[]).filter((item:any)=>item.access_level==="owner"||item.access_level==="admin").map((item:any)=>item.team_id));
  const postIds=(posts??[]).map((post:any)=>post.id);
  let likes:any[]=[]; let comments:any[]=[];
  if(postIds.length){
    const [likesResult,commentsResult]=await Promise.all([
      supabase.from("post_likes").select("post_id,user_id").in("post_id",postIds),
      supabase.from("post_comments").select("id,post_id,user_id,body,created_at,author:profiles!post_comments_user_id_fkey(username,display_name)").in("post_id",postIds).order("created_at",{ascending:true}),
    ]);
    likes=likesResult.data??[];comments=commentsResult.data??[];
  }
  const base=root(expectedRole);
  const view=(posts??[]).map((post:any)=>{
    const user=one<any>(post.author_user); const team=one<any>(post.author_team);
    const postLikes=likes.filter((like:any)=>like.post_id===post.id);
    const postComments=comments.filter((comment:any)=>comment.post_id===post.id).map((comment:any)=>{const author=one<any>(comment.author);return {id:comment.id,body:comment.body,user_id:comment.user_id,authorLabel:author?.display_name??"Usuário"};});
    return {
      id:post.id,body:post.body,visibility:post.visibility,created_at:post.created_at,
      authorLabel:team?.name??user?.display_name??"Conta",
      authorHref:team?`${base}/teams/${team.slug}`:user?`${base}/${user.role==="investor"?"investors":"participants"}/${user.username}`:base,
      canDelete:post.author_user_id===userId||post.created_by===userId||(post.author_team_id&&managerTeams.has(post.author_team_id)),
      liked:postLikes.some((like:any)=>like.user_id===userId),likeCount:postLikes.length,comments:postComments,
    };
  });
  return <ProductShell user={appUser} title="Social"><SocialFeedView role={expectedRole} userId={userId} teams={teamOptions} posts={view} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}

export async function ExploreServerPage({expectedRole}:{expectedRole:ProductRole}){
  const {supabase,userId,appUser}=await requireProductUser(expectedRole);
  const [{data:profiles},{data:teams},{data:projects}]=await Promise.all([
    supabase.from("profiles").select("id,username,display_name,bio,role").eq("profile_visibility","platform").neq("id",userId).order("display_name").limit(40),
    supabase.from("teams").select("id,slug,name,description,category").eq("visibility","platform").order("updated_at",{ascending:false}).limit(40),
    supabase.from("projects").select("id,slug,title,short_description,stage").eq("visibility","platform").order("updated_at",{ascending:false}).limit(40),
  ]);
  return <ProductShell user={appUser} title="Explorar"><ExploreView role={expectedRole} profiles={(profiles??[]) as never[]} teams={(teams??[]) as never[]} projects={(projects??[]) as never[]}/></ProductShell>;
}

export async function PublicProfileServerPage({expectedRole,username}:{expectedRole:ProductRole;username:string}){
  const {supabase,appUser}=await requireProductUser(expectedRole);
  const {data:profile}=await supabase.from("profiles").select("id,username,display_name,bio,role,public_city,public_state,public_school,organization,organization_type,profile_visibility").eq("username",username).maybeSingle();
  if(!profile||profile.profile_visibility!=="platform")notFound();
  const {data:posts}=await supabase.from("posts").select("id,body,created_at").eq("author_user_id",profile.id).eq("visibility","platform").order("created_at",{ascending:false}).limit(30);
  return <ProductShell user={appUser} title={profile.display_name}><PublicProfileView role={expectedRole} profile={profile as never} posts={(posts??[]) as never[]}/></ProductShell>;
}
