import Link from "next/link";
import ProductShell from "@/components/real/ProductShell";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import styles from "./Dashboard.module.css";

type Search=Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function root(role:ProductRole){return role==="investor"?"/investor":"/app";}

export async function GlobalSearchServerPage({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
 const {supabase,userId,appUser}=await requireProductUser(expectedRole);const params=await searchParams;const q=(first(params.q)||"").trim().slice(0,80);const term=q.length>=2?`%${q}%`:null;
 let profiles:any[]=[];let teams:any[]=[];let projects:any[]=[];
 if(term){
  const [profileResult,teamResult,projectResult]=await Promise.all([
   supabase.from("profiles").select("id,username,display_name,bio,role,organization").eq("profile_visibility","platform").neq("id",userId).ilike("display_name",term).limit(20),
   supabase.from("teams").select("id,slug,name,description,category,institution").eq("visibility","platform").ilike("name",term).limit(20),
   supabase.from("projects").select("id,slug,title,short_description,stage,category").eq("visibility","platform").ilike("title",term).limit(20),
  ]);profiles=profileResult.data??[];teams=teamResult.data??[];projects=projectResult.data??[];
 }
 const prefix=root(expectedRole);const total=profiles.length+teams.length+projects.length;
 return <ProductShell user={appUser} title="Busca"><div className={styles.page}><section className={styles.hero}><div><h1>Buscar no Envista</h1><p>Encontre projetos, equipes, participantes e investidores visíveis na plataforma.</p></div></section><section className={styles.card}><form action={`${prefix}/search`} method="get" style={{display:"flex",gap:10}}><input aria-label="Buscar" name="q" defaultValue={q} maxLength={80} placeholder="Busque por nome de projeto, equipe ou pessoa" style={{flex:1,minHeight:40,border:"1px solid rgba(255,255,255,.09)",borderRadius:8,padding:"0 12px",background:"#162331",color:"#e9f0f5",outline:"none"}}/><button className={styles.primary} type="submit">Buscar</button></form></section>{q.length>0&&q.length<2?<div className={styles.empty}>Digite pelo menos 2 caracteres.</div>:null}{term?<><p className={styles.muted}>{total} resultado(s) para “{q}”.</p><div className={styles.grid}><section className={styles.card}><div className={styles.sectionHead}><h2>Projetos</h2><span className={styles.muted}>{projects.length}</span></div>{projects.length?<div className={styles.stack}>{projects.map((item:any)=><Link className={styles.item} key={item.id} href={`${prefix}/projects/${item.slug}`}><div><strong>{item.title}</strong><p>{item.short_description||item.category||"Projeto no Envista"}</p></div><span className={styles.pill}>{item.stage||"Projeto"}</span></Link>)}</div>:<div className={styles.empty}>Nenhum projeto encontrado.</div>}</section><section className={styles.card}><div className={styles.sectionHead}><h2>Equipes</h2><span className={styles.muted}>{teams.length}</span></div>{teams.length?<div className={styles.stack}>{teams.map((item:any)=><Link className={styles.item} key={item.id} href={`${prefix}/teams/${item.slug}`}><div><strong>{item.name}</strong><p>{item.description||item.institution||item.category||"Equipe no Envista"}</p></div></Link>)}</div>:<div className={styles.empty}>Nenhuma equipe encontrada.</div>}</section></div><section className={styles.card}><div className={styles.sectionHead}><h2>Pessoas</h2><span className={styles.muted}>{profiles.length}</span></div>{profiles.length?<div className={styles.stack}>{profiles.map((item:any)=><Link className={styles.item} key={item.id} href={`${prefix}/${item.role==="investor"?"investors":"participants"}/${item.username}`}><div><strong>{item.display_name}</strong><p>@{item.username}{item.organization?` · ${item.organization}`:""}</p></div><span className={styles.pill}>{item.role==="investor"?"Investidor":"Participante"}</span></Link>)}</div>:<div className={styles.empty}>Nenhuma pessoa encontrada.</div>}</section></>:null}</div></ProductShell>;
}
