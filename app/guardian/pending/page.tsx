import Link from "next/link";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { continueProtectedModeAction } from "@/app/guardian/actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import GuardianShareLink from "@/components/guardian/GuardianShareLink";
import flowStyles from "@/components/guardian/GuardianFlow.module.css";
import { homeForRole, parseProductRole, pathAllowedForRole, safeInternalPath } from "@/lib/auth/validation";
import { resolveSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";

export default async function GuardianPendingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim().slice(0, 256) : "";
  const requestedNext = typeof params.next === "string" ? safeInternalPath(params.next, "/onboarding") : "/onboarding";
  if (!token) redirect("/guardian");

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
  const fallback = homeForRole(role);
  const next = pathAllowedForRole(requestedNext, role) ? requestedNext : fallback;

  if (!compliance.guardian_required || compliance.guardian_consent_verified_at) {
    redirect(completion ? next : "/onboarding");
  }

  const confirmUrl = resolveSiteUrl() + "/guardian/confirm?token=" + encodeURIComponent(token);
  const adolescent = compliance.age_band === "adolescent";

  return (
    <AuthShell
      title="Agora é com seu responsável"
      description="Envie o link abaixo. Assim que a confirmação for concluída, as áreas protegidas são liberadas."
    >
      <div className={flowStyles.formIntro}>
        <Send size={20} />
        <span>Envie este link diretamente para seu responsável. Ele abre a página, confere os dados e faz a declaração — sem precisar criar perfil no Envista.</span>
      </div>

      <GuardianShareLink url={confirmUrl} />

      <div className={flowStyles.pendingSteps}>
        <div className={flowStyles.pendingStep}><b>1</b><span><strong>Envie o link</strong><span>Compartilhe somente com o responsável informado.</span></span></div>
        <div className={flowStyles.pendingStep}><b>2</b><span><strong>Responsável confirma</strong><span>Ele informa o CPF e confirma o vínculo legal.</span></span></div>
        <div className={flowStyles.pendingStep}><b>3</b><span><strong>Envista libera</strong><span>Social e Mensagens deixam de mostrar o bloqueio assim que você atualizar a página.</span></span></div>
      </div>

      <div className={styles.actions}>
        <Link
          className={styles.primary}
          href={"/guardian/pending?token=" + encodeURIComponent(token) + "&next=" + encodeURIComponent(requestedNext)}
        >
          <CheckCircle2 size={16} /> Já confirmou? Atualizar
        </Link>
        <Link className={styles.secondary} href="/guardian">Gerar outro link</Link>
      </div>

      <ul className={flowStyles.modeList}>
        <li><ShieldCheck size={16} /> O código do link é de uso único e expira automaticamente.</li>
      </ul>

      {adolescent && !compliance.protected_mode_started_at ? (
        <>
          <div className={styles.divider} />
          <form action={continueProtectedModeAction}>
            <button className={styles.secondary + " " + styles.full} type="submit">Continuar no modo protegido enquanto aguardo</button>
          </form>
        </>
      ) : completion ? (
        <div className={styles.links}><Link href={fallback}>Voltar ao Envista</Link></div>
      ) : null}
    </AuthShell>
  );
}
