import styles from "./Social.module.css";
import { requireProductUser } from "@/lib/auth/require-product-user";

function time(value:string){try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));}catch{return value;}}

export default async function EntityPostsPanel({teamId}:{teamId:string}){
  const {supabase}=await requireProductUser();
  const {data:posts}=await supabase.from("posts").select("id,body,created_at").eq("author_team_id",teamId).eq("visibility","platform").order("created_at",{ascending:false}).limit(30);
  return <section className={styles.stack}><h2>Publicações da equipe</h2>{!posts?.length?<div className={styles.empty}>A equipe ainda não publicou atualizações.</div>:posts.map(post=><article className={styles.card} key={post.id}><p className={styles.body}>{post.body}</p><small className={styles.muted}>{time(post.created_at)}</small></article>)}</section>;
}
