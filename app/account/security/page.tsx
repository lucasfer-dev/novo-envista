import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Mail, MonitorSmartphone, ShieldCheck } from "lucide-react";
import AccountProductShell from "@/components/account/AccountProductShell";
import { authStyles as styles } from "@/components/auth/AuthShell";
import suite from "@/components/product/ProfessionalSuite.module.css";
import { createClient } from "@/lib/supabase/server";
import { signOutEverywhereAction } from "@/lib/account/professional-actions";
import {
  signOutOtherDevicesAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
} from "@/lib/account/security-actions";

type SessionRow = {
  session_id: string;
  created_at: string | null;
  last_active_at: string | null;
  user_agent: string | null;
  is_current: boolean;
};

function describeUserAgent(userAgent: string | null) {
  const ua = userAgent || "";
  const browser = /Edg\//i.test(ua)
    ? "Microsoft Edge"
    : /Firefox\//i.test(ua)
      ? "Firefox"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "Navegador";

  const os = /Windows NT/i.test(ua)
    ? "Windows"
    : /Android/i.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS/iPadOS"
        : /Mac OS X/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "dispositivo desconhecido";

  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "Dispositivo móvel" : "Computador";
  return { title: `${browser} em ${os}`, device };
}

function formatDate(value: string | null) {
  if (!value) return "Horário indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function statusMessage(status: string) {
  switch (status) {
    case "email-pending":
      return "Solicitação enviada. Confirme a alteração pelos e-mails enviados pelo Envista antes que o novo endereço passe a valer.";
    case "password-updated":
      return "Senha atualizada com sucesso.";
    case "other-sessions-ended":
      return "As outras sessões foram encerradas. Este dispositivo continua conectado.";
    default:
      return "";
  }
}

function errorMessage(error: string) {
  switch (error) {
    case "invalid-email": return "Digite um e-mail válido.";
    case "same-email": return "Esse já é o e-mail atual da conta.";
    case "email-update": return "Não foi possível alterar o e-mail. Tente novamente em instantes.";
    case "weak-password": return "A nova senha precisa ter pelo menos 12 caracteres.";
    case "password-mismatch": return "A confirmação da nova senha não confere.";
    case "current-password": return "Informe sua senha atual.";
    case "password-update": return "Não foi possível alterar a senha. Confira a senha atual e os requisitos de segurança.";
    case "signout-others": return "Não foi possível encerrar as outras sessões.";
    default: return "Não foi possível concluir a alteração.";
  }
}

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=session");

  const [{ data: userData, error: userError }, { data: sessionsData, error: sessionsError }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("list_my_auth_sessions"),
    supabase.from("profiles").select("username,display_name,role,avatar_path").eq("id", userId).maybeSingle(),
  ]);

  if (userError || !userData.user) redirect("/login?error=session");
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? params.error : "";
  const sessions = (sessionsData ?? []) as SessionRow[];
  const home = profile.role === "investor" ? "/investor" : "/home";

  return (
    <AccountProductShell
      userId={userId}
      profile={profile}
      pathname="/account/security"
      title="Login e segurança"
      description="Gerencie seu e-mail, senha e os dispositivos conectados à sua conta."
    >
      {status ? <div className={styles.success}>{statusMessage(status)}</div> : null}
      {error ? <div className={styles.error}>{errorMessage(error)}</div> : null}

      <div className={styles.formSection}>
        <div className={styles.sectionHeading}><Mail size={18} /><strong>E-mail da conta</strong></div>
        <p className={styles.muted}>E-mail atual: <strong style={{ color: "#dfe8ef" }}>{userData.user.email || "Não informado"}</strong></p>
        <form action={updateAccountEmailAction} className={styles.form}>
          <label>Novo e-mail<input type="email" name="email" autoComplete="email" maxLength={254} placeholder="novo@email.com" required /></label>
          <div className={styles.actions}><button className={styles.primary} type="submit">Alterar e-mail</button></div>
        </form>
        <p className={styles.muted}>Por segurança, a alteração pode exigir confirmação no endereço atual e no novo endereço.</p>
      </div>

      <div className={styles.divider} />

      <div className={styles.formSection}>
        <div className={styles.sectionHeading}><KeyRound size={18} /><strong>Alterar senha</strong></div>
        <form action={updateAccountPasswordAction} className={styles.form}>
          <label>Senha atual<input type="password" name="current_password" autoComplete="current-password" maxLength={200} required /></label>
          <div className={styles.grid2}>
            <label>Nova senha<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={200} required /></label>
            <label>Confirmar nova senha<input type="password" name="confirm_password" autoComplete="new-password" minLength={12} maxLength={200} required /></label>
          </div>
          <div className={styles.actions}><button className={styles.primary} type="submit">Atualizar senha</button></div>
        </form>
      </div>

      <div className={styles.divider} />

      <div className={styles.formSection}>
        <div className={styles.sectionHeading}><MonitorSmartphone size={18} /><strong>Dispositivos conectados</strong></div>
        <p className={styles.muted}>Cada cartão representa uma sessão ativa da sua conta. A sessão marcada como “Este dispositivo” é a que você está usando agora.</p>

        {sessionsError ? (
          <div className={styles.error}>Não foi possível carregar as sessões da conta.</div>
        ) : sessions.length === 0 ? (
          <div className={styles.notice}>Nenhuma sessão ativa foi encontrada além do estado atual de autenticação.</div>
        ) : (
          <div className={suite.settingsGrid}>
            {sessions.map((session) => {
              const device = describeUserAgent(session.user_agent);
              return (
                <div key={session.session_id} className={suite.settingCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <MonitorSmartphone size={19} />
                    {session.is_current ? <span className={styles.status}>Este dispositivo</span> : <span className={styles.status}>Sessão ativa</span>}
                  </div>
                  <h3>{device.title}</h3>
                  <p>{device.device}</p>
                  <p style={{ marginTop: 8 }}>Última atividade: {formatDate(session.last_active_at)}</p>
                  <p>Conectado desde: {formatDate(session.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.actions} style={{ marginTop: 4 }}>
          <form action={signOutOtherDevicesAction}><button className={styles.secondary} type="submit">Sair dos outros dispositivos</button></form>
          <form action={signOutEverywhereAction}><button className={styles.secondary} type="submit">Sair de todos os dispositivos</button></form>
        </div>
        <p className={styles.muted}>Sessões encerradas podem continuar usando um token de acesso já emitido até ele expirar; novos refreshes deixam de funcionar.</p>
      </div>

      <div className={styles.divider} />
      <div className={styles.actions}>
        <Link className={styles.secondary} href="/account/settings"><ShieldCheck size={15} /> Configurações</Link>
        <Link className={styles.secondary} href={home}>Voltar ao Envista</Link>
      </div>
    </AccountProductShell>
  );
}
