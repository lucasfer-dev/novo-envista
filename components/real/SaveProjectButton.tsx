import { requireProductUser } from "@/lib/auth/require-product-user";
import { toggleProjectSaveAction } from "@/lib/projects/save-actions";
import styles from "./Projects.module.css";

export default async function SaveProjectButton({ projectId, returnTo }: { projectId: string; returnTo: string }) {
  const { supabase, userId, role } = await requireProductUser();
  if (role !== "investor") return null;
  const { data } = await supabase.from("project_saves").select("project_id").eq("user_id", userId).eq("project_id", projectId).maybeSingle();
  return <form action={toggleProjectSaveAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="return_to" value={returnTo}/><button className={styles.secondary} type="submit">{data ? "Salvo" : "Salvar"}</button></form>;
}
