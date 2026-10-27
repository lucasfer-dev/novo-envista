"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createProductProjectAction } from "@/lib/projects/product-actions";
import styles from "./ProjectRegistrationWizard.module.css";

type Team = { id: string; name: string };
const labels = [
  "Identidade e essência",
  "Diferenciais e desenvolvimento",
  "Equipe e oportunidades",
  "Apresentação e publicação",
];
const kinds = [
  ["personal", "Projeto pessoal"],
  ["startup", "Startup"],
  ["academic", "Projeto acadêmico"],
  ["social", "Impacto social"],
  ["research", "Pesquisa"],
  ["other", "Outro"],
];

export default function ProjectRegistrationWizard({ name, teams }: { name: string; teams: Team[] }) {
  const [step, setStep] = useState(0);
  const [investment, setInvestment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  function next() {
    if (step === 0 && !titleRef.current?.reportValidity()) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  return (
    <form className={"form-page panel " + styles.wizard} action={createProductProjectAction} onSubmit={() => setSubmitting(true)}>
      <div className={styles.progressHeader}>
        <span>Etapa {step + 1} de 4</span>
        <strong>{labels[step]}</strong>
      </div>
      <div className={styles.progressTrack}><span style={{ width: ((step + 1) * 25) + "%" }} /></div>
      <nav className={styles.steps} aria-label="Etapas do cadastro">
        {labels.map((label, index) => (
          <button key={label} type="button" disabled={index > step} aria-current={index === step ? "step" : undefined}
            className={index === step ? styles.current : ""} onClick={() => setStep(index)}>
            <span>{index + 1}</span><small>{label}</small>
          </button>
        ))}
      </nav>

      <section hidden={step !== 0} className={styles.section} aria-label={labels[0]}>
        <h2>1. Identidade e essência</h2>
        <label>Quem publica?<select name="owner" defaultValue="personal">
          <option value="personal">Meu perfil · {name}</option>
          {teams.map((team) => <option value={team.id} key={team.id}>Equipe · {team.name}</option>)}
        </select></label>
        <div className="form-grid">
          <label>Nome do projeto *<input name="title" ref={titleRef} minLength={2} maxLength={140} required placeholder="Ex.: Aqua" /></label>
          <label>Estágio<select name="stage" defaultValue="Ideia">
            <option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option>
          </select></label>
        </div>
        <div className="form-grid">
          <label>Tipo de projeto<select name="project_type" defaultValue="personal">
            {kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Categoria<input name="category" maxLength={100} placeholder="Ex.: Tecnologia" /></label>
        </div>
        <label>Descrição curta<textarea name="short_description" maxLength={320} placeholder="Explique em uma frase o que está sendo construído." /></label>
        <label>Problema<textarea name="problem" maxLength={4000} placeholder="Qual problema real você observou?" /></label>
        <label>Solução<textarea name="solution" maxLength={4000} placeholder="Como o projeto responde a esse problema?" /></label>
        <label>Objetivo principal<textarea name="objective" maxLength={2000} placeholder="O que pretende alcançar?" /></label>
        <label>Público-alvo<textarea name="target_audience" maxLength={2000} placeholder="Quem será beneficiado ou utilizará a solução?" /></label>
        <p className={styles.note}>Imagem de capa: você poderá adicionar fotos e arquivos ao projeto depois de criá-lo.</p>
      </section>

      <section hidden={step !== 1} className={styles.section} aria-label={labels[1]}>
        <h2>2. Diferenciais e desenvolvimento</h2>
        <label>Diferencial competitivo<textarea name="differentiator" maxLength={4000} placeholder="O que torna sua proposta diferente?" /></label>
        <label>Tecnologias utilizadas<input name="technologies" maxLength={1800} placeholder="Ex.: React, Python, Arduino (separadas por vírgula)" /></label>
        <label>Impacto e validação<textarea name="impact" maxLength={4000} placeholder="Testes, feedback, protótipo, resultados ou impacto esperado" /></label>
        <label>Principais desafios<textarea name="challenges" maxLength={4000} placeholder="Quais obstáculos precisam ser superados?" /></label>
        <label>Próximos objetivos / detalhes<textarea name="readme" maxLength={20000} placeholder="Próximos passos, plano de desenvolvimento e informações técnicas." /></label>
        <p className={styles.note}>Marcos, prazos e histórico de atualizações podem ser organizados depois no cockpit do projeto.</p>
      </section>

      <section hidden={step !== 2} className={styles.section} aria-label={labels[2]}>
        <h2>3. Equipe e oportunidades</h2>
        <label>Equipe atual<textarea name="team_description" maxLength={2000} placeholder="Pessoas e funções envolvidas. Para autoria em equipe, selecione a equipe na etapa 1." /></label>
        <label>Do que o projeto precisa agora?<input name="needs" maxLength={1200} placeholder="Ex.: Mentoria, Desenvolvedores, Designers, Testadores" /></label>
        <p className={styles.note}>Separe as necessidades por vírgulas. Elas poderão orientar futuras conexões na plataforma.</p>
        <label className={styles.check}><input type="checkbox" name="seeking_investment" checked={investment} onChange={(event) => setInvestment(event.target.checked)} /> Busca investimento</label>
        {investment ? <div className={styles.investment}>
          <h3>Informações para investidores</h3>
          <p className={styles.note}>Todos os campos são opcionais e podem ser preenchidos mais tarde.</p>
          <label>Modelo de negócio<textarea name="business_model" maxLength={2000} placeholder="Como o projeto gera receita ou se sustenta?" /></label>
          <label>Mercado de atuação<textarea name="target_market" maxLength={2000} placeholder="Em qual setor ou segmento atua?" /></label>
          <label>Tração<textarea name="traction" maxLength={2000} placeholder="Usuários, clientes, receita, testes e resultados reais" /></label>
          <label>Investimento desejado<input name="investment_amount" maxLength={100} placeholder="Ex.: R$ 50.000 (se já definido)" /></label>
          <label>Destinação dos recursos<textarea name="use_of_funds" maxLength={2000} placeholder="Em que seriam utilizados os recursos?" /></label>
          <label>Pitch deck (link HTTPS)<input type="url" name="pitch_deck_url" maxLength={500} placeholder="https://..." /></label>
        </div> : null}
      </section>

      <section hidden={step !== 3} className={styles.section} aria-label={labels[3]}>
        <h2>4. Apresentação e publicação</h2>
        <div className="form-grid">
          <label>Site / demonstração<input type="url" name="website_url" maxLength={500} placeholder="https://..." /></label>
          <label>Repositório<input type="url" name="repository_url" maxLength={500} placeholder="https://github.com/..." /></label>
        </div>
        <div className="form-grid">
          <label>Localização<input name="location" maxLength={160} placeholder="Ex.: Rio de Janeiro, RJ" /></label>
          <label>Tags<input name="tags" maxLength={700} placeholder="IA, Educação, Web" /></label>
        </div>
        <label>Visibilidade<select name="visibility" defaultValue="platform">
          <option value="platform">Visível para usuários do Envista</option>
          <option value="private">Privado</option>
        </select></label>
        <p className={styles.note}>Galeria de imagens, capa e arquivos podem ser adicionados na página do projeto após a criação. O rascunho fica privado até que você o publique.</p>
      </section>

      <div className={styles.actions}>
        <div>{step === 0 ? <Link className="secondary" href="/app/projects">Cancelar</Link>
          : <button className="secondary" type="button" onClick={() => setStep((current) => current - 1)}>Voltar</button>}</div>
        <div className={styles.actionsRight}>
          {step === 3 ? <>
            <button name="submission_intent" value="draft" className="secondary" disabled={submitting} type="submit">Salvar como rascunho</button>
            <button name="submission_intent" value="publish" className="primary" disabled={submitting} type="submit">{submitting ? "Salvando…" : "Criar projeto"}</button>
          </> : <button className="primary" type="button" onClick={next}>Continuar</button>}
        </div>
      </div>
    </form>
  );
}
