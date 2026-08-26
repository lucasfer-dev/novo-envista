import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { createPrivacyRequestAction } from "@/lib/privacy/actions";
import { createClient } from "@/lib/supabase/server";

export default async function PrivacyCenter({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const supabase=await createClient();const {data:claims,error}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(error||!userId)redirect("/login?next=/account/privacy");const params=await searchParams;
 const {data:requests}=await supabase.from("privacy_requests").select("id,request_type,details,status,admin_note,requested_at,resolved_at").eq("user_id",userId).order("requested_at",{ascending:false});
 return <AuthShell wide title="Central de Privacidade" description="Acesse seus dados e registre solicitações relacionadas à sua conta.">
  {params.status==="requested"?<div className={styles.success}>Solicitação registrada.</div>:null}{params.status==="already-requested"?<div className={styles.success}>Já existe um pedido de exclusão aberto para esta conta.</div>:null}{params.error?<div className={styles.error}>Não foi possível registrar a solicitação.</div>:null}
  <div className={styles.actions}><a className={styles.primary} href="/account/privacy/export">Baixar meus dados em JSON</a><Link className={styles.secondary} href="/account/profile">Voltar ao perfil</Link></div>
  <div className={styles.divider}/>
  <h2>Nova solicitação</h2><p>Você pode pedir acesso, correção, exclusão ou outro atendimento. A exportação acima é imediata; os demais pedidos entram em análise.</p>
  <form className={styles.form} action={createPrivacyRequestAction}><label>Tipo<select name="request_type" defaultValue="correction"><option value="access">Acesso</option><option value="correction">Correção</option><option value="deletion">Exclusão da conta</option><option value="export">Ajuda com exportação</option><option value="other">Outro</option></select></label><label>Detalhes<textarea name="details" maxLength={2000} placeholder="Explique o que você precisa, sem incluir senhas ou dados desnecessários."/></label><button className={styles.primary}>Enviar solicitação</button></form>
  <div className={styles.divider}/><h2>Pedidos anteriores</h2>{(requests??[]).length===0?<p>Nenhum pedido registrado.</p>:(requests??[]).map((request:any)=><section key={request.id} style={{border:"1px solid #e4e7ec",borderRadius:12,padding:14,marginBottom:10}}><strong>{request.request_type}</strong> · {request.status}<p>{request.details||"Sem detalhes."}</p><small>Solicitado em {new Date(request.requested_at).toLocaleString("pt-BR")}</small>{request.admin_note?<p><strong>Retorno:</strong> {request.admin_note}</p>:null}</section>)}
  <div className={styles.divider}/><h2>Sobre exclusão</h2><p>O pedido de exclusão é registrado de forma real, mas a conta do Supabase Auth só deve ser removida por um processo administrativo privilegiado depois da validação do pedido e das regras de retenção aplicáveis. O site não finge que um botão no navegador consegue executar essa etapa com segurança.</p>
 </AuthShell>;
}
