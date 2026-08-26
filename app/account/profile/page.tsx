import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import AvatarUploader from "@/components/storage/AvatarUploader";
import { profileUpdateAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";

export default async function AccountProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: compliance }, { data: completion }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username,display_name,role,avatar_path,bio,public_city,public_state,public_school,organization,organization_type,profile_visibility,allow_messages")
      .eq("id", userId)
      .single(),
    supabase.from("account_compliance").select("age_band,guardian_consent_verified_at").eq("user_id", userId).single(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !compliance || !completion) redirect("/onboarding");
  if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) redirect("/guardian-required");

  const params = await searchParams;
  const saved = params.status === "saved";
  const error = typeof params.error === "string" ? params.error : "";
  const isChild = compliance.age_band === "child";
  const home = homeForRole(parseProductRole(profile.role));

  return (
    <AuthShell wide title="Meu perfil" description="Esses dados já são persistidos no Supabase. Você controla o que aparece para outras pessoas.">
      {saved ? <div className={styles.success}>Perfil atualizado.</div> : null}
      {error ? <div className={styles.error}>{error === "username" ? "Esse nome de usuário já está em uso." : "Não foi possível salvar as alterações."}</div> : null}
      <AvatarUploader userId={userId} currentPath={profile.avatar_path} />
      <form action={profileUpdateAction} className={styles.form}>
        <div className={styles.grid2}>
          <label>Nome de exibição<input name="display_name" defaultValue={profile.display_name} maxLength={100} required /></label>
          <label>Nome de usuário<input name="username" defaultValue={profile.username} minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}" required /></label>
        </div>
        <label>Bio<textarea name="bio" defaultValue={profile.bio || ""} maxLength={500} /></label>
        {profile.role === "participant" ? (
          <div className={styles.grid2}>
            <label>Escola/instituição<input name="public_school" defaultValue={profile.public_school || ""} maxLength={160} /></label>
            <label>Cidade<input name="public_city" defaultValue={profile.public_city || ""} maxLength={100} /></label>
            <label>Estado<input name="public_state" defaultValue={profile.public_state || ""} maxLength={100} /></label>
          </div>
        ) : (
          <div className={styles.grid2}>
            <label>Organização<input name="organization" defaultValue={profile.organization || ""} maxLength={160} /></label>
            <label>Tipo de organização<input name="organization_type" defaultValue={profile.organization_type || ""} maxLength={100} /></label>
          </div>
        )}
        <div className={styles.divider} />
        <label>Visibilidade do perfil<select name="profile_visibility" defaultValue={profile.profile_visibility} disabled={isChild}><option value="private">Privado</option>{!isChild ? <option value="platform">Visível para usuários autenticados</option> : null}</select></label>
        {isChild ? <input type="hidden" name="profile_visibility" value="private" /> : null}
        <label className={styles.check}><input type="checkbox" name="allow_messages" defaultChecked={profile.allow_messages} disabled={isChild} /><span>{isChild ? "Mensagens permanecem desativadas para esta faixa etária." : "Permitir que outros usuários autenticados iniciem uma conversa comigo."}</span></label>
        <div className={styles.actions}><button className={styles.primary} type="submit">Salvar perfil</button><Link className={styles.secondary} href="/account/privacy">Privacidade e meus dados</Link><Link className={styles.secondary} href={home}>Voltar ao Envista</Link></div>
      </form>
    </AuthShell>
  );
}
