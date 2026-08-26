import { notFound } from "next/navigation";
import ProductShell from "@/components/real/ProductShell";
import SaveProjectButton from "@/components/real/SaveProjectButton";
import { NewProjectView, ProjectDetailView, ProjectsIndex } from "@/components/real/ProjectsViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:T|T[]|null|undefined):T|null{return !value?null:Array.isArray(value)?value[0]??null:value;}
const projectFields = "id,slug,title,short_description,problem,solution,stage,category,location,tags,readme,visibility,owner_user_id,owner_team_id,created_by,owner_team:teams!projects_owner_team_id_fkey(name,slug),owner_user:profiles!projects_owner_user_id_fkey(display_name,username)";

function decorate(project:any){const team=one(project.owner_team);const user=one(project.owner_user);return {...project,ownerLabel:team?`Equipe ${team.name}`:user?user.display_name:"Autoria pessoal"};}

export async function ProjectsServerIndex({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser(expectedRole); const query=await searchParams;
 const {data:memberships}=await supabase.from("team_members").select("team_id").eq("user_id",userId); const teamIds=(memberships??[]).map(x=>x.team_id);
 const personalPromise=supabase.from("projects").select(projectFields).eq("owner_user_id",userId).order("updated_at",{ascending:false});
 const teamPromise=teamIds.length?supabase.from("projects").select(projectFields).in("owner_team_id",teamIds).order("updated_at",{ascending:false}):Promise.resolve({data:[] as any[]});
 const [{data:personal},{data:teamProjects}]=await Promise.all([personalPromise,teamPromise]);
 const map=new Map<string,any>(); for(const item of [...(personal??[]),...(teamProjects??[])]) map.set(item.id,decorate(item));
 return <ProductShell user={appUser} title="Projetos"><ProjectsIndex role={expectedRole} projects={[...map.values()]} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}

export async function NewProjectServerPage({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser(expectedRole); const query=await searchParams;
 const {data:memberships}=await supabase.from("team_members").select("team_id,teams(id,name)").eq("user_id",userId).order("joined_at",{ascending:false});
 const teams=(memberships??[]).map((m:any)=>one(m.teams)).filter(Boolean) as {id:string;name:string}[];
 return <ProductShell user={appUser} title="Criar projeto"><NewProjectView role={expectedRole} teams={teams} error={first(query.error)}/></ProductShell>;
}

export async function ProjectServerDetail({expectedRole,slug,searchParams}:{expectedRole:ProductRole;slug:string;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser(expectedRole); const query=await searchParams;
 const {data:raw}=await supabase.from("projects").select(projectFields).eq("slug",slug).maybeSingle(); if(!raw) notFound();
 const project=decorate(raw); let canEdit=project.owner_user_id===userId; let canDelete=canEdit;
 if(project.owner_team_id){const {data:membership}=await supabase.from("team_members").select("access_level").eq("team_id",project.owner_team_id).eq("user_id",userId).maybeSingle();canEdit=Boolean(membership);canDelete=membership?.access_level==="owner"||membership?.access_level==="admin";}
 const returnTo=`${expectedRole==="investor"?"/investor":"/app"}/projects/${project.slug}`;
 return <ProductShell user={appUser} title={project.title}>{expectedRole==="investor"&&project.visibility==="platform"?<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><SaveProjectButton projectId={project.id} returnTo={returnTo}/></div>:null}<ProjectDetailView role={expectedRole} project={project} canEdit={canEdit} canDelete={canDelete} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}
