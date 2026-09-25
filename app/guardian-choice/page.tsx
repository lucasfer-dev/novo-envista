import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { continueProtectedModeAction } from "@/app/guardian/actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import flowStyles from "@/components/guardian/GuardianFlow.module.css";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";

export default async function GuardianChoicePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_required,guardian_consent_verified_at,protected_mode_started_at")
      .eq("user_id", userId)
      .single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !compliance) redirect("/auth/error?reason=profile");
  const role = parseProductRole(profile.role);
  const destination = completion ? homeForRole(role) : "/onboarding";

  if (!compliance.guardian_required || compliance.guardian_consent_verified_at) redirect(destination);
  if (compliance.age_band === "child") redirect("/guardian");
  if (compliance.age_band !== "adolescent") redirect(destination);
  if (compliance.protected_mode_started_at) redirect(destination);

  const params = await searchParams;
  const hasError = params.error === "protected-mode";

  return (
    <AuthShell
      title="Como você quer continuar?"
      description="Você pode confirmar um responsável agora ou entrar no Envista em modo protegido e fazer isso depois."
    >
      {hasError ? (
        <div className={styles.error} role="alert">
          Não foi possível ativar o modo protegido agora. Tente novamente.
        </div>
      ) : null}

      <div className={styles.notice}>
        No modo protegido, você continua usando projetos, equipes, cursos, competições e outras áreas do Envista. Social e Mensagens ficam visíveis, mas só são liberados após a confirmação de um responsável.
      </div>

      <div className={flowStyles.choiceGrid}>
        <div className={flowStyles.choiceCard}>
          <div className={flowStyles.choiceIcon}><ShieldCheck size={21} /></div>
          <h2>Verificar responsável agora</h2>
          <p>Gere um link de confirmação para seu responsável. Ele não precisa criar perfil, username ou participar da rede do Envista.</p>
          <Link className={styles.primary} href="/guardian">Começar verificação</Link>
        </div>

        <div className={flowStyles.choiceCard}>
          <div className={flowStyles.choiceIcon}><LockKeyhole size={21} /></div>
          <h2>Continuar no modo protegido</h2>
          <p>Complete seu perfil e use o núcleo do Envista agora. Quando quiser abrir Social ou Mensagens, a confirmação será solicitada.</p>
          <form action={continueProtectedModeAction}>
            <button className={styles.secondary} type="submit">Continuar protegido</button>
          </form>
        </div>
      </div>

      <ul className={flowStyles.modeList}>
        <li><ShieldCheck size={16} /> Seu perfil começa privado e mensagens permanecem desativadas enquanto a confirmação não for concluída.</li>
        <li><ShieldCheck size={16} /> O responsável não ganha perfil social e os dados de documento não ficam públicos.</li>
      </ul>
    </AuthShell>
  );
}
