import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { submitInvestorVerificationAction } from "@/lib/product/readiness-actions";

export default async function InvestorVerificationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId, appUser } = await requireProductUser("investor");
  const params = await searchParams;
  const { data: verification } = await supabase
    .from("investor_verifications")
    .select("status,organization_name,organization_type,website_url,review_note,requested_at,reviewed_at")
    .eq("user_id", userId)
    .maybeSingle();

  const status = verification?.status ?? "not_requested";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <LegacySocialShell user={appUser} role="investor" pathname="/investor/verification">
      <div className="page-head">
        <div>
          <h1>Verificação de investidor</h1>
          <p>Ajude projetos e equipes a saberem com quem estão conversando. A verificação não representa recomendação financeira nem análise de capacidade de investimento.</p>
        </div>
      </div>

      {status === "verified" ? (
        <div className="form-feedback" role="status">Conta verificada. Você já pode demonstrar interesse em projetos.</div>
      ) : status === "pending" ? (
        <div className="form-feedback" role="status">Solicitação enviada. Ela está aguardando revisão.</div>
      ) : status === "rejected" ? (
        <div className="form-error" role="alert">A solicitação precisa de ajustes.{verification?.review_note ? ` ${verification.review_note}` : ""}</div>
      ) : null}

      {error ? <div className="form-error" role="alert">{error === "url" ? "Use uma URL HTTPS válida." : error === "organization" ? "Informe a organização ou atuação profissional." : "Não foi possível enviar a solicitação."}</div> : null}

      <div className="detail-grid">
        <section className="panel prose">
          <h2>Por que existe essa etapa?</h2>
          <p>O Envista conecta estudantes, equipes e criadores com pessoas interessadas em seus projetos. Por segurança, contas de investidor passam por uma verificação antes de usar a ação “Tenho interesse”.</p>
          <h3>O que é verificado</h3>
          <ul>
            <li>coerência entre perfil e organização informada;</li>
            <li>existência de um vínculo profissional ou institucional quando aplicável;</li>
            <li>sinais básicos de autenticidade e uso legítimo da plataforma.</li>
          </ul>
          <p>Não publique documentos sensíveis no perfil. Se uma comprovação adicional for necessária, o Envista deve solicitar por canal apropriado.</p>
        </section>

        <aside className="panel project-side">
          <h3>Status</h3>
          <p><b>{status === "verified" ? "Verificado" : status === "pending" ? "Em análise" : status === "rejected" ? "Revisar dados" : "Não solicitado"}</b></p>
          {status !== "verified" && status !== "pending" ? (
            <form className="form-page" style={{ padding: 0 }} action={submitInvestorVerificationAction}>
              <label>Organização ou atuação profissional<input name="organization_name" required maxLength={160} defaultValue={verification?.organization_name || appUser.organization || ""} placeholder="Ex.: Fundo, empresa, aceleradora ou atuação independente" /></label>
              <label>Tipo de organização<input name="organization_type" maxLength={100} defaultValue={verification?.organization_type || ""} placeholder="Ex.: Venture capital, empresa, aceleradora" /></label>
              <label>Site oficial <span style={{ opacity: .7 }}>(opcional)</span><input name="website_url" type="url" maxLength={500} defaultValue={verification?.website_url || ""} placeholder="https://..." /></label>
              <button className="primary" type="submit">Enviar para verificação</button>
            </form>
          ) : null}
          <div className="actions" style={{ marginTop: 16 }}><Link className="secondary" href="/account/profile">Editar perfil</Link></div>
        </aside>
      </div>
    </LegacySocialShell>
  );
}
