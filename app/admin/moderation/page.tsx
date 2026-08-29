import AdminShell from "@/components/admin/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import styles from "@/components/admin/AdminViews.module.css";
import { updateMessageReportAdminAction } from "@/lib/admin/actions";
import { updateContentReportAdminAction } from "@/lib/admin/moderation-actions";
import { requireAdminUser } from "@/lib/admin/require-admin";

const PAGE_SIZE = 25;

function pageNumber(value:string|string[]|undefined){const raw=typeof value==="string"?Number.parseInt(value,10):1;return Number.isFinite(raw)&&raw>0?raw:1;}
function targetLabel(type:string,row:any){if(!row)return "Conteúdo indisponível.";if(type==="profile")return `${row.display_name||row.username||"Perfil"}${row.username?` (@${row.username})`:""}`;if(type==="post")return row.body||"Publicação";if(type==="project")return row.title||"Projeto";if(type==="team")return row.name||"Equipe";return "Conteúdo";}

export default async function AdminModeration({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;const {supabase,profile}=await requireAdminUser();
 const contentPage=pageNumber(query.content_page);const messagePage=pageNumber(query.message_page);
 const contentFrom=(contentPage-1)*PAGE_SIZE;const messageFrom=(messagePage-1)*PAGE_SIZE;
 const [{data:reports,count:messageCount,error:messageError},{data:contentReports,count:contentCount,error:contentError}]=await Promise.all([
  supabase.from("message_reports").select("id,reporter_id,message_id,reason,details,status,admin_note,created_at,resolved_at",{count:"exact"}).order("created_at",{ascending:false}).range(messageFrom,messageFrom+PAGE_SIZE-1),
  supabase.from("content_reports").select("id,reporter_id,target_type,target_id,reason,details,status,admin_note,created_at,resolved_at",{count:"exact"}).order("created_at",{ascending:false}).range(contentFrom,contentFrom+PAGE_SIZE-1),
 ]);

 const messageIds=(reports??[]).map((r:any)=>r.message_id);let messages:any[]=[];
 if(messageIds.length){const result=await supabase.from("direct_messages").select("id,sender_id,body,created_at").in("id",messageIds);messages=result.data??[];}

 const profileTargetIds=(contentReports??[]).filter((r:any)=>r.target_type==="profile").map((r:any)=>r.target_id);
 const postTargetIds=(contentReports??[]).filter((r:any)=>r.target_type==="post").map((r:any)=>r.target_id);
 const projectTargetIds=(contentReports??[]).filter((r:any)=>r.target_type==="project").map((r:any)=>r.target_id);
 const teamTargetIds=(contentReports??[]).filter((r:any)=>r.target_type==="team").map((r:any)=>r.target_id);
 const empty=Promise.resolve({data:[] as any[]});
 const [targetProfilesResult,targetPostsResult,targetProjectsResult,targetTeamsResult]=await Promise.all([
  profileTargetIds.length?supabase.from("profiles").select("id,username,display_name").in("id",profileTargetIds):empty,
  postTargetIds.length?supabase.from("posts").select("id,body,author_user_id,created_at").in("id",postTargetIds):empty,
  projectTargetIds.length?supabase.from("projects").select("id,title,slug,stage,owner_user_id").in("id",projectTargetIds):empty,
  teamTargetIds.length?supabase.from("teams").select("id,name,slug,owner_id").in("id",teamTargetIds):empty,
 ]);

 const profileIds=Array.from(new Set([...(reports??[]).map((r:any)=>r.reporter_id),...(contentReports??[]).map((r:any)=>r.reporter_id),...messages.map((m:any)=>m.sender_id)]));let profiles:any[]=[];
 if(profileIds.length){const result=await supabase.from("profiles").select("id,username,display_name").in("id",profileIds);profiles=result.data??[];}
 const messageMap=new Map(messages.map((m:any)=>[m.id,m]));const profileMap=new Map(profiles.map((p:any)=>[p.id,p]));
 const targetMaps={profile:new Map((targetProfilesResult.data??[]).map((row:any)=>[row.id,row])),post:new Map((targetPostsResult.data??[]).map((row:any)=>[row.id,row])),project:new Map((targetProjectsResult.data??[]).map((row:any)=>[row.id,row])),team:new Map((targetTeamsResult.data??[]).map((row:any)=>[row.id,row]))} as Record<string,Map<string,any>>;

 return <AdminShell profile={profile} title="Moderação">
  <div className={styles.head}><div><h1>Central de moderação</h1><p className={styles.muted}>Denúncias de conteúdo público e mensagens privadas efetivamente denunciadas. Conversas não denunciadas continuam inacessíveis ao admin.</p></div></div>
  {query.status?<div className={styles.notice}>Denúncia atualizada e ação registrada no log de auditoria.</div>:null}
  {query.error?<div className={styles.error}>Não foi possível atualizar a denúncia.</div>:null}
  {contentError||messageError?<div className={styles.error}>Uma das filas de moderação não pôde ser carregada.</div>:null}

  <div className={styles.head}><div><h2>Conteúdo público</h2><p className={styles.muted}>Perfis, publicações, projetos e equipes reportados pelos usuários.</p></div></div>
  <div className={styles.stack}>{!contentError&&(contentReports??[]).length===0?<div className={styles.empty}>Nenhuma denúncia de conteúdo registrada.</div>:(contentReports??[]).map((report:any)=>{const reporter=profileMap.get(report.reporter_id);const target=targetMaps[report.target_type]?.get(report.target_id);return <article className={styles.request} key={report.id}><div className={styles.actions}><span className={styles.pill}>{report.status}</span><span className={styles.pill}>{report.reason}</span><span className={styles.pill}>{report.target_type}</span></div><h3>{targetLabel(report.target_type,target)}</h3><p className={styles.muted}>Denunciante: {reporter?.display_name??"Conta"} {reporter?.username?`(@${reporter.username})`:""} · {new Date(report.created_at).toLocaleString("pt-BR")}</p>{report.details?<p><strong>Detalhes:</strong> {report.details}</p>:null}<form className={styles.form} action={updateContentReportAdminAction}><input type="hidden" name="report_id" value={report.id}/><label>Status<select name="status" defaultValue={report.status}><option value="open">Aberta</option><option value="reviewing">Em análise</option><option value="resolved">Resolvida</option><option value="dismissed">Descartada</option></select></label><label>Nota administrativa<textarea name="admin_note" defaultValue={report.admin_note} maxLength={2000}/></label><button className={styles.primary}>Salvar análise</button></form></article>;})}</div>
  {!contentError?<AdminPagination pathname="/admin/moderation" page={contentPage} pageSize={PAGE_SIZE} total={contentCount??0} pageParam="content_page" query={{message_page:messagePage>1?messagePage:undefined}}/>:null}

  <div className={styles.head}><div><h2>Mensagens denunciadas</h2><p className={styles.muted}>Acesso restrito somente às mensagens apontadas por uma denúncia.</p></div></div>
  <div className={styles.stack}>{!messageError&&(reports??[]).length===0?<div className={styles.empty}>Nenhuma denúncia de mensagem registrada.</div>:(reports??[]).map((report:any)=>{const message=messageMap.get(report.message_id);const reporter=profileMap.get(report.reporter_id);const sender=message?profileMap.get(message.sender_id):null;return <article className={styles.request} key={report.id}><div className={styles.actions}><span className={styles.pill}>{report.status}</span><span className={styles.pill}>{report.reason}</span></div><h3>Mensagem denunciada</h3><p>{message?.body??"Mensagem indisponível."}</p><p className={styles.muted}>Autor: {sender?.display_name??"Conta"} {sender?.username?`(@${sender.username})`:""} · Denunciante: {reporter?.display_name??"Conta"}</p>{report.details?<p><strong>Detalhes:</strong> {report.details}</p>:null}<form className={styles.form} action={updateMessageReportAdminAction}><input type="hidden" name="report_id" value={report.id}/><label>Status<select name="status" defaultValue={report.status}><option value="open">Aberta</option><option value="reviewing">Em análise</option><option value="resolved">Resolvida</option><option value="dismissed">Descartada</option></select></label><label>Nota administrativa<textarea name="admin_note" defaultValue={report.admin_note} maxLength={2000}/></label><button className={styles.primary}>Salvar análise</button></form></article>;})}</div>
  {!messageError?<AdminPagination pathname="/admin/moderation" page={messagePage} pageSize={PAGE_SIZE} total={messageCount??0} pageParam="message_page" query={{content_page:contentPage>1?contentPage:undefined}}/>:null}
 </AdminShell>;
}
