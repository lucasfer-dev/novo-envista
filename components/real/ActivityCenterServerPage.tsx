import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import styles from "@/components/product/ProfessionalSuite.module.css";

function formatRelative(value: string) {
  const time = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(value).toLocaleDateString("pt-BR");
}

export async function ActivityCenterServerPage({ expectedRole, pathname }: { expectedRole: ProductRole; pathname: string }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const prefix = expectedRole === "investor" ? "/investor" : "/app";
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,kind,title,body,href,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  const rows = notifications ?? [];
  const unread = rows.filter((item: any) => !item.read_at).length;
  const kinds = new Set(rows.map((item: any) => item.kind)).size;

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={pathname}>
      <div className="page-head">
        <div><h1>Central de atividade</h1><p>Tudo o que mudou em projetos, equipes, conversas e conexões em uma linha do tempo única.</p></div>
        <Link className="secondary" href={`${prefix}/notifications`}>Gerenciar notificações</Link>
      </div>
      <div className={styles.grid}>
        <div className={styles.metric}><b>{unread}</b><span>não lidas</span></div>
        <div className={styles.metric}><b>{rows.length}</b><span>eventos recentes</span></div>
        <div className={styles.metric}><b>{kinds}</b><span>tipos de atividade</span></div>
      </div>
      <section className="section-block">
        <div className="section-row"><div><h2>Timeline</h2><p>Mais recentes primeiro.</p></div></div>
        {rows.length ? (
          <div className={styles.activityList}>
            {rows.map((item: any) => (
              <Link key={item.id} href={item.href || `${prefix}/notifications`} className={styles.activityItem} data-read={Boolean(item.read_at)}>
                <span className={styles.activityDot} aria-hidden="true" />
                <span><strong>{item.title}</strong><small>{item.body || item.kind}</small></span>
                <time dateTime={item.created_at}>{formatRelative(item.created_at)}</time>
              </Link>
            ))}
          </div>
        ) : <div className="empty"><h3>Nada novo por aqui</h3><p>Quando houver atividade nos seus projetos, equipes ou conexões, ela aparecerá aqui.</p><Link className="secondary" href={`${prefix}/explore`}>Explorar o Envista</Link></div>}
      </section>
    </LegacySocialShell>
  );
}
