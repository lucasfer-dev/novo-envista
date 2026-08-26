import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminTeamDetail({ params }: { params: Promise<{ teamId: string }> }) {
  const { supabase, profile } = await requireAdminUser();
  const { teamId } = await params;

  const [{ data: team }, { data: members }, { data: projects }] = await Promise.all([
    supabase.from("teams").select("id,slug,name,description,category,city,institution,tags,visibility,owner_id,created_at,updated_at").eq("id", teamId).maybeSingle(),
    supabase.from("team_members").select("user_id,role_label,access_level,joined_at").eq("team_id", teamId).order("joined_at", { ascending: true }),
    supabase.from("projects").select("id,title,stage,visibility,created_at").eq("owner_team_id", teamId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!team) notFound();

  const userIds = [...new Set((members ?? []).map((member: any) => member.user_id))];
  let people: any[] = [];
  if (userIds.length) {
    const { data } = await supabase.from("profiles").select("id,username,display_name,role").in("id", userIds);
    people = data ?? [];
  }
  const peopleMap = new Map(people.map((person: any) => [person.id, person]));

  return (
    <AdminShell profile={profile} title="Equipe">
      <div className={styles.head}>
        <div><h1>{team.name}</h1><p className={styles.muted}>{team.institution || "Sem instituição"} · {team.visibility}</p></div>
        <Link className={styles.secondary} href="/admin/teams">Voltar</Link>
      </div>

      <section className={styles.card}>
        <h2>Informações</h2>
        <p>{team.description || "Sem descrição."}</p>
        <div className={styles.stack}>
          <span><strong>Categoria:</strong> {team.category || "—"}</span>
          <span><strong>Cidade:</strong> {team.city || "—"}</span>
          <span><strong>Tags:</strong> {(team.tags ?? []).join(", ") || "—"}</span>
          <span><strong>Criada em:</strong> {new Date(team.created_at).toLocaleString("pt-BR")}</span>
        </div>
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Membros</h2>
        {(members ?? []).length === 0 ? <div className={styles.empty}>Nenhum membro.</div> : (
          <div className={styles.stack}>{(members ?? []).map((member: any) => {
            const person: any = peopleMap.get(member.user_id);
            return <div key={member.user_id}>{person ? <Link href={`/admin/users/${person.id}`}><strong>{person.display_name}</strong> <span className={styles.muted}>@{person.username}</span></Link> : <strong>{member.user_id}</strong>}<div className={styles.muted}>{member.role_label || "Membro"} · {member.access_level}</div></div>;
          })}</div>
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Projetos da equipe</h2>
        {(projects ?? []).length === 0 ? <div className={styles.empty}>Nenhum projeto.</div> : <div className={styles.stack}>{(projects ?? []).map((project: any) => <div key={project.id}><strong>{project.title}</strong><div className={styles.muted}>{project.stage} · {project.visibility}</div></div>)}</div>}
      </section>
    </AdminShell>
  );
}
