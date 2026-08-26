import { requireProductUser } from "@/lib/auth/require-product-user";
import { expressProjectInterestAction, withdrawProjectInterestAction } from "@/lib/interests/actions";
import styles from "./Projects.module.css";

export default async function ProjectInterestPanel({ projectId, returnTo }: { projectId: string; returnTo: string }) {
  const { supabase, userId, role } = await requireProductUser();
  if (role !== "investor") return null;
  const { data } = await supabase.from("project_interests").select("message,status").eq("investor_id", userId).eq("project_id", projectId).maybeSingle();
  const active = data?.status === "active";
  return <section className={styles.card} style={{marginBottom:16}}><h3>{active ? "Interesse enviado" : "Tenho interesse"}</h3><p className={styles.muted}>{active ? "O responsável pelo projeto já pode ver sua manifestação de interesse." : "Envie uma mensagem curta para demonstrar interesse neste projeto. Isso não representa uma transação financeira."}</p>{active ? <><p className={styles.body}>{data.message || "Interesse demonstrado sem mensagem."}</p><form action={withdrawProjectInterestAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="return_to" value={returnTo}/><button className={styles.secondary} type="submit">Retirar interesse</button></form></> : <form className={styles.form} action={expressProjectInterestAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="return_to" value={returnTo}/><label>Mensagem<textarea name="message" maxLength={1200} placeholder="Conte por que este projeto chamou sua atenção."/></label><button className={styles.primary} type="submit">Demonstrar interesse</button></form>}</section>;
}
