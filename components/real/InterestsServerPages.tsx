import Link from "next/link";
import ProductShell from "@/components/real/ProductShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import styles from "./Dashboard.module.css";

async function enrich(supabase:any, rows:any[]) {
  const projectIds=[...new Set(rows.map((row:any)=>row.project_id).filter(Boolean))];
  const investorIds=[...new Set(rows.map((row:any)=>row.investor_id).filter(Boolean))];
  const [{data:projects},{data:profiles}]=await Promise.all([
    projectIds.length?supabase.from("projects").select("id,slug,title,short_description").in("id",projectIds):Promise.resolve({data:[]}),
    investorIds.length?supabase.from("profiles").select("id,username,display_name,organization").in("id",investorIds):Promise.resolve({data:[]}),
  ]);
  const projectMap=new Map((projects??[]).map((item:any)=>[item.id,item]));
  const profileMap=new Map((profiles??[]).map((item:any)=>[item.id,item]));
  return rows.map((row:any)=>({...row,project:projectMap.get(row.project_id),investor:profileMap.get(row.investor_id)}));
}

export async function ParticipantInterestsServerPage(){
  const {supabase,appUser}=await requireProductUser("participant");
  const {data}=await supabase.from("project_interests").select("id,investor_id,project_id,message,status,created_at,updated_at").eq("status","active").order("created_at",{ascending:false});
  const rows=await enrich(supabase,data??[]);
  return <ProductShell user={appUser} title="Interesses recebidos"><div className={styles.page}><section className={styles.hero}><div><h1>Interesses recebidos</h1><p>Investidores que demonstraram interesse em projetos seus ou de equipes das quais você participa.</p></div></section><section className={styles.card}>{rows.length?<div className={styles.stack}>{rows.map((row:any)=><div className={styles.item} key={row.id}><div><strong>{row.project?.title??"Projeto"}</strong><p>{row.investor?.display_name??"Investidor"}{row.investor?.organization?` · ${row.investor.organization}`:""}</p>{row.message?<p>{row.message}</p>:null}</div><div className={styles.actions}>{row.project?.slug?<Link className={styles.secondary} href={`/app/projects/${row.project.slug}`}>Abrir projeto</Link>:null}{row.investor?.username?<Link className={styles.primary} href={`/app/investors/${row.investor.username}`}>Ver investidor</Link>:null}</div></div>)}</div>:<div className={styles.empty}>Nenhum investidor demonstrou interesse nos seus projetos ainda.</div>}</section></div></ProductShell>;
}

export async function InvestorInterestsServerPage(){
  const {supabase,userId,appUser}=await requireProductUser("investor");
  const {data}=await supabase.from("project_interests").select("id,investor_id,project_id,message,status,created_at,updated_at").eq("investor_id",userId).order("updated_at",{ascending:false});
  const rows=await enrich(supabase,data??[]);
  return <ProductShell user={appUser} title="Meus interesses"><div className={styles.page}><section className={styles.hero}><div><h1>Meus interesses</h1><p>Acompanhe os projetos em que você já demonstrou interesse. Um interesse retirado fica visível apenas como histórico para você.</p></div><Link className={styles.primary} href="/investor/explore">Encontrar projetos</Link></section><section className={styles.card}>{rows.length?<div className={styles.stack}>{rows.map((row:any)=><Link className={styles.item} key={row.id} href={row.project?.slug?`/investor/projects/${row.project.slug}`:"/investor/interests"}><div><strong>{row.project?.title??"Projeto"}</strong><p>{row.message||"Interesse demonstrado sem mensagem."}</p></div><span className={styles.pill}>{row.status==="active"?"Ativo":"Retirado"}</span></Link>)}</div>:<div className={styles.empty}>Você ainda não demonstrou interesse em nenhum projeto.</div>}</section></div></ProductShell>;
}
