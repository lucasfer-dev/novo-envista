import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell, CalendarDays, Check, CircleUserRound, Database, FolderKanban,
  Github, Globe2, KeyRound, LifeBuoy, Link2, LockKeyhole, MapPin,
  MessageCircle, ShieldCheck, Sparkles, UserRound, Users,
} from "lucide-react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import SettingsWorkspace, { settingsStyles as s } from "@/components/account/SettingsWorkspace";
import AvatarUploader from "@/components/storage/AvatarUploader";
import BrazilLocationFields from "@/components/profile/BrazilLocationFields";
import { createClient } from "@/lib/supabase/server";
import { parseProductRole } from "@/lib/auth/validation";
import { updateNotificationPreferencesAction } from "@/lib/account/professional-actions";
import { removeSettingsAvatarAction, saveSettingsLinksAction, saveSettingsProfileAction } from "@/lib/account/settings-actions";
import type { User } from "@/types";

type PrefKey = "social" | "teams" | "projects" | "messages" | "investor_activity" | "saved_project_updates" | "calendar_events";
type NotificationPrefs = Record<PrefKey, boolean>;
const preferenceRows = [
  { key: "social", label: "Social", description: "Seguidores, comentários e menções.", Icon: MessageCircle },
  { key: "teams", label: "Equipes", description: "Convites, tarefas e mudanças.", Icon: Users },
  { key: "projects", label: "Projetos", description: "Atualizações e marcos.", Icon: FolderKanban },
  { key: "calendar_events", label: "Eventos e desafios", description: "Prazos e calendário.", Icon: CalendarDays },
  { key: "messages", label: "Mensagens", description: "Conversas e novas mensagens.", Icon: MessageCircle },
  { key: "investor_activity", label: "Investidores", description: "Interesses e movimentações.", Icon: Sparkles },
  { key: "saved_project_updates", label: "Projetos salvos", description: "Atualizações de projetos acompanhados.", Icon: FolderKanban },
] as const;
const defaultPrefs: NotificationPrefs = {
  social: true, teams: true, projects: true, messages: true,
  investor_activity: true, saved_project_updates: true, calendar_events: true,
};

function Notifications({ prefs, compact = false }: { prefs: NotificationPrefs; compact?: boolean }) {
  const rows = compact ? preferenceRows.slice(0, 4) : preferenceRows;
  return (
    <section className={s.notificationsCard} aria-label="Preferências de notificações">
      <div className={s.notificationsTop}>
        <div>
          <h2><Bell size={20} aria-hidden="true" /> Notificações</h2>
          <p>Escolha quais atividades devem aparecer na sua central.</p>
        </div>
        {compact ? <Link href="/account/settings?section=notifications" className={s.outlineButton}>Gerenciar preferências</Link> : null}
      </div>
      <form action={updateNotificationPreferencesAction}>
        {compact ? preferenceRows.slice(4).map(({ key }) => prefs[key] ? <input type="hidden" name={key} key={key} value="on" /> : null) : null}
        <div className={compact ? s.notificationsGrid : s.notificationFull}>
          {rows.map(({ key, label, description, Icon }) => (
            <label className={s.notificationOption} key={key}>
              <span>
                <strong><Icon size={15} style={{ verticalAlign: "-3px", marginRight: 5 }} aria-hidden="true" />{label}</strong>
                <small>{description}</small>
              </span>
              <span className={s.toggle}>
                <input type="checkbox" name={key} defaultChecked={prefs[key]} aria-label={"Ativar notificações de " + label} />
                <span aria-hidden="true" />
              </span>
            </label>
          ))}
        </div>
        <div className={s.notificationFooter}><button className={s.primaryButton} type="submit"><Check size={15} aria-hidden="true" /> Salvar preferências</button></div>
      </form>
    </section>
  );
}

function AccountOverview() {
  const items = [
    { href: "/account/settings", title: "Perfil", body: "Nome, apresentação, foto e visibilidade.", Icon: UserRound },
    { href: "/account/professional", title: "Perfil profissional", body: "Headline, competências e links profissionais.", Icon: Sparkles },
    { href: "/account/security", title: "Login e segurança", body: "E-mail, senha e sessões conectadas.", Icon: KeyRound },
    { href: "/account/privacy", title: "Privacidade e dados", body: "Exportação, solicitações e controles.", Icon: ShieldCheck },
    { href: "/integrations/github", title: "Integrações", body: "Conecte seu GitHub e gerencie repositórios.", Icon: Github },
    { href: "/account/feedback", title: "Suporte", body: "Envie sugestões e acompanhe solicitações.", Icon: LifeBuoy },
  ] as const;
  return <div className={s.overviewGrid}>{items.map(({ href, title, body, Icon }) =>
    <Link className={s.overviewCard} href={href} key={href}><Icon size={24} aria-hidden="true" /><span><strong>{title}</strong><p>{body}</p></span></Link>
  )}</div>;
}

