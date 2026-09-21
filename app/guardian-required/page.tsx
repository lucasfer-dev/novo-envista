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

  if (!compliance || compliance.age_band === "adult" || compliance.age_band === "unknown") redirect("/onboarding");
  if (compliance.guardian_consent_verified_at) redirect("/app");

  return (
    <AuthShell title="Conta protegida" description="Esta conta de menor de idade precisa concluir uma etapa com responsável antes de usar o Envista.">
      <div className={styles.danger}>
        O perfil continua <strong>privado</strong> e as mensagens permanecem <strong>desativadas</strong>. Enquanto a verificação de responsável não estiver concluída, a conta permanece bloqueada por segurança e conformidade.
      </div>
      <p className={styles.muted}>
        O Envista não libera o acesso de menores sem a verificação aplicável do responsável. Nenhum documento adicional deve ser enviado fora de um fluxo oficial da plataforma.
      </p>
      <form action="/auth/signout" method="post" className={styles.form}>
        <button className={`${styles.secondary} ${styles.full}`} type="submit">Sair da conta</button>
      </form>
    </AuthShell>
  );
}
