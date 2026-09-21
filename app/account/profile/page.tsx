import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Globe2,
  GraduationCap,
  KeyRound,
  MapPin,
  MessageCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import AvatarUploader from "@/components/storage/AvatarUploader";
import { profileUpdateAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import { logServerEvent } from "@/lib/observability/logger";
import type { User } from "@/types";
import BrazilLocationFields from "@/components/profile/BrazilLocationFields";
import styles from "./Profile.module.css";

const TAG_OPTIONS = [
  "Tecnologia",
  "Programação",
  "Robótica",
  "IA",
  "Design",
  "Games",
  "Ciência",
  "Educação",
  "Empreendedorismo",
  "Negócios",
  "Sustentabilidade",
  "Acessibilidade",
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EN";
}

export default async function AccountProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [profileResult, complianceResult, completionResult] = await Promise.all([
    supabase.from("profiles").select("username,display_name,role,avatar_path,bio,public_city,public_state,public_school,organization,organization_type,interest_tags,profile_visibility,allow_messages").eq("id", userId).maybeSingle(),
    supabase.from("account_compliance").select("age_band,guardian_consent_verified_at").eq("user_id", userId).maybeSingle(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  const loadError = profileResult.error
    ? { source: "profiles", code: profileResult.error.code }
    : complianceResult.error
      ? { source: "account_compliance", code: complianceResult.error.code }
      : completionResult.error
        ? { source: "onboarding_completions", code: completionResult.error.code }
        : null;

  if (loadError) {
    logServerEvent("error", "account_profile_load_failed", loadError);
    throw new Error("Não foi possível carregar o perfil.");
  }
  if (!profileResult.data) redirect("/onboarding");

  const profile = profileResult.data;
  const compliance = complianceResult.data || { age_band: "adult", guardian_consent_verified_at: null };
  if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) redirect("/guardian-required");
  if (!completionResult.data) redirect("/onboarding");

  const params = await searchParams;
  const saved = params.saved === "1";
  const error = typeof params.error === "string" ? params.error : "";
  const isChild = compliance.age_band === "child";
  const productRole = parseProductRole(profile.role);
  const home = homeForRole(productRole);
  const currentTags = new Set<string>(profile.interest_tags || []);
  const customTags = [...currentTags].filter((tag) => !TAG_OPTIONS.includes(tag)).join(", ");
  const displayName = profile.display_name || profile.username || "Usuário Envista";
  const location = [profile.public_city, profile.public_state].filter(Boolean).join(", ");
  const institution = profile.role === "participant" ? profile.public_school : profile.organization;
  const completionSignals = [
    Boolean(profile.display_name),
    Boolean(profile.username),
    Boolean(profile.bio),
    Boolean(profile.public_city && profile.public_state),
    Boolean(institution),
    currentTags.size > 0,
  ];
  const completionPercent = Math.round((completionSignals.filter(Boolean).length / completionSignals.length) * 100);

  const shellUser: User = {
    id: userId,
    username: profile.username || "usuario",
    name: displayName,
    role: profile.role === "investor" ? "investor" : "participant",
    avatar: profile.avatar_path || undefined,
    bio: profile.bio || undefined,
    school: profile.public_school || undefined,
    city: profile.public_city || undefined,
    state: profile.public_state || undefined,
    organization: profile.organization || undefined,
    organizationType: profile.organization_type || undefined,
    interests: profile.interest_tags || [],
  };

  return (
    <LegacySocialShell user={shellUser} role={productRole} pathname="/account/profile">
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}><UserRound size={14} aria-hidden="true" /> Conta e identidade</span>
            <h1>Meu perfil</h1>
            <p>Atualize suas informações e escolha como você aparece para a comunidade Envista.</p>
          </div>
          <p className={styles.heroNote}>Um perfil completo ajuda pessoas, equipes e oportunidades relevantes a encontrarem você.</p>
        </header>

        {saved ? <div className={styles.notice} role="status">Perfil atualizado com sucesso.</div> : null}
        {error ? <div className={styles.error} role="alert">Não foi possível salvar: {error}</div> : null}

        <div className={styles.layout}>
          <aside className={styles.summary} aria-label="Resumo do perfil">
            <div className={styles.identity}>
              <div className={styles.avatar} aria-hidden="true">{initials(displayName)}</div>
              <div>
                <h2>{displayName}</h2>
                <p className={styles.handle}>@{profile.username || "usuario"}</p>
              </div>
            </div>

            <p className={styles.bio}>{profile.bio || "Conte um pouco sobre você para deixar seu perfil mais completo."}</p>

            <div className={styles.metaList}>
              {location ? <div className={styles.metaItem}><MapPin size={15} aria-hidden="true" /><span>{location}</span></div> : null}
              {institution ? <div className={styles.metaItem}>{profile.role === "participant" ? <GraduationCap size={15} aria-hidden="true" /> : <Building2 size={15} aria-hidden="true" />}<span>{institution}</span></div> : null}
              <div className={styles.metaItem}><Sparkles size={15} aria-hidden="true" /><span>{currentTags.size} interesse{currentTags.size === 1 ? "" : "s"} selecionado{currentTags.size === 1 ? "" : "s"}</span></div>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressTop}><span>Perfil preenchido</span><strong>{completionPercent}%</strong></div>
              <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${completionPercent}%` }} /></div>
            </div>

            <div className={styles.uploadWrap}>
              <AvatarUploader userId={userId} currentPath={profile.avatar_path} />
            </div>
          </aside>

          <section className={styles.workspace} aria-label="Editar perfil">
            <form action={profileUpdateAction} className={styles.form}>
              <section className={`${styles.card} ${styles.basicCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}><UserRound size={18} aria-hidden="true" /></span>
                  <div><h2>Informações básicas</h2><p>Seus dados principais, visíveis conforme as configurações de privacidade.</p></div>
                </div>
                <div className={styles.fields}>
                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      <span className={styles.label}>Nome de exibição</span>
                      <input name="display_name" defaultValue={profile.display_name || ""} maxLength={100} required autoComplete="name" />
                      <span className={styles.helper}>É o nome que aparece no seu perfil e nas interações.</span>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Nome de usuário</span>
                      <input name="username" defaultValue={profile.username || ""} minLength={3} maxLength={32} pattern={'[A-Za-z0-9][A-Za-z0-9._\\-]{2,31}'} required autoCapitalize="none" autoComplete="username" />
                      <span className={styles.helper}>Usado no seu identificador público dentro do Envista.</span>
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span className={styles.label}>Apresentação</span>
                    <textarea name="bio" defaultValue={profile.bio || ""} maxLength={500} placeholder="Conte quem você é, seus interesses e o que está construindo." />
                    <span className={styles.helper}>Uma descrição curta deixa seu perfil mais fácil de entender e conectar.</span>
                  </label>
                </div>
              </section>

              <div className={styles.twoColumn}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}><MapPin size={18} aria-hidden="true" /></span>
                    <div><h2>Localização e instituição</h2><p>Ajuda a encontrar pessoas, equipes e oportunidades próximas.</p></div>
                  </div>
                  <div className={styles.fields}>
                    {profile.role === "participant" ? (
                      <label className={styles.field}>
                        <span className={styles.label}>Escola ou instituição</span>
                        <input name="public_school" defaultValue={profile.public_school || ""} maxLength={160} placeholder="Digite sua escola ou instituição" />
                      </label>
                    ) : (
                      <>
                        <label className={styles.field}>
                          <span className={styles.label}>Organização</span>
                          <input name="organization" defaultValue={profile.organization || ""} maxLength={160} placeholder="Nome da organização" />
                        </label>
                        <label className={styles.field}>
                          <span className={styles.label}>Tipo de organização</span>
                          <input name="organization_type" defaultValue={profile.organization_type || ""} maxLength={100} placeholder="Ex.: Fundo, empresa, aceleradora" />
                        </label>
                      </>
                    )}
                    <BrazilLocationFields
                      defaultCity={profile.public_city || ""}
                      defaultState={profile.public_state || ""}
                      gridClassName={styles.gridCity}
                      fieldClassName={styles.field}
                      labelClassName={styles.label}
                      helperClassName={styles.helper}
                    />
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}><Sparkles size={18} aria-hidden="true" /></span>
                    <div><h2>Interesses</h2><p>Personalize recomendações, conexões e oportunidades no Envista.</p></div>
                  </div>
                  <p className={styles.tagsIntro}>Selecione os temas que mais combinam com você. Você também pode adicionar outros.</p>
                  <div className={styles.chips}>
                    {TAG_OPTIONS.map((tag) => (
                      <label className={styles.chip} key={tag}>
                        <input type="checkbox" name="interest_tags" value={tag} defaultChecked={currentTags.has(tag)} />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                  <label className={styles.field}>
                    <span className={styles.label}>Outros interesses</span>
                    <input name="interest_tags_other" defaultValue={customTags} maxLength={240} placeholder="Ex.: UX Research, audiovisual, impacto social" />
                    <span className={styles.helper}>Separe interesses personalizados por vírgula.</span>
                  </label>
                </section>
              </div>

              <div className={styles.twoColumn}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}><ShieldCheck size={18} aria-hidden="true" /></span>
                    <div><h2>Privacidade</h2><p>Controle quem encontra seu perfil e como outras pessoas interagem com você.</p></div>
                  </div>
                  <div className={styles.privacyList}>
                    <div className={styles.setting}>
                      <div className={styles.settingRow}>
                        <div className={styles.settingCopy}><Globe2 size={17} aria-hidden="true" /><div><strong>Visibilidade do perfil</strong><span>Define se seu perfil aparece para outros usuários autenticados.</span></div></div>
                        <select className={styles.compactSelect} name="profile_visibility" defaultValue={isChild ? "private" : (profile.profile_visibility || "platform")} disabled={isChild} aria-label="Visibilidade do perfil">
                          <option value="private">Somente eu</option>
                          <option value="platform">Usuários do Envista</option>
                        </select>
                      </div>
                      {isChild ? <span className={styles.helper}>Contas infantis permanecem privadas por segurança.</span> : null}
                    </div>
                    {isChild ? <input type="hidden" name="profile_visibility" value="private" /> : null}
                    <div className={styles.setting}>
                      <div className={styles.settingRow}>
                        <div className={styles.settingCopy}><MessageCircle size={17} aria-hidden="true" /><div><strong>Permitir mensagens</strong><span>Autoriza outros usuários do Envista a iniciarem conversas com você.</span></div></div>
                        <label className={styles.switch} aria-label="Permitir mensagens">
                          <input type="checkbox" name="allow_messages" defaultChecked={profile.allow_messages !== false} disabled={isChild} />
                          <span aria-hidden="true" />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}><KeyRound size={18} aria-hidden="true" /></span>
                    <div><h2>Ações da conta</h2><p>Segurança, dados e preferências ficam separados da edição pública do perfil.</p></div>
                  </div>
                  <div className={styles.accountList}>
                    <Link className={styles.accountLink} href="/account/security">
                      <span className={styles.accountLinkMain}><KeyRound size={17} aria-hidden="true" /><span><strong>Login e segurança</strong><small>Senha, e-mail e sessões da sua conta.</small></span></span>
                      <ChevronRight className={styles.chevron} size={19} aria-hidden="true" />
                    </Link>
                    <Link className={styles.accountLink} href="/account/privacy">
                      <span className={styles.accountLinkMain}><ShieldCheck size={17} aria-hidden="true" /><span><strong>Privacidade e meus dados</strong><small>Permissões, exportação e controles de privacidade.</small></span></span>
                      <ChevronRight className={styles.chevron} size={19} aria-hidden="true" />
                    </Link>
                  </div>
                </section>
              </div>

              <div className={styles.actionBar}>
                <div className={styles.actionsLeft}>
                  <Link className={styles.ghost} href={home}><ArrowLeft size={15} aria-hidden="true" /> Voltar</Link>
                </div>
                <div className={styles.actionsRight}>
                  <button className={styles.secondary} type="reset"><RotateCcw size={15} aria-hidden="true" /> Descartar alterações</button>
                  <button className={styles.primary} type="submit"><Save size={15} aria-hidden="true" /> Salvar perfil</button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </LegacySocialShell>
  );
}