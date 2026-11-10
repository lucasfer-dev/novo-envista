import { redirect } from "next/navigation";
import { RegisterShell } from "@/components/auth/RegisterShell";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { InterestTagsField } from "@/components/auth/InterestTagsField";
import { ArrowRight, AtSign, Building2, ChevronDown, GraduationCap, Info, LockKeyhole, MapPin, ShieldCheck, UserRound } from "lucide-react";
import styles from "./Onboarding.module.css";
import { onboardingAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import BrazilLocationFields from "@/components/profile/BrazilLocationFields";
import { OnboardingDraftRestore } from "@/components/auth/OnboardingDraftRestore";

const errors: Record<string, string> = {
  invalid: "Revise os campos obrigatórios e tente novamente.",
  "display-name": "Preencha o nome de exibição.",
  "username-format": "Escolha um nome de usuário com 3 a 32 caracteres usando letras, números, ponto, hífen ou underline.",
  username: "Esse nome de usuário já está em uso. Escolha outro.",
  profile: "Não foi possível salvar os dados do perfil. Tente novamente.",
  "age-required": "Não foi possível identificar sua faixa etária. Recarregue a página e tente novamente.",
  age: "Não foi possível registrar a faixa etária.",
  "age-locked": "A faixa etária desta conta já foi definida e não pode ser alterada aqui.",
  "terms-required": "Para continuar, aceite os Termos de Uso.",
  "privacy-required": "Para continuar, confirme que leu o Aviso de Privacidade.",
  legal: "Não foi possível registrar as confirmações jurídicas. Tente novamente.",
  completion: "Seus dados foram salvos, mas ocorreu uma falha ao finalizar o cadastro. Você não precisa preencher tudo novamente; tente o botão mais uma vez.",
};

function ageLabel(age: string) {
  if (age === "child") return "Menos de 12 anos";
  if (age === "adolescent") return "12 a 17 anos";
  if (age === "adult") return "18 anos ou mais";
  return "Ainda não declarada";
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase.from("profiles").select("username,display_name,role,bio,public_city,public_state,public_school,organization,organization_type,interest_tags").eq("id", userId).single(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_required,guardian_consent_verified_at,protected_mode_started_at")
      .eq("user_id", userId)
      .single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !compliance) redirect("/auth/error?reason=profile");
  if (
    compliance.age_band === "child" &&
    compliance.guardian_required &&
    !compliance.guardian_consent_verified_at
  ) {
    redirect("/guardian");
  }
  if (
    compliance.age_band === "adolescent" &&
    compliance.guardian_required &&
    !compliance.guardian_consent_verified_at &&
    !compliance.protected_mode_started_at
  ) {
    redirect("/guardian-choice");
  }
  if (completion) redirect(homeForRole(parseProductRole(profile.role)));

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const ageLocked = compliance.age_band !== "unknown";
  const participant = profile.role === "participant";
  const protectedMinor = Boolean(
    compliance.guardian_required &&
    !compliance.guardian_consent_verified_at &&
    compliance.age_band === "adolescent"
  );

  return (
    <RegisterShell
      phase="profile"
      title="Complete seu perfil"
      description={`Finalize seu cadastro com algumas informações para personalizar sua experiência no Envista como ${participant ? "participante" : "investidor"}.`}
    >
      <div className={styles.privacyNote}>
        <ShieldCheck size={19} aria-hidden="true" />
        <span>Seu perfil começa <strong>privado e protegido.</strong> Você pode revisar sua visibilidade e as mensagens nas configurações.</span>
      </div>
      {protectedMinor ? (
        <div className={styles.privacyNote} role="status">
          <LockKeyhole size={19} aria-hidden="true" />
          <span><strong>Modo protegido ativo.</strong> Projetos, equipes e cursos estão disponíveis. Mensagens e recursos sociais dependem da autorização do responsável.</span>
        </div>
      ) : null}
      {errorCode ? (
        <div className={styles.error} role="alert">
          <strong>Não foi possível concluir seu perfil.</strong> {errors[errorCode] || "Confira os dados e tente novamente."}
        </div>
      ) : null}
      <form id="onboarding-form" action={onboardingAction} className={styles.form} noValidate>
        <OnboardingDraftRestore formId="onboarding-form" storageKey={`envista:onboarding-draft:${userId}`} />

        <div className={styles.sectionHeading}>
          <span className={styles.sectionIndex} aria-hidden="true">01</span>
          <div><h2>Informações principais</h2><p>O essencial para identificar seu perfil.</p></div>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            Nome de exibição <span className={styles.inputWrap}>
              <UserRound aria-hidden="true" size={18} />
              <input name="display_name" autoComplete="name" defaultValue={profile.display_name} maxLength={100} placeholder="Como você quer ser chamado?" required aria-invalid={errorCode === "display-name" || undefined} />
            </span>
          </label>
          <label className={styles.field}>
            Nome de usuário <span className={styles.inputWrap}>
              <AtSign aria-hidden="true" size={18} />
              <input name="username" autoComplete="username" defaultValue={profile.username.startsWith("user_") ? "" : profile.username} placeholder="seu_usuario" minLength={3} maxLength={32} pattern={'[A-Za-z0-9][A-Za-z0-9._\\-]{2,31}'} required aria-invalid={["username", "username-format"].includes(errorCode) || undefined} aria-describedby="username-help" />
            </span>
            <span id="username-help" className={styles.help}>3 a 32 caracteres: letras, números, ponto, hífen ou underline.</span>
          </label>
        </div>

        <label className={styles.field}>
          Faixa etária
          {ageLocked ? (
            <>
              <input type="hidden" name="age_band" value={compliance.age_band} />
              <input value={ageLabel(compliance.age_band)} disabled className={styles.ageLocked} />
            </>
          ) : (
            <select name="age_band" defaultValue="" required>
              <option value="" disabled>Selecione sua faixa etária</option>
              <option value="child">Menos de 12 anos</option>
              <option value="adolescent">12 a 17 anos</option>
              <option value="adult">18 anos ou mais</option>
            </select>
          )}
          <span className={styles.help}>Esta informação é privada e usada para aplicar as proteções adequadas à sua idade.</span>
        </label>

        <details
          className={styles.optionalDetails}
          open={Boolean(profile.bio || profile.public_school || profile.organization || profile.organization_type || profile.public_city || profile.public_state)}
        >
          <summary>
            <span className={styles.optionalSummary}>
              <span className={styles.optionalSummaryIcon}><MapPin size={18} aria-hidden="true" /></span>
              <span><strong>Sobre você</strong><small>Apresentação, instituição e localização · opcional</small></span>
            </span>
            <ChevronDown className={styles.optionalChevron} size={18} aria-hidden="true" />
          </summary>
          <div className={styles.optionalBody}>
            <label className={styles.field}>
              Apresentação <span className={styles.optional}>(opcional)</span>
              <textarea name="bio" defaultValue={profile.bio || ""} maxLength={500} rows={3} placeholder="Fale sobre seus interesses, habilidades e o que está construindo..." />
            </label>
            {participant ? (
              <label className={styles.field}>
                Escola / instituição <span className={styles.optional}>(opcional)</span>
                <span className={styles.inputWrap}>
                  <GraduationCap aria-hidden="true" size={18} />
                  <input name="public_school" autoComplete="organization" defaultValue={profile.public_school || ""} maxLength={160} placeholder="Digite o nome da instituição" />
                </span>
              </label>
            ) : (
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  Organização <span className={styles.optional}>(opcional)</span>
                  <span className={styles.inputWrap}>
                    <Building2 aria-hidden="true" size={18} />
                    <input name="organization" autoComplete="organization" defaultValue={profile.organization || ""} maxLength={160} placeholder="Nome da organização" />
                  </span>
                </label>
                <label className={styles.field}>
                  Tipo de organização <span className={styles.optional}>(opcional)</span>
                  <input name="organization_type" defaultValue={profile.organization_type || ""} maxLength={100} placeholder="Empresa, ONG, fundo, escola..." />
                </label>
              </div>
            )}
            <BrazilLocationFields
              defaultCity={profile.public_city || ""}
              defaultState={profile.public_state || ""}
              gridClassName={styles.formGrid}
              fieldClassName={styles.field}
              helperClassName={styles.help}
            />
            <p className={styles.locationHelp}><MapPin size={14} aria-hidden="true" /> Localização opcional, usada para sugerir oportunidades relevantes.</p>
          </div>
        </details>

        <div className={styles.sectionHeading}>
          <span className={styles.sectionIndex} aria-hidden="true">02</span>
          <div><h2>Seus interesses</h2><p>Escolha os temas que mais combinam com você.</p></div>
        </div>
        <InterestTagsField
          initialTags={profile.interest_tags || []}
          draftKey={`envista:onboarding-tags:${userId}`}
        />

        <details className={styles.details}>
          <summary><Info size={17} aria-hidden="true" /> Como protegemos seus dados?</summary>
          <p>A data de nascimento informada no cadastro é usada para calcular a faixa etária e depois descartada. A faixa etária não é pública. As opções de privacidade e mensagens podem ser revisadas nas configurações, respeitando a proteção de menores.</p>
        </details>

        <div className={styles.consentBox}>
          <label className={styles.consent}>
            <input type="checkbox" name="terms" required aria-invalid={errorCode === "terms-required" || undefined} />
            <span>Li e aceito os <a href="/terms" target="_blank" rel="noreferrer">Termos de Uso</a>.</span>
          </label>
          <label className={styles.consent}>
            <input type="checkbox" name="privacy" required aria-invalid={errorCode === "privacy-required" || undefined} />
            <span>Li o <a href="/privacy" target="_blank" rel="noreferrer">Aviso de Privacidade</a>. Essa confirmação não representa consentimento genérico para todas as finalidades.</span>
          </label>
        </div>

        {!participant ? (
          <p className={styles.investorNotice}>Você poderá explorar projetos após concluir o cadastro. Para entrar em contato com equipes será necessária a verificação de investidor.</p>
        ) : null}
        <AuthSubmitButton className={styles.submit} pendingText="Salvando perfil...">
          Concluir perfil e acessar o Envista <ArrowRight size={19} aria-hidden="true" />
        </AuthSubmitButton>
      </form>
    </RegisterShell>
  );
}
