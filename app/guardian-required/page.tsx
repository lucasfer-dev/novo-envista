import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";

export default async function GuardianRequiredPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");

  const { data: compliance } = await supabase
    .from("account_compliance")
    .select("age_band,guardian_consent_verified_at")
    .eq("user_id", userId)
    .single();

  if (!compliance || compliance.age_band !== "child") redirect("/onboarding");
  if (compliance.guardian_consent_verified_at) redirect("/app");

  return (
    <AuthShell title="Conta protegida" description="Esta conta precisa concluir uma etapa com responsável antes de usar as áreas sociais do Envista.">
      <div className={styles.danger}>
        O perfil continua <strong>privado</strong> e as mensagens permanecem <strong>desativadas</strong>. Ainda não implementamos a verificação de responsável, então não vamos liberar a área social por atalho.
      </div>
      <p className={styles.muted}>
        Quando o fluxo de responsável estiver pronto e revisado, esta página será substituída pelas instruções adequadas. Nenhum documento do responsável é solicitado neste estágio.
      </p>
      <form action="/auth/signout" method="post" className={styles.form}>
        <button className={`${styles.secondary} ${styles.full}`} type="submit">Sair da conta</button>
      </form>
    </AuthShell>
  );
}
