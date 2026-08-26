import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminUserDetail({ params }: { params: Promise<{ userId: string }> }) {
  const { supabase, profile: adminProfile } = await requireAdminUser();
  const { userId } = await params;

  const [{ data: target }, { data: compliance }, { data: memberships }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,role,bio,public_city,public_state,public_school,organization,organization_type,profile_visibility,allow_messages,created_at").eq("id", userId).maybeSingle(),
    supabase.from("account_compliance").select("age_band,guardian_consent_verified_at,age_declared_at").eq("user_id", userId).maybeSingle(),
    supabase.from("team_members").select("team_id,role_label,access_level,joined_at").eq("user_id", userId).order("joined_at", { ascending: false }),
    supabase.from("projects").select("id,slug,title,stage,visibility,created_at").eq("owner_user_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);

  if (!target) notFound();
  const teamIds = (memberships ?? []).map((item: any) => item.team_id);
  let teams: any[] = [];
  if (teamIds.length) {
    const { data } = await supabase.from("teams").select("id,name,slug,visibility").in("id", teamIds);
    teams = data ?? [];
  }
  const teamMap = new Map(teams.map((team: any) => [team.id, team]));

  return (
    <AdminShell profile={adminProfile} title="Perfil">
      <div className={styles.head}>
        <div><h1>{target.display_name}</h1><p className={styles.muted}>@{target.username} · {target.role === "participant" ? "Participante" : "Investidor"}</p></div>
        <Link className={styles.secondary} href="/admin/users">Voltar</Link>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Perfil</h2>
          <p>{target.bio || "Sem bio."}</p>
          <div className={styles.stack}>
            <span><strong>Visibilidade:</strong> {target.profile_visibility}</span>
            <span><strong>Mensagens:</strong> {target.allow_messages ? "permitidas" : "bloqueadas"}</span>
            <span><strong>Local:</strong> {[target.public_city, target.public_state].filter(Boolean).join(" / ") || "—"}</span>
            <span><strong>Escola:</strong> {target.public_school || "—"}</span>
            <span><strong>Organização:</strong> {target.organization || "—"}</span>
            <span><strong>Tipo de organização:</strong> {target.organization_type || "—"}</span>
          </div>
        </section>
        <section className={styles.card}>
          <h2>Conformidade</h2>
          <div className={styles.stack}>
            <span><strong>Faixa etária:</strong> {compliance?.age_band ?? "—"}</span>
            <span><strong>Responsável verificado:</strong> {compliance?.guardian_consent_verified_at ? "Sim" : "Não"}</span>
            <span><strong>Conta criada:</strong> {new Date(target.created_at).toLocaleString("pt-BR")}</span>
          </div>
        </section>
      </div>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Equipes</h2>
        {(memberships ?? []).length === 0 ? <div className={styles.empty}>Não participa de equipes.</div> : (
          <div className={styles.stack}>
            {(memberships ?? []).map((membership: any) => {
              const team: any = teamMap.get(membership.team_id);
              return <div key={membership.team_id}><Link href={`/admin/teams/${membership.team_id}`}><strong>{team?.name ?? membership.team_id}</strong></Link><div className={styles.muted}>{membership.role_label || "Membro"} · {membership.access_level}</div></div>;
            })}
          </div>
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Projetos pessoais</h2>
        {(projects ?? []).length === 0 ? <div className={styles.empty}>Nenhum projeto pessoal.</div> : (
          <div className={styles.stack}>{(projects ?? []).map((project: any) => <div key={project.id}><strong>{project.title}</strong><div className={styles.muted}>{project.stage} · {project.visibility}</div></div>)}</div>
        )}
      </section>
    </AdminShell>
  );
}
