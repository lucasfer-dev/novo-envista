import AdminShell from "@/components/admin/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { updateFeedbackTicketAdminAction } from "@/lib/admin/feedback-actions";

const PAGE_SIZE = 30;
function pageNumber(value:string|string[]|undefined){const raw=typeof value==="string"?Number.parseInt(value,10):1;return Number.isFinite(raw)&&raw>0?raw:1;}
const labels:Record<string,string>={feedback:"Feedback",bug:"Problema",idea:"Ideia",support:"Suporte"};

export default async function AdminFeedbackPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams;
  const {supabase,profile}=await requireAdminUser();
  const page=pageNumber(query.page);const from=(page-1)*PAGE_SIZE;
  const {data:tickets,count,error}=await supabase.from("feedback_tickets").select("id,user_id,category,message,page_path,status,created_at,updated_at",{count:"exact"}).order("created_at",{ascending:false}).range(from,from+PAGE_SIZE-1);
  const ids=Array.from(new Set((tickets??[]).map((item:any)=>item.user_id)));
  let profiles:any[]=[];if(ids.length){const result=await supabase.from("profiles").select("id,username,display_name").in("id",ids);profiles=result.data??[];}
  const users=new Map(profiles.map((item:any)=>[item.id,item]));
  return <AdminShell profile={profile} title="Feedback e suporte">
    <div className={styles.head}><div><h1>Feedback e suporte</h1><p className={styles.muted}>Problemas, ideias e pedidos enviados de dentro do produto.</p></div></div>
    {query.status?<div className={styles.notice}>Solicitação atualizada.</div>:null}{query.error||error?<div className={styles.error}>Não foi possível carregar ou atualizar a solicitação.</div>:null}
    <div className={styles.stack}>{(tickets??[]).length===0?<div className={styles.empty}>Nenhuma solicitação ainda.</div>:(tickets??[]).map((ticket:any)=>{const user=users.get(ticket.user_id);return <article className={styles.request} key={ticket.id}><div className={styles.actions}><span className={styles.pill}>{labels[ticket.category]||ticket.category}</span><span className={styles.pill}>{ticket.status}</span></div><h3>{user?.display_name??"Conta"}</h3><p className={styles.muted}>{user?.username?`@${user.username}`:""} · {new Date(ticket.created_at).toLocaleString("pt-BR")} · {ticket.page_path}</p><p>{ticket.message}</p><form className={styles.form} action={updateFeedbackTicketAdminAction}><input type="hidden" name="ticket_id" value={ticket.id}/><label>Status<select name="status" defaultValue={ticket.status}><option value="open">Aberto</option><option value="reviewing">Em análise</option><option value="resolved">Resolvido</option><option value="closed">Fechado</option></select></label><button className={styles.primary}>Salvar</button></form></article>})}</div>
    {!error?<AdminPagination pathname="/admin/feedback" page={page} pageSize={PAGE_SIZE} total={count??0}/>:null}
  </AdminShell>;
}
