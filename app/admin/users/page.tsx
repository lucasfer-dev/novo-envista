import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminUsers(){
 const {supabase,profile}=await requireAdminUser();
 const [{data:profiles},{data:compliance}]=await Promise.all([
  supabase.from("profiles").select("id,username,display_name,role,profile_visibility,allow_messages,created_at").order("created_at",{ascending:false}).limit(200),
  supabase.from("account_compliance").select("user_id,age_band,guardian_consent_verified_at"),
 ]);
 const complianceMap=new Map((compliance??[]).map((row:any)=>[row.user_id,row]));
 return <AdminShell profile={profile} title="Usuários"><div className={styles.head}><div><h1>Usuários</h1><p className={styles.muted}>Visão operacional. E-mail e outros dados que não precisam aparecer aqui continuam fora do diretório.</p></div></div><div className={styles.warning}>Faixa etária e status de responsável são dados de conformidade: use apenas quando necessário para proteção e atendimento.</div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Conta</th><th>Tipo</th><th>Visibilidade</th><th>Mensagens</th><th>Faixa etária</th><th>Responsável</th></tr></thead><tbody>{(profiles??[]).map((item:any)=>{const c=complianceMap.get(item.id);return <tr key={item.id}><td><strong>{item.display_name}</strong><br/><span className={styles.muted}>@{item.username}</span></td><td>{item.role}</td><td><span className={styles.pill}>{item.profile_visibility}</span></td><td>{item.allow_messages?"Permitidas":"Bloqueadas"}</td><td>{c?.age_band??"—"}</td><td>{c?.guardian_consent_verified_at?"Verificado":"—"}</td></tr>;})}</tbody></table></div></AdminShell>;
}
