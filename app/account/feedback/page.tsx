import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { submitFeedbackAction } from "@/lib/account/professional-actions";

const labels: Record<string,string> = { feedback: "Feedback", bug: "Problema", idea: "Ideia", support: "Suporte" };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  const [{ data: profile }, { data: tickets }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("feedback_tickets").select("id,category,message,page_path,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
  ]);
  const params = await searchParams;
  const home = profile?.role === "investor" ? "/investor" : "/app";
  return (
    <AuthShell wide title="Suporte e feedback" description="Encontrou algo estranho ou teve uma ideia? Envie direto para a equipe do Envista.">
      {params.status === "sent" ? <div className={styles.success}>Recebemos sua mensagem. Obrigado por ajudar a melhorar o Envista.</div> : null}
      {params.error ? <div className={styles.error}>Não foi possível enviar agora. Revise a mensagem e tente novamente.</div> : null}
      <form action={submitFeedbackAction} className={styles.form}>
        <label>Categoria<select name="category" defaultValue="feedback"><option value="feedback">Feedback geral</option><option value="bug">Reportar problema</option><option value="idea">Sugerir ideia</option><option value="support">Preciso de ajuda</option></select></label>
        <label>Mensagem<textarea name="message" minLength={5} maxLength={3000} required placeholder="Conte o que aconteceu, o que você esperava e, se puder, como reproduzir." /></label>
        <label>Página relacionada<input name="page_path" defaultValue="/" maxLength={500} placeholder="/app/projects/..." /></label>
        <button className={styles.primary} type="submit">Enviar</button>
      </form>
      {(tickets ?? []).length ? <><div className={styles.divider} /><h2 style={{ fontSize: 18 }}>Minhas solicitações</h2><div className={styles.legal}><ul>{(tickets ?? []).map((ticket:any)=><li key={ticket.id}><strong>{labels[ticket.category] || ticket.category}</strong> · {ticket.status} · {new Date(ticket.created_at).toLocaleDateString("pt-BR")}<br/><span>{ticket.message.slice(0,180)}{ticket.message.length>180?"…":""}</span></li>)}</ul></div></> : null}
      <div className={styles.actions}><Link className={styles.secondary} href="/account/settings">Configurações</Link><Link className={styles.secondary} href={home}>Voltar ao Envista</Link></div>
    </AuthShell>
  );
}
