import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { createProductProjectAction } from "@/lib/projects/product-actions";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const params = await searchParams;
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  const teams = (memberships ?? []).map((item: any) => one<any>(item.teams)).filter(Boolean);
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/app/projects/new">
      <div className="page-head">
        <div><h1>Novo projeto</h1><p>Comece com o essencial. Você pode evoluir os detalhes e as evidências ao longo do projeto.</p></div>
        <Link className="secondary" href="/app/projects">Cancelar</Link>
      </div>
      {error ? <div className="form-error" role="alert">{error === "url" ? "Use apenas links HTTPS válidos." : error === "owner" ? "Você não pode publicar por essa equipe." : error === "title" ? "Informe um nome válido." : "Não foi possível criar o projeto."}</div> : null}

      <form className="form-page panel" action={createProductProjectAction}>
        <h2>1. Essência do projeto</h2>
        <label>Autoria<select name="owner" defaultValue="personal"><option value="personal">Meu perfil · {appUser.name}</option>{teams.map((team: any) => <option key={team.id} value={team.id}>Equipe · {team.name}</option>)}</select></label>
        <div className="form-grid">
          <label>Nome do projeto<input required minLength={2} maxLength={140} name="title" placeholder="Ex.: Aqua" /></label>
          <label>Estágio<select name="stage" defaultValue="Ideia"><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
        </div>
        <label>Descrição curta<textarea name="short_description" maxLength={320} placeholder="Explique em uma frase o que está sendo construído." /></label>
        <label>Problema<textarea name="problem" maxLength={4000} placeholder="Que problema real você observou?" /></label>
        <label>Solução<textarea name="solution" maxLength={4000} placeholder="Como o projeto responde a esse problema?" /></label>

        <h2>2. Evidências e direção</h2>
        <label>Impacto / validação<textarea name="impact" maxLength={4000} placeholder="Ex.: 20 pessoas testaram, protótipo apresentado em feira, economia estimada, feedbacks recebidos..." /></label>
        <label>Do que o projeto precisa agora?<input name="needs" maxLength={1200} placeholder="Ex.: mentoria, design, parceiro, investimento, testes, dev mobile" /></label>
        <div className="form-grid">
          <label>Categoria<input name="category" maxLength={100} placeholder="Tecnologia" /></label>
          <label>Localização<input name="location" maxLength={160} placeholder="Rio de Janeiro, RJ" /></label>
        </div>
        <label>Tags<input name="tags" maxLength={700} placeholder="Arduino, IoT, Educação" /></label>

        <h2>3. Links e detalhes</h2>
        <div className="form-grid">
          <label>Site / demo<input type="url" name="website_url" maxLength={500} placeholder="https://..." /></label>
          <label>Repositório<input type="url" name="repository_url" maxLength={500} placeholder="https://github.com/..." /></label>
        </div>
        <label>Descrição completa / README<textarea name="readme" maxLength={20000} placeholder="Contexto, evolução, próximos passos e detalhes técnicos." /></label>
        <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privado</option></select></label>
        <div className="form-actions"><Link className="secondary" href="/app/projects">Cancelar</Link><button className="primary" type="submit">Criar projeto</button></div>
      </form>
    </LegacySocialShell>
  );
}
