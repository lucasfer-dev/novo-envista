import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import styles from "@/components/product/ProfessionalSuite.module.css";

const columns = [
  ["new", "Enviado"],
  ["viewed", "Visualizado"],
  ["contacted", "Em contato"],
  ["meeting", "Reunião"],
  ["closed", "Encerrado"],
] as const;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function InvestorInterestsPage() {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const [{ data: verification }, { data: interests }] = await Promise.all([
    supabase.from("investor_verifications").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("project_interests").select("id,message,status,owner_status,created_at,updated_at,projects(id,slug,title,short_description,stage,category)").eq("investor_id", userId).order("updated_at", { ascending: false }),
  ]);
  const rows = (interests ?? []).map((interest: any) => ({ ...interest, project: one<any>(interest.projects) })).filter((item: any) => item.project);

  return (
    <LegacySocialShell user={appUser} role="investor" pathname="/investor/interests">
      <div className="page-head">
        <div><h1>Pipeline de oportunidades</h1><p>Acompanhe cada projeto desde o primeiro interesse até conversa, reunião e encerramento.</p></div>
        {verification?.status !== "verified" ? <Link className="primary" href="/investor/verification">Verificar conta</Link> : <Link className="secondary" href="/investor/explore">Descobrir projetos</Link>}
      </div>
      {verification?.status !== "verified" ? <div className="form-error">Sua conta ainda não está verificada. Você pode explorar e salvar projetos, mas “Tenho interesse” exige verificação.</div> : null}
      {rows.length ? <div className={styles.pipeline}>
        {columns.map(([status,label]) => {
          const current = rows.filter((item:any)=>(item.owner_status || "new") === status);
          return <section className={styles.pipelineColumn} key={status}>
            <header><span>{label}</span><span>{current.length}</span></header>
            {current.map((interest:any)=><Link key={interest.id} className={styles.pipelineCard} href={`/investor/projects/${encodeURIComponent(interest.project.slug)}?from=explore`}><strong>{interest.project.title}</strong><small>{interest.project.stage || interest.project.category || "Projeto"}</small>{interest.message ? <small>{interest.message.slice(0,100)}{interest.message.length>100?"…":""}</small> : null}</Link>)}
          </section>;
        })}
      </div> : <div className="empty"><h3>Nenhum interesse enviado ainda</h3><p>Explore projetos, salve os mais relevantes e demonstre interesse quando houver alinhamento.</p><Link className="primary" href="/investor/explore">Explorar projetos</Link></div>}
    </LegacySocialShell>
  );
}
