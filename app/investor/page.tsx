import LegacySocialServerPage from "@/components/social/LegacySocialServerPage";
import Link from "next/link";
import { requireProductUser } from "@/lib/auth/require-product-user";

export default async function InvestorHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId } = await requireProductUser("investor");
  const [verificationResult, savesResult, followsResult, interestsResult] = await Promise.all([
    supabase.from("investor_verifications").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("project_saves").select("project_id").eq("user_id", userId),
    supabase.from("follows").select("id").eq("follower_id", userId),
    supabase.from("project_interests").select("id,owner_status").eq("investor_id", userId),
  ]);

  const verification = verificationResult.data?.status ?? "not_requested";
  const activePipeline = (interestsResult.data ?? []).filter((item: any) => item.owner_status !== "closed").length;

  return <LegacySocialServerPage expectedRole="investor" home searchParams={searchParams} intro={<>      {verification !== "verified" ? (
        <section className="panel section-block" style={{ padding: 18 }}>
          <div className="section-row">
            <div><h2>{verification === "pending" ? "Verificação em análise" : verification === "rejected" ? "Sua verificação precisa de ajustes" : "Verifique sua conta de investidor"}</h2><p>Você pode explorar, salvar e seguir projetos agora. Para demonstrar interesse e iniciar o fluxo de contato, conclua a verificação.</p></div>
            <Link className="primary" href="/investor/verification">Abrir verificação</Link>
          </div>
        </section>
      ) : null}

      <div className="admin-stats section-block">
        <Link href="/investor/saved" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{savesResult.data?.length ?? 0}</b><span>projetos salvos</span></Link>
        <Link href="/investor/following" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{followsResult.data?.length ?? 0}</b><span>acompanhamentos</span></Link>
        <Link href="/investor/interests" className="panel" style={{ textDecoration: "none", color: "inherit" }}><b>{activePipeline}</b><span>contatos ativos</span></Link>
      </div>

</>} />;
}
