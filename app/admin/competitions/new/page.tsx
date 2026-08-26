import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import styles from "@/components/admin/AdminViews.module.css";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { createCompetitionAdminAction } from "@/lib/admin/competition-actions";

export default async function NewCompetitionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireAdminUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <AdminShell profile={profile} title="Nova competição">
      <div className={styles.head}>
        <div><h1>Criar competição</h1><p className={styles.muted}>A competição nasce como rascunho por padrão e só aparece para usuários quando for publicada.</p></div>
        <Link className={styles.secondary} href="/admin/competitions">Voltar</Link>
      </div>
      {error ? <div className={styles.error}>Não foi possível criar a competição. Revise os campos e tente novamente.</div> : null}
      <section className={styles.card}>
        <form action={createCompetitionAdminAction} className={styles.form}>
          <label>Título<input name="title" maxLength={160} required /></label>
          <label>Slug<input name="slug" maxLength={120} placeholder="deixe vazio para gerar pelo título" /></label>
          <label>Resumo<textarea name="summary" maxLength={500} rows={3} /></label>
          <label>Descrição<textarea name="description" maxLength={12000} rows={7} /></label>
          <div className={styles.grid}>
            <label>Organizador<input name="organizer" defaultValue="Envista" maxLength={160} required /></label>
            <label>Formato<input name="format" maxLength={120} placeholder="Presencial, online, híbrida..." /></label>
            <label>Local<input name="location" maxLength={220} /></label>
            <label>Status<select name="status" defaultValue="draft"><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="closed">Encerrada</option><option value="archived">Arquivada</option></select></label>
            <label>Máximo de equipes<input name="max_teams" type="number" min={1} max={10000} /></label>
          </div>
          <div className={styles.grid}>
            <label>Abertura das inscrições<input name="registration_opens_at" type="datetime-local" /></label>
            <label>Fechamento das inscrições<input name="registration_closes_at" type="datetime-local" /></label>
            <label>Início da competição<input name="starts_at" type="datetime-local" /></label>
            <label>Fim da competição<input name="ends_at" type="datetime-local" /></label>
          </div>
          <label>Regras<textarea name="rules" maxLength={20000} rows={8} /></label>
          <label>Premiação<textarea name="prize" maxLength={3000} rows={4} /></label>
          <div className={styles.actions}><button className={styles.primary} type="submit">Criar competição</button><Link className={styles.secondary} href="/admin/competitions">Cancelar</Link></div>
        </form>
      </section>
    </AdminShell>
  );
}
