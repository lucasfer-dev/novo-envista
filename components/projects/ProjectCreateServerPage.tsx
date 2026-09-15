import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { createProjectAction } from "@/lib/projects/actions";
import { requireProductUser } from "@/lib/auth/require-product-user";
import styles from "./ProjectCreate.module.css";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function errorMessage(code?: string) {
  if (code === "title") return "Informe um nome de projeto com pelo menos 2 caracteres.";
  if (code === "owner") return "Você não pode publicar em nome dessa equipe.";
  if (code) return "Não foi possível criar o projeto. Revise os campos e tente novamente.";
  return "";
}

export async function ProjectCreateServerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const query = await searchParams;
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const failure = errorMessage(rawError);
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  const teams = (memberships ?? []).map((item: any) => one<any>(item.teams)).filter(Boolean) as Array<{ id: string; name: string }>;

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/projects/new">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Criar projeto</h1>
            <p>Monte um perfil de projeto claro o bastante para equipe, competições e possíveis investidores entenderem rapidamente o que você está construindo.</p>
          </div>
          <Link className={styles.back} href="/projects">← Voltar aos projetos</Link>
        </div>

        {failure ? <div className={styles.error} role="alert">{failure}</div> : null}

        <form className={styles.form} action={createProjectAction}>
          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.step}>1</span><div><h2>Identidade</h2><p>O básico que aparece nos cards e nas buscas.</p></div></div>
            <label>Quem publica este projeto?<select name="owner" defaultValue="personal"><option value="personal">Meu perfil · {appUser.name}</option>{teams.map((team) => <option value={team.id} key={team.id}>Equipe · {team.name}</option>)}</select></label>
            <div className={styles.grid2}>
              <label>Nome do projeto<input required minLength={2} maxLength={140} name="title" placeholder="Ex.: AquaTrack" /></label>
              <label>Estágio<select name="stage" defaultValue="Ideia"><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
              <label>Categoria<input name="category" maxLength={100} placeholder="Ex.: Educação, Robótica, Saúde" /></label>
              <label>Localização<input name="location" maxLength={160} placeholder="Ex.: Rio de Janeiro, RJ ou Online" /></label>
            </div>
            <label>Resumo<textarea name="short_description" maxLength={320} rows={3} placeholder="Em uma frase: o que é o projeto e para quem ele existe?" /><span className={styles.help}>Até 320 caracteres. Esse texto aparece primeiro para quem encontra o projeto.</span></label>
            <label>Tags<input name="tags" maxLength={900} placeholder="IA, Educação, Web, Sustentabilidade" /><span className={styles.help}>Separe por vírgulas. O Envista usa essas tags para busca e recomendações.</span></label>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.step}>2</span><div><h2>Problema e solução</h2><p>Explique o motivo de o projeto existir antes de falar da tecnologia.</p></div></div>
            <label>Problema<textarea name="problem" maxLength={4000} rows={6} placeholder="Que situação real você observou? Quem é afetado e por quê?" /></label>
            <label>Solução proposta<textarea name="solution" maxLength={4000} rows={6} placeholder="Como seu projeto resolve ou reduz esse problema?" /></label>
            <label>Impacto esperado<textarea name="impact" maxLength={6000} rows={5} placeholder="Que mudança você espera gerar? Há algum indicador, público ou resultado que pretende alcançar?" /></label>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.step}>3</span><div><h2>O que o projeto precisa</h2><p>Ajuda o Envista a aproximar oportunidades, pessoas e investidores.</p></div></div>
            <label>Necessidades<input name="needs" maxLength={1200} placeholder="Mentoria, Desenvolvedor mobile, Patrocínio, Design, Impressora 3D" /><span className={styles.help}>Separe por vírgulas.</span></label>
            <label>Descrição completa / README<textarea name="readme" maxLength={20000} rows={9} placeholder="Contexto, funcionamento, tecnologias, validações, próximos passos e tudo que ajuda alguém a entender o projeto com profundidade." /></label>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.step}>4</span><div><h2>Links e demonstração</h2><p>Opcional. Adicione somente links que você realmente quer compartilhar.</p></div></div>
            <div className={styles.grid2}>
              <label>Site<input type="url" name="website_url" maxLength={500} placeholder="https://seuprojeto.com" /></label>
              <label>Repositório<input type="url" name="repository_url" maxLength={500} placeholder="https://github.com/..." /></label>
              <label>Demo<input type="url" name="demo_url" maxLength={500} placeholder="https://demo..." /></label>
              <label>Design / protótipo<input type="url" name="design_url" maxLength={500} placeholder="https://figma.com/..." /></label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.step}>5</span><div><h2>Publicação</h2><p>Você pode começar privado e abrir o projeto quando estiver pronto.</p></div></div>
            <label>Visibilidade<select name="visibility" defaultValue="platform"><option value="platform">Visível para usuários do Envista</option><option value="private">Privado</option></select></label>
          </section>

          <div className={styles.actions}>
            <Link className={styles.cancel} href="/projects">Cancelar</Link>
            <button className={styles.submit} type="submit">Criar projeto</button>
          </div>
        </form>
      </div>
    </LegacySocialShell>
  );
}
