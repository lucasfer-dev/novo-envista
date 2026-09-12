import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

type WindowMetrics = {
  users: number;
  teams: number;
  projects: number;
  posts: number;
  project_saves: number;
  project_interests: number;
  course_enrollments: number;
  lesson_completions: number;
  content_reports?: number;
  message_reports?: number;
};

type ActivationFunnel = {
  onboarding_completed: number;
  project_created: number;
  team_created: number;
  course_started: number;
  course_completed: number;
  investor_verification_requested: number;
  investor_interest_created: number;
  message_started: number;
};

type ProductMetrics = {
  generated_at: string;
  totals: WindowMetrics & {
    participants: number;
    investors: number;
    open_content_reports: number;
    open_message_reports: number;
  };
  activation_funnel: ActivationFunnel;
  last_30_days: WindowMetrics;
  last_7_days: WindowMetrics;
};

function pct(part: number, whole: number) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function metric(label: string, value: number | string, detail: string) {
  return { label, value, detail };
}

export default async function AdminAnalyticsPage() {
  const { supabase, profile } = await requireAdminUser();
  const { data, error } = await supabase.rpc("admin_product_metrics");
  const metrics = data as ProductMetrics | null;

  if (error || !metrics) {
    return (
      <AdminShell profile={profile} title="Analytics">
        <div className={styles.head}><div><h1>Analytics operacional</h1><p className={styles.muted}>Indicadores derivados diretamente do banco do Envista.</p></div></div>
        <div className={styles.error}>Não foi possível carregar os indicadores agora.</div>
      </AdminShell>
    );
  }

  const totalReports = metrics.totals.open_content_reports + metrics.totals.open_message_reports;
  const funnel = metrics.activation_funnel;
  const overview = [
    metric("Usuários", metrics.totals.users, `${metrics.totals.participants} participantes · ${metrics.totals.investors} investidores`),
    metric("Projetos", metrics.totals.projects, `${pct(metrics.totals.projects, metrics.totals.participants)} por participante cadastrado`),
    metric("Equipes", metrics.totals.teams, `${pct(metrics.totals.teams, metrics.totals.participants)} por participante cadastrado`),
    metric("Posts", metrics.totals.posts, `${metrics.last_30_days.posts} nos últimos 30 dias`),
    metric("Projetos salvos", metrics.totals.project_saves, `${metrics.last_30_days.project_saves} nos últimos 30 dias`),
    metric("Interesses", metrics.totals.project_interests, `${metrics.last_30_days.project_interests} nos últimos 30 dias`),
    metric("Matrículas", metrics.totals.course_enrollments, `${metrics.last_30_days.course_enrollments} nos últimos 30 dias`),
    metric("Denúncias abertas", totalReports, `${metrics.totals.open_content_reports} conteúdo · ${metrics.totals.open_message_reports} mensagens`),
  ];

  const rows = [
    ["Novos usuários", metrics.last_7_days.users, metrics.last_30_days.users],
    ["Novas equipes", metrics.last_7_days.teams, metrics.last_30_days.teams],
    ["Novos projetos", metrics.last_7_days.projects, metrics.last_30_days.projects],
    ["Publicações", metrics.last_7_days.posts, metrics.last_30_days.posts],
    ["Projetos salvos", metrics.last_7_days.project_saves, metrics.last_30_days.project_saves],
    ["Interesses enviados", metrics.last_7_days.project_interests, metrics.last_30_days.project_interests],
    ["Matrículas em cursos", metrics.last_7_days.course_enrollments, metrics.last_30_days.course_enrollments],
    ["Aulas concluídas", metrics.last_7_days.lesson_completions, metrics.last_30_days.lesson_completions],
  ] as const;

  const funnelRows = [
    ["Concluíram onboarding", funnel.onboarding_completed, pct(funnel.onboarding_completed, metrics.totals.users)],
    ["Criaram projeto", funnel.project_created, pct(funnel.project_created, funnel.onboarding_completed)],
    ["Criaram equipe", funnel.team_created, pct(funnel.team_created, funnel.onboarding_completed)],
    ["Iniciaram curso", funnel.course_started, pct(funnel.course_started, funnel.onboarding_completed)],
    ["Concluíram curso", funnel.course_completed, pct(funnel.course_completed, funnel.course_started)],
    ["Pediram verificação de investidor", funnel.investor_verification_requested, pct(funnel.investor_verification_requested, metrics.totals.investors)],
    ["Demonstraram interesse", funnel.investor_interest_created, pct(funnel.investor_interest_created, metrics.totals.investors)],
    ["Iniciaram conversa", funnel.message_started, pct(funnel.message_started, funnel.onboarding_completed)],
  ] as const;

  return (
    <AdminShell profile={profile} title="Analytics">
      <div className={styles.head}>
        <div>
          <h1>Analytics operacional</h1>
          <p className={styles.muted}>Métricas agregadas do produto, sem fingerprint, IP, conteúdo privado ou rastreamento de cliques.</p>
        </div>
        <span className={styles.pill}>Atualizado {new Date(metrics.generated_at).toLocaleString("pt-BR")}</span>
      </div>

      <div className={styles.metrics}>
        {overview.map((item) => (
          <div className={styles.metric} key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <div className={styles.muted} style={{ marginTop: 6, fontSize: 12 }}>{item.detail}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Ativação do ecossistema</h2>
          <div className={styles.stack}>
            <div><strong>{pct(metrics.totals.projects, metrics.totals.participants)}</strong><div className={styles.muted}>relação projetos / participantes</div></div>
            <div><strong>{pct(metrics.totals.project_saves, metrics.totals.projects)}</strong><div className={styles.muted}>relação salvamentos / projetos</div></div>
            <div><strong>{pct(metrics.totals.project_interests, metrics.totals.projects)}</strong><div className={styles.muted}>relação interesses / projetos</div></div>
            <div><strong>{pct(metrics.totals.lesson_completions, metrics.totals.course_enrollments)}</strong><div className={styles.muted}>aulas concluídas por matrícula</div></div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Saúde operacional</h2>
          <div className={styles.stack}>
            <div><strong>{totalReports}</strong><div className={styles.muted}>denúncias aguardando análise</div></div>
            <div><strong>{metrics.last_30_days.content_reports ?? 0}</strong><div className={styles.muted}>denúncias de conteúdo em 30 dias</div></div>
            <div><strong>{metrics.last_30_days.message_reports ?? 0}</strong><div className={styles.muted}>denúncias de mensagem em 30 dias</div></div>
          </div>
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 18 }}>
        <h2>Funil de ativação</h2>
        <p className={styles.muted}>Usuários únicos derivados de ações realmente persistidas no banco. A porcentagem usa como base a etapa relevante anterior.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Marco</th><th>Usuários únicos</th><th>Conversão</th></tr></thead>
            <tbody>{funnelRows.map(([label, count, conversion]) => <tr key={label}><td>{label}</td><td>{count}</td><td>{conversion}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.card} style={{ marginTop: 18 }}>
        <h2>Movimento recente</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Indicador</th><th>7 dias</th><th>30 dias</th></tr></thead>
            <tbody>{rows.map(([label, week, month]) => <tr key={label}><td>{label}</td><td>{week}</td><td>{month}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
