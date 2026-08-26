import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { registerTeamCompetitionAdminAction, unregisterTeamCompetitionAdminAction, updateCompetitionAdminAction } from "@/lib/admin/competition-actions";

function dateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export default async function AdminCompetitionDetail({ params, searchParams }: { params: Promise<{ competitionId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, profile } = await requireAdminUser();
  const { competitionId } = await params;
  const query = await searchParams;

  const [{ data: competition }, { data: registrations }, { data: teams }] = await Promise.all([
    supabase.from("competitions").select("*").eq("id", competitionId).maybeSingle(),
    supabase.from("competition_team_registrations").select("competition_id,team_id,registered_at,note").eq("competition_id", competitionId).order("registered_at", { ascending: false }),
    supabase.from("teams").select("id,name,slug,institution,visibility,owner_id").order("name", { ascending: true }).limit(1000),
  ]);
  if (!competition) notFound();

  const registeredIds = new Set((registrations ?? []).map((item: any) => item.team_id));
  const teamMap = new Map((teams ?? []).map((team: any) => [team.id, team]));
  const availableTeams = (teams ?? []).filter((team: any) => !registeredIds.has(team.id));
  const status = typeof query.status === "string" ? query.status : "";
  const error = typeof query.error === "string" ? query.error : "";

  return (
    <AdminShell profile={profile} title="Competição">
      <div className={styles.head}>
        <div><h1>{competition.title}</h1><p className={styles.muted}>{competition.organizer} · <span className={styles.pill}>{competition.status}</span></p></div>
        <Link className={styles.secondary} href="/admin/competitions">Voltar</Link>
      </div>
      {status ? <div className={styles.notice}>Alteração salva.</div> : null}
      {error ? <div className={styles.error}>{error === "registration" ? "Não foi possível alterar a inscrição. Verifique duplicidade ou limite de equipes." : "Não foi possível salvar a competição."}</div> : null}

      <div className={styles.metrics}>
        <div className={styles.metric}><strong>{(registrations ?? []).length}</strong><span>Equipes inscritas</span></div>
        <div className={styles.metric}><strong>{competition.max_teams ?? "∞"}</strong><span>Limite de equipes</span></div>
        <div className={styles.metric}><strong>{competition.starts_at ? new Date(competition.starts_at).toLocaleDateString("pt-BR") : "—"}</strong><span>Início</span></div>
      </div>

      <section className={styles.card}>
        <h2>Editar competição</h2>
        <form action={updateCompetitionAdminAction} className={styles.form}>
          <input type="hidden" name="competition_id" value={competition.id} />
          <label>Título<input name="title" defaultValue={competition.title} maxLength={160} required /></label>
          <label>Slug<input name="slug" defaultValue={competition.slug} maxLength={120} required /></label>
          <label>Resumo<textarea name="summary" defaultValue={competition.summary} maxLength={500} rows={3} /></label>
          <label>Descrição<textarea name="description" defaultValue={competition.description} maxLength={12000} rows={7} /></label>
          <div className={styles.grid}>
            <label>Organizador<input name="organizer" defaultValue={competition.organizer} maxLength={160} required /></label>
            <label>Formato<input name="format" defaultValue={competition.format} maxLength={120} /></label>
            <label>Local<input name="location" defaultValue={competition.location} maxLength={220} /></label>
            <label>Status<select name="status" defaultValue={competition.status}><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="closed">Encerrada</option><option value="archived">Arquivada</option></select></label>
            <label>Máximo de equipes<input name="max_teams" type="number" min={1} max={10000} defaultValue={competition.max_teams ?? ""} /></label>
          </div>
          <div className={styles.grid}>
            <label>Abertura das inscrições<input name="registration_opens_at" type="datetime-local" defaultValue={dateInput(competition.registration_opens_at)} /></label>
            <label>Fechamento das inscrições<input name="registration_closes_at" type="datetime-local" defaultValue={dateInput(competition.registration_closes_at)} /></label>
            <label>Início da competição<input name="starts_at" type="datetime-local" defaultValue={dateInput(competition.starts_at)} /></label>
            <label>Fim da competição<input name="ends_at" type="datetime-local" defaultValue={dateInput(competition.ends_at)} /></label>
          </div>
          <label>Regras<textarea name="rules" defaultValue={competition.rules} maxLength={20000} rows={8} /></label>
          <label>Premiação<textarea name="prize" defaultValue={competition.prize} maxLength={3000} rows={4} /></label>
          <div className={styles.actions}><button className={styles.primary} type="submit">Salvar competição</button></div>
        </form>
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Inscrever equipe manualmente</h2>
        {availableTeams.length === 0 ? <div className={styles.empty}>Não há outra equipe disponível para inscrição.</div> : (
          <form action={registerTeamCompetitionAdminAction} className={styles.form}>
            <input type="hidden" name="competition_id" value={competition.id} />
            <label>Equipe<select name="team_id" required><option value="">Selecione...</option>{availableTeams.map((team: any) => <option value={team.id} key={team.id}>{team.name}{team.institution ? ` — ${team.institution}` : ""}</option>)}</select></label>
            <label>Observação administrativa<textarea name="note" maxLength={1000} rows={3} /></label>
            <div className={styles.actions}><button className={styles.primary} type="submit">Inscrever equipe</button></div>
          </form>
        )}
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2>Equipes inscritas</h2>
        {(registrations ?? []).length === 0 ? <div className={styles.empty}>Nenhuma equipe inscrita.</div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Equipe</th><th>Instituição</th><th>Inscrição</th><th>Observação</th><th></th></tr></thead>
              <tbody>{(registrations ?? []).map((registration: any) => {
                const team: any = teamMap.get(registration.team_id);
                return <tr key={registration.team_id}>
                  <td>{team ? <Link href={`/admin/teams/${team.id}`}><strong>{team.name}</strong></Link> : registration.team_id}</td>
                  <td>{team?.institution || "—"}</td>
                  <td>{new Date(registration.registered_at).toLocaleString("pt-BR")}</td>
                  <td>{registration.note || "—"}</td>
                  <td><form action={unregisterTeamCompetitionAdminAction}><input type="hidden" name="competition_id" value={competition.id} /><input type="hidden" name="team_id" value={registration.team_id} /><button className={styles.danger} type="submit">Desinscrever</button></form></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