export default async function AccountSettingsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (authError || !userId) redirect("/login?error=session");

  const [profileResult, prefsResult, complianceResult] = await Promise.all([
    supabase.from("profiles")
      .select("username,display_name,role,avatar_path,bio,public_city,public_state,profile_visibility,allow_messages,github_url,linkedin_url,website_url")
      .eq("id", userId).maybeSingle(),
    supabase.from("notification_preferences")
      .select("social,teams,projects,messages,investor_activity,saved_project_updates,calendar_events")
      .eq("user_id", userId).maybeSingle(),
    supabase.from("account_compliance")
      .select("age_band,guardian_required,guardian_consent_verified_at")
      .eq("user_id", userId).maybeSingle(),
  ]);
  if (profileResult.error || !profileResult.data) redirect("/onboarding");
  const profile = profileResult.data;
  const compliance = complianceResult.data;
  if (compliance?.age_band === "child" && compliance.guardian_required && !compliance.guardian_consent_verified_at) redirect("/guardian");

  const params = await searchParams;
  const section = params.section === "notifications" ? "notifications" : params.section === "account" ? "account" : "profile";
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? params.error : "";
  const restricted = Boolean(compliance?.guardian_required && !compliance?.guardian_consent_verified_at);
  const role = parseProductRole(profile.role);
  const displayName = profile.display_name || profile.username || "Participante Envista";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(value => value[0]?.toUpperCase() || "").join("") || "E";
  const raw = prefsResult.data;
  const prefs: NotificationPrefs = Object.fromEntries(
    (Object.keys(defaultPrefs) as PrefKey[]).map(key => [key, raw?.[key] ?? defaultPrefs[key]])
  ) as NotificationPrefs;
  const user: User = {
    id: userId,
    username: profile.username || "usuario",
    name: displayName,
    role,
    avatar: profile.avatar_path || undefined,
  };
  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 30);
    avatarUrl = data?.signedUrl || null;
  }

  return (
    <LegacySocialShell user={user} role={role} pathname="/account/settings" avatarUrl={avatarUrl}>
      <SettingsWorkspace
        active={section}
        title={section === "notifications" ? "Notificações" : section === "account" ? "Sua conta" : "Perfil"}
        description={section === "notifications"
          ? "Controle quais comunicados e atualizações deseja receber."
          : section === "account"
            ? "Acesse seus dados, controles e recursos de segurança."
            : "Gerencie suas informações públicas, visibilidade e links de perfil."}
      >
        {status ? <div className={s.notice} role="status">
          {status === "profile-saved" ? "Seu perfil foi atualizado." :
            status === "links-saved" ? "Links profissionais atualizados." :
            status === "avatar-removed" ? "Foto de perfil removida." :
            status === "saved" ? "Preferências de notificações salvas." : "Alteração concluída."}
        </div> : null}
        {error ? <div className={s.error} role="alert">
          {error === "username" ? "Este nome de usuário já está em uso." :
            error === "invalid" ? "Confira o nome e o usuário informado." :
            error === "url" ? "Use links HTTPS válidos, sem usuário ou senha no endereço." :
            error === "location" ? "Selecione um estado brasileiro válido." : "Não foi possível salvar. Tente novamente."}
        </div> : null}

        {section === "account" ? <AccountOverview /> : section === "notifications" ? <Notifications prefs={prefs} /> : (
          <>
            <section className={s.identityCard} aria-label="Identidade da conta">
              <span className={s.identityAvatar} aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span>
              <div className={s.identityCopy}>
                <h2>{displayName}</h2>
                <p>@{profile.username || "usuario"} <span className={s.rolePill}>{role === "investor" ? "Investidor" : "Participante"}</span></p>
              </div>
              <div className={s.identityActions}>
                <details className={s.avatarDetails}>
                  <summary>Alterar foto</summary>
                  <div className={s.avatarUploadPanel}><AvatarUploader userId={userId} currentPath={profile.avatar_path} /></div>
                </details>
                {profile.avatar_path ? <form action={removeSettingsAvatarAction}><button className={s.textButton} type="submit">Remover foto</button></form> : null}
              </div>
            </section>

            <form className={s.profileForm} action={saveSettingsProfileAction}>
              <div className={s.columns}>
                <section className={s.formSection} aria-labelledby="settings-profile-fields">
                  <div className={s.sectionTitle}><CircleUserRound size={20} aria-hidden="true" />
                    <div><h2 id="settings-profile-fields">Informações do perfil</h2><p>Dados que representam você no Envista.</p></div>
                  </div>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Nome <span aria-hidden="true">*</span></span>
                    <input type="text" name="display_name" autoComplete="name" required maxLength={100} defaultValue={profile.display_name || ""} />
                  </label>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Nome de usuário <span aria-hidden="true">*</span></span>
                    <input type="text" name="username" autoComplete="username" required minLength={3} maxLength={32}
                      pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" defaultValue={profile.username || ""} />
                    <span className={s.fieldHint}>Usado em links, menções e no perfil público.</span>
                  </label>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Bio</span>
                    <textarea name="bio" maxLength={500} defaultValue={profile.bio || ""} placeholder="Conte o que você faz e está construindo." />
                    <span className={s.fieldHint}>Até 500 caracteres.</span>
                  </label>
                </section>
                <section className={s.formSection} aria-labelledby="settings-visibility">
                  <div className={s.sectionTitle}><Globe2 size={20} aria-hidden="true" />
                    <div><h2 id="settings-visibility">Visibilidade e localização</h2><p>Controle como seu perfil aparece e de onde você é.</p></div>
                  </div>
                  <span className={s.fieldLabel}>Visibilidade do perfil</span>
                  <div className={s.visiblityGrid} role="group" aria-label="Visibilidade do perfil">
                    <label className={s.visibilityOption}>
                      <Globe2 size={18} aria-hidden="true" /><span><strong>Público</strong><small>Para usuários do Envista</small></span>
                      <input name="profile_visibility" type="radio" value="platform"
                        defaultChecked={!restricted && profile.profile_visibility === "platform"} disabled={restricted} />
                    </label>
                    <label className={s.visibilityOption}>
                      <LockKeyhole size={18} aria-hidden="true" /><span><strong>Privado</strong><small>Apenas você</small></span>
                      <input name="profile_visibility" type="radio" value="private"
                        defaultChecked={restricted || profile.profile_visibility !== "platform"} disabled={restricted} />
                    </label>
                  </div>
                  {restricted ? <p className={s.fieldHint}>Por proteção de menores, seu perfil permanece privado enquanto o consentimento do responsável estiver pendente.</p> : null}
                  <div className={s.profileSubSection}>
                    <div className={s.sectionTitle}><MapPin size={19} aria-hidden="true" /><div><h2>Localização</h2><p>Estado e cidade são opcionais.</p></div></div>
                    <BrazilLocationFields defaultCity={profile.public_city || ""} defaultState={profile.public_state || ""}
                      gridClassName={s.locationGroup} fieldClassName={s.field} labelClassName={s.fieldLabel} helperClassName={s.fieldHint} />
                  </div>
                  <div className={s.profileSubSection}>
                    <label className={s.inlineSwitch}>
                      <span>Permitir que outras pessoas iniciem conversas</span>
                      <input type="checkbox" name="allow_messages" defaultChecked={!restricted && profile.allow_messages !== false} disabled={restricted} />
                    </label>
                  </div>
                </section>
              </div>
              <div className={s.profileActions}>
                <Link href="/account/profile" className={s.outlineButton}>Edição avançada do perfil</Link>
                <button type="reset" className={s.secondaryButton}>Cancelar</button>
                <button type="submit" className={s.primaryButton}>Salvar alterações</button>
              </div>
            </form>

            <section className={s.notificationsCard} aria-labelledby="settings-links-title">
              <div className={s.linksTitle}>
                <div className={s.sectionTitle} style={{ marginBottom: 0 }}><Link2 size={20} aria-hidden="true" />
                  <div><h2 id="settings-links-title">Links do perfil</h2><p>Adicione seus perfis e projetos profissionais.</p></div>
                </div>
                <Link href="/account/professional">Editar headline e competências</Link>
              </div>
              <form action={saveSettingsLinksAction}>
                <div className={s.linkList}>
                  <label className={s.linkField}><span><Github size={16} aria-hidden="true" /> GitHub</span><input type="url" name="github_url" defaultValue={profile.github_url || ""} maxLength={500} placeholder="https://github.com/..." /></label>
                  <label className={s.linkField}><span><Users size={16} aria-hidden="true" /> LinkedIn</span><input type="url" name="linkedin_url" defaultValue={profile.linkedin_url || ""} maxLength={500} placeholder="https://linkedin.com/in/..." /></label>
                  <label className={s.linkField}><span><Globe2 size={16} aria-hidden="true" /> Site pessoal</span><input type="url" name="website_url" defaultValue={profile.website_url || ""} maxLength={500} placeholder="https://..." /></label>
                </div>
                <div className={s.linkActions}><button className={s.outlineButton} type="submit">Salvar links</button></div>
              </form>
            </section>
            <Notifications prefs={prefs} compact />
          </>
        )}
      </SettingsWorkspace>
    </LegacySocialShell>
  );
}
