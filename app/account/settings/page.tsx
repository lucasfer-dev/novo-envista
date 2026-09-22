import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CalendarDays, CircleUserRound, Database, LifeBuoy, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import AccountProductShell from "@/components/account/AccountProductShell";
import { authStyles as styles } from "@/components/auth/AuthShell";
import suite from "@/components/product/ProfessionalSuite.module.css";
import { createClient } from "@/lib/supabase/server";
import { signOutEverywhereAction, updateNotificationPreferencesAction } from "@/lib/account/professional-actions";

export default async function AccountSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("username,display_name,role,avatar_path").eq("id", userId).maybeSingle(),
    supabase.from("notification_preferences").select("social,teams,projects,messages,investor_activity,saved_project_updates,calendar_events").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const home = profile.role === "investor" ? "/investor" : "/home";
  const defaults = prefs ?? { social: true, teams: true, projects: true, messages: true, investor_activity: true, saved_project_updates: true, calendar_events: true };

  return (
    <AccountProductShell
      userId={userId}
      profile={profile}
      pathname="/account/settings"
      title="Configurações"
      description="Conta, privacidade, notificações e segurança em um só lugar."
    >
      {params.status === "saved" ? <div className={styles.success}>Preferências atualizadas.</div> : null}
      {params.error ? <div className={styles.error}>Não foi possível salvar as alterações.</div> : null}

      <div className={suite.settingsGrid}>
        <Link className={suite.settingCard} href="/account/profile"><CircleUserRound size={20} /><h3>Perfil</h3><p>Nome, bio, avatar, localização e visibilidade.</p></Link>
        <Link className={suite.settingCard} href="/account/security"><LockKeyhole size={20} /><h3>Login e segurança</h3><p>E-mail, senha e dispositivos conectados à sua conta.</p></Link>
        <Link className={suite.settingCard} href="/account/professional"><Sparkles size={20} /><h3>Perfil profissional</h3><p>Headline, skills, GitHub, LinkedIn e site pessoal.</p></Link>
        <Link className={suite.settingCard} href="/account/privacy"><ShieldCheck size={20} /><h3>Privacidade e dados</h3><p>Exportação, visibilidade e controles de dados.</p></Link>
        <Link className={suite.settingCard} href="/account/feedback"><LifeBuoy size={20} /><h3>Suporte e feedback</h3><p>Reporte problemas, envie ideias e acompanhe solicitações.</p></Link>
      </div>

      <div className={styles.divider} />
      <h2 style={{ fontSize: 18, marginBottom: 6 }}><Bell size={18} style={{ verticalAlign: "-3px" }} /> Notificações</h2>
      <p className={styles.muted}>Escolha quais tipos de atividade devem aparecer na sua central.</p>
      <form action={updateNotificationPreferencesAction} className={styles.form}>
        <div className={styles.checks}>
          <label className={styles.check}><input type="checkbox" name="social" defaultChecked={defaults.social} /><span>Social: seguidores, comentários e publicações relacionadas.</span></label>
          <label className={styles.check}><input type="checkbox" name="teams" defaultChecked={defaults.teams} /><span>Equipes: convites, tarefas e mudanças de equipe.</span></label>
          <label className={styles.check}><input type="checkbox" name="projects" defaultChecked={defaults.projects} /><span>Projetos: atualizações, marcos e atividade dos seus projetos.</span></label>
          <label className={styles.check}><input type="checkbox" name="messages" defaultChecked={defaults.messages} /><span>Mensagens diretas.</span></label>
          <label className={styles.check}><input type="checkbox" name="investor_activity" defaultChecked={defaults.investor_activity} /><span>Interesses e movimentações de investidores.</span></label>
          <label className={styles.check}><input type="checkbox" name="saved_project_updates" defaultChecked={defaults.saved_project_updates} /><span>Atualizações de projetos que você salvou.</span></label>
          <label className={styles.check}><input type="checkbox" name="calendar_events" defaultChecked={defaults.calendar_events} /><span><CalendarDays size={15} style={{ verticalAlign: "-2px" }} /> Resumo semanal de eventos, competições e prazos do calendário.</span></label>
        </div>
        <button className={styles.primary} type="submit">Salvar notificações</button>
      </form>

      <div className={styles.divider} />
      <h2 style={{ fontSize: 18, marginBottom: 6 }}><LockKeyhole size={18} style={{ verticalAlign: "-3px" }} /> Segurança</h2>
      <p className={styles.muted}>Gerencie e-mail, senha e sessões na área de Login e segurança. Se você suspeitar de acesso indevido, também pode encerrar tudo imediatamente.</p>
      <div className={styles.actions}>
        <Link className={styles.secondary} href="/account/security">Gerenciar login e dispositivos</Link>
        <form action={signOutEverywhereAction}><button className={styles.secondary} type="submit">Sair de todos os dispositivos</button></form>
      </div>
      <div className={styles.actions} style={{ marginTop: 18 }}>
        <Link className={styles.secondary} href={home}>Voltar ao Envista</Link>
        <Link className={styles.secondary} href="/account/privacy"><Database size={15} /> Meus dados</Link>
      </div>
    </AccountProductShell>
  );
}
