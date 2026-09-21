import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
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

const TAG_OPTIONS = ["Tecnologia", "Programação", "Robótica", "IA", "Design", "Games", "Ciência", "Educação", "Empreendedorismo", "Negócios", "Sustentabilidade", "Acessibilidade"];

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
    supabase.from("account_compliance").select("age_band,guardian_consent_verified_at").eq("user_id", userId).single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !compliance) redirect("/auth/error?reason=profile");
  if (compliance.age_band !== "unknown" && compliance.age_band !== "adult" && !compliance.guardian_consent_verified_at) {
    redirect("/guardian-required");
  }
  if (completion) redirect(homeForRole(parseProductRole(profile.role)));

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const ageLocked = compliance.age_band !== "unknown";
  const participant = profile.role === "participant";
  const currentTags = new Set<string>(profile.interest_tags || []);
  const customTags = [...currentTags].filter((tag) => !TAG_OPTIONS.includes(tag)).join(", ");

  return (
    <AuthShell wide title="Complete seu perfil" description={`Uma configuração rápida antes de entrar no Envista como ${participant ? "participante" : "investidor"}. Localização e interesses ajudam a sugerir pessoas, projetos e competições mais relevantes.`}>
      <div className={styles.notice} role="status"><strong>Privacidade primeiro.</strong> Seu perfil começa privado e com novas mensagens desativadas. Você poderá revisar essas opções depois em Configurações.</div>
      <div className={styles.notice}>A data de nascimento informada no cadastro é usada somente para calcular sua faixa etária e é descartada na criação da conta. A faixa etária fica privada e serve para aplicar as proteções adequadas.</div>
      {errorCode ? <div className={styles.error} role="alert"><strong>Não foi possível concluir o cadastro.</strong>{" "}{errors[errorCode] || "Tente novamente. Se o problema continuar, recarregue a página."}</div> : null}
      <form id="onboarding-form" action={onboardingAction} className={styles.form} noValidate>
        <OnboardingDraftRestore formId="onboarding-form" storageKey={`envista:onboarding-draft:${userId}`} />
        <div className={styles.grid2}>
          <label>Nome de exibição<input name="display_name" autoComplete="name" defaultValue={profile.display_name} maxLength={100} aria-invalid={errorCode === "display-name" ? true : undefined} required /></label>
          <label>Nome de usuário<input name="username" autoComplete="username" defaultValue={profile.username.startsWith("user_") ? "" : profile.username} placeholder="seu_usuario" minLength={3} maxLength={32} pattern={'[A-Za-z0-9][A-Za-z0-9._\\-]{2,31}'} aria-describedby="username-help" aria-invalid={errorCode === "username" || errorCode === "username-format" ? true : undefined} required /><span id="username-help" className={styles.muted}>De 3 a 32 caracteres: letras, números, ponto, hífen ou underline.</span></label>
        </div>

        <label>Faixa etária{ageLocked ? <><input type="hidden" name="age_band" value={compliance.age_band} /><input value={ageLabel(compliance.age_band)} disabled /></> : <select name="age_band" defaultValue="" required><option value="" disabled>Selecione</option><option value="child">Menos de 12 anos</option><option value="adolescent">12 a 17 anos</option><option value="adult">18 anos ou mais</option></select>}<span className={styles.muted}>A faixa é usada para aplicar proteções adequadas. Ela não fica pública. Contas de menores de 18 anos permanecem bloqueadas até a verificação do responsável.</span></label>

        <label>Apresentação <span className={styles.muted}>(opcional)</span><textarea name="bio" defaultValue={profile.bio || ""} maxLength={500} placeholder="Conte um pouco sobre seus interesses ou o que você está construindo." /></label>

        <div className={styles.grid2}>
          {participant ? <label>Escola/instituição <span className={styles.muted}>(opcional)</span><input name="public_school" autoComplete="organization" defaultValue={profile.public_school || ""} maxLength={160} placeholder="Digite o nome — aceitamos outras escolas" /></label> : <><label>Organização <span className={styles.muted}>(opcional)</span><input name="organization" autoComplete="organization" defaultValue={profile.organization || ""} maxLength={160} placeholder="Digite a organização" /></label><label>Tipo de organização <span className={styles.muted}>(opcional)</span><input name="organization_type" defaultValue={profile.organization_type || ""} maxLength={100} placeholder="Escola, empresa, fundo, ONG…" /></label></>}
        </div>
        <BrazilLocationFields
          defaultCity={profile.public_city || ""}
          defaultState={profile.public_state || ""}
          gridClassName={styles.grid2}
          helperClassName={styles.muted}
        />

        <fieldset className={styles.formSection}>
          <legend>Interesses e tags <span className={styles.muted}>(opcional)</span></legend>
          <span className={styles.muted}>Selecione quantas fizerem sentido. Se não encontrar, use “Outros”.</span>
          <div className={styles.checks}>{TAG_OPTIONS.map((tag) => <label className={styles.check} key={tag}><input type="checkbox" name="interest_tags" value={tag} defaultChecked={currentTags.has(tag)} /><span>{tag}</span></label>)}</div>
          <label>Outros<input name="interest_tags_other" defaultValue={customTags} maxLength={300} placeholder="Ex.: audiovisual, saúde, astronomia — separe por vírgulas" /></label>
        </fieldset>

        <div className={styles.divider} />
        <div className={styles.checks}>
          <label className={styles.check}><input type="checkbox" name="terms" aria-invalid={errorCode === "terms-required" ? true : undefined} required /><span>Li e aceito os <a href="/terms" target="_blank" rel="noreferrer">Termos de Uso</a>.</span></label>
          <label className={styles.check}><input type="checkbox" name="privacy" aria-invalid={errorCode === "privacy-required" ? true : undefined} required /><span>Li o <a href="/privacy" target="_blank" rel="noreferrer">Aviso de Privacidade</a>. Esta ciência não é tratada automaticamente como consentimento para toda finalidade.</span></label>
        </div>
        {!participant ? <div className={styles.notice}>Contas de investidor podem explorar a plataforma imediatamente. Para iniciar contatos com projetos, será necessário concluir a verificação de investidor.</div> : null}
        <button className={`${styles.primary} ${styles.full}`} type="submit">Salvar e entrar no Envista</button>
      </form>
    </AuthShell>
  );
}
