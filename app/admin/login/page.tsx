import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLoginPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;
 if(!userId)redirect("/login?next=/admin");
 const {data:membership}=await supabase.from("admin_memberships").select("user_id").eq("user_id",userId).maybeSingle();
 if(membership)redirect("/admin");
 const params=await searchParams;void params;
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f7f9fb",padding:24}}><section style={{maxWidth:520,background:"white",border:"1px solid #e4e7ec",borderRadius:18,padding:28}}><img src="/envista-logo.png" alt="" style={{width:44}}/><h1>Acesso administrativo</h1><p>Esta conta está autenticada, mas não possui uma associação administrativa válida no banco.</p><p style={{color:"#667085"}}>O acesso ao painel não pode ser liberado por URL, localStorage ou alteração do perfil. A associação precisa ser concedida por um processo administrativo confiável.</p><Link href="/" style={{display:"inline-block",marginTop:12}}>Voltar ao Envista</Link></section></main>;
}
