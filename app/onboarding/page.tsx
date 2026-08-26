import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { onboardingAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";

const errors: Record<string, string> = {
  invalid: "Revise os campos obrigatórios e as confirmações.",
  username: "Esse nome de usuário já está em uso.",
  profile: "Não foi possível salvar o perfil.",
  age: "Não foi possível registrar a faixa etária.",
  "age-locked": "A faixa etária já foi declarada e não pode ser trocada por este formulário.",
  legal: "Não foi possível registrar os eventos jurídicos da versão atual.",
  completion: "O perfil foi salvo, mas o onboarding ainda não pôde ser concluído. Tente novamente.",
};

function ageLabel(age: string) {
  if (age === "child") return "Menos de 12 anos";
  if (age === "adolescent") return "12 a 17 anos";
  if (age === "adult") return "18 anos ou mais";
  return "Ainda não declarada";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username,display_name,role,bio,public_city,public_state,public_school,organization,organization_type")
      .eq("id", userId)
      .single(),
    supabase.from("account_compliance").select("age_band,guardian_consent_verified_at").eq("user_id", userId).single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !compliance) redirect("/auth/error?reason=profile");
  if (completion) {
    if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) redirect("/guardian-required");
    redirect(homeForRole(parseProductRole(profile.role)));
  }

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const ageLocked = compliance.age_band !== "unknown";

  return (
    <AuthShell
      wide
      title="Complete seu perfil"
      description="Seu perfil começa privado e sem mensagens. Primeiro configuramos identidade, faixa etária mínima e ciência dos documentos internos."
    >
      <div className={styles.notice}>
        Não guardamos sua data de nascimento neste fluxo. Você declara apenas uma faixa etária, uma única vez. Essa informação é usada para aplicar proteções adequadas à idade e não fica pública.
      </div>
      {errorCode ? <div className={styles.error}>{errors[errorCode] || "Não foi possível concluir. Tente novamente."}</div> : null}
      <form action={onboardingAction} className={styles.form}>
        <div className={styles.grid2}>
          <label>
            Nome de exibição
            <input name="display_name" defaultValue={profile.display_name} maxLength={100} required />
          </label>
          <label>
            Nome de usuário
            <input
              name="username"
              defaultValue={profile.username.startsWith("user_") ? "" : profile.username}
              placeholder="seu_usuario"
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}"
              required
            />
          </label>
        </div>

        <label>
          Faixa etária
          {ageLocked ? (
            <>
              <input type="hidden" name="age_band" value={compliance.age_band} />
              <input value={ageLabel(compliance.age_band)} disabled />
            </>
          ) : (
            <select name="age_band" defaultValue="" required>
              <option value="" disabled>Selecione</option>
              <option value="child">Menos de 12 anos</option>
              <option value="adolescent">12 a 17 anos</option>
              <option value="adult">18 anos ou mais</option>
            </select>
          )}
          <span className={styles.muted}>A faixa é usada para aplicar proteções adequadas. Ela não fica pública.</span>
        </label>

        <label>
          Bio <span className={styles.muted}>(opcional)</span>
          <textarea name="bio" defaultValue={profile.bio || ""} maxLength={500} />
        </label>

        {profile.role === "participant" ? (
          <div className={styles.grid2}>
            <label>Escola/instituição <input name="public_school" defaultValue={profile.public_school || ""} maxLength={160} /></label>
            <label>Cidade <input name="public_city" defaultValue={profile.public_city || ""} maxLength={100} /></label>
            <label>Estado <input name="public_state" defaultValue={profile.public_state || ""} maxLength={100} /></label>
          </div>
        ) : (
          <div className={styles.grid2}>
            <label>Organização <input name="organization" defaultValue={profile.organization || ""} maxLength={160} /></label>
            <label>Tipo de organização <input name="organization_type" defaultValue={profile.organization_type || ""} maxLength={100} /></label>
          </div>
        )}

        <div className={styles.divider} />
        <div className={styles.notice}>
          Os documentos abaixo são <strong>versões internas de teste</strong>. Não são os textos finais para lançamento público.
        </div>
        <div className={styles.checks}>
          <label className={styles.check}>
            <input type="checkbox" name="terms" required />
            <span>Li e aceito os <a href="/terms" target="_blank" rel="noreferrer">Termos de Uso internos</a>.</span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="privacy" required />
            <span>Li o <a href="/privacy" target="_blank" rel="noreferrer">Aviso de Privacidade interno</a>. Esta ciência não é tratada automaticamente como consentimento para toda finalidade.</span>
          </label>
        </div>
        <button className={`${styles.primary} ${styles.full}`} type="submit">Concluir configuração</button>
      </form>
    </AuthShell>
  );
}
