import { Fingerprint, ShieldCheck, UserRoundCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { continueProtectedModeAction, startGuardianVerificationAction } from "@/app/guardian/actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import flowStyles from "@/components/guardian/GuardianFlow.module.css";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole, safeInternalPath } from "@/lib/auth/validation";

const errors: Record<string, string> = {
  name: "Informe o nome do responsável.",
  relationship: "Selecione o vínculo com o responsável.",
  cpf: "Informe um CPF válido do responsável.",
  request: "Não foi possível iniciar a confirmação agora. Tente novamente.",
};

export default async function GuardianPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase.from("profiles").select("display_name,role").eq("id", userId).single(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_required,guardian_consent_verified_at,protected_mode_started_at")
      .eq("user_id", userId)
      .single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile || !compliance) redirect("/auth/error?reason=profile");

  const params = await searchParams;
  const requestedNext = typeof params.next === "string" ? safeInternalPath(params.next, "/onboarding") : "/onboarding";
  const normalDestination = completion ? homeForRole(parseProductRole(profile.role)) : "/onboarding";

  if (!compliance.guardian_required || compliance.guardian_consent_verified_at) {
    redirect(completion ? requestedNext : normalDestination);
  }

  const errorCode = typeof params.error === "string" ? params.error : "";
  const adolescent = compliance.age_band === "adolescent";

  return (
    <AuthShell
      wide
      title="Confirmação de responsável"
      description="Uma etapa curta para liberar as áreas sociais do Envista. O responsável não precisa criar perfil ou participar da plataforma."
    >
      {errorCode ? <div className={styles.error} role="alert">{errors[errorCode] || errors.request}</div> : null}

      <div className={flowStyles.formIntro}>
        <UserRoundCheck size={21} />
        <span>
          Você informa os dados mínimos do responsável e recebe um link exclusivo. O responsável abre esse link, confere os dados e faz a declaração. Depois disso, sua conta é liberada.
        </span>
      </div>

      <form action={startGuardianVerificationAction} className={styles.form}>
        <input type="hidden" name="next" value={requestedNext} />

        <div className={styles.grid2}>
          <label>
            Nome completo do responsável
            <input name="guardian_name" autoComplete="name" maxLength={120} required />
          </label>
          <label>
            Vínculo
            <select name="guardian_relationship" defaultValue="" required>
              <option value="" disabled>Selecione</option>
              <option value="mother">Mãe</option>
              <option value="father">Pai</option>
              <option value="legal_guardian">Responsável legal</option>
              <option value="other">Outro responsável legal</option>
            </select>
          </label>
        </div>

        <label>
          CPF do responsável
          <input
            name="guardian_cpf"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={18}
            required
          />
          <span className={styles.muted}>O número completo não é exibido no perfil. A validação armazena apenas uma representação protegida para conferir a confirmação.</span>
        </label>

        <button className={styles.primary + " " + styles.full} type="submit">
          <Fingerprint size={17} /> Gerar link de confirmação
        </button>
      </form>

      <ul className={flowStyles.modeList}>
        <li><ShieldCheck size={16} /> O responsável não recebe perfil público, feed, projetos ou username no Envista.</li>
        <li><ShieldCheck size={16} /> O link expira e a confirmação só pode ser usada uma vez.</li>
      </ul>

      {adolescent ? (
        <>
          <div className={styles.divider} />
          <form action={continueProtectedModeAction}>
            <button className={styles.secondary + " " + styles.full} type="submit">
              Fazer isso depois e continuar protegido
            </button>
          </form>
        </>
      ) : null}
    </AuthShell>
  );
}
