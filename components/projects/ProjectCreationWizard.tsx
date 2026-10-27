"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createProductProjectAction } from "@/lib/projects/product-actions";
import { ProjectDevelopmentExtraFields, ProjectIdentityExtraFields, ProjectOpportunityExtraFields } from "./ProjectExtraFields";
import styles from "./ProjectCreate.module.css";

const STEPS = [
  { title: "Identidade e essência", description: "Comece com o necessário. O resto pode ser preenchido depois." },
  { title: "Desenvolvimento", description: "Explique seus diferenciais e o que já foi testado." },
  { title: "Equipe e oportunidades", description: "Mostre quem está construindo e quem pode ajudar." },
  { title: "Apresentação e publicação", description: "Revise como o projeto aparecerá no Envista." },
];

type Preview = { title: string; short_description: string; category: string; stage: string; filled: number };
const initialPreview: Preview = { title: "", short_description: "", category: "", stage: "Ideia", filled: 0 };

export default function ProjectCreationWizard({ name, teams }: { name: string; teams: Array<{ id: string; name: string }> }) {
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const [preview, setPreview] = useState<Preview>(initialPreview);
  const titleInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function refreshPreview() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    const get = (key: string) => String(form.get(key) ?? "").trim();
    const essentials = ["title", "category", "short_description", "problem", "solution"];
    setPreview({
      title: get("title"),
      short_description: get("short_description"),
      category: get("category"),
      stage: get("stage") || "Ideia",
      filled: essentials.filter(key => get(key).length > 0).length,
    });
  }
  function next() {
    if (step === 0 && !titleInput.current?.reportValidity()) return;
    const target = Math.min(step + 1, STEPS.length - 1);
    setStep(target);
    setVisited(Math.max(visited, target));
    refreshPreview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack() {
    setStep(Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={styles.page}>
      <nav className={styles.wizardSteps} aria-label="Etapas de criação do projeto">
        {STEPS.map((item, index) => (
          <button key={item.title} type="button" className={index === step ? styles.wizardCurrent : styles.wizardStep}
            aria-current={index === step ? "step" : undefined} disabled={index > visited} onClick={() => setStep(index)}>
            <span>{index + 1}</span><span>{item.title}</span>
          </button>
        ))}
      </nav>
      <div className={styles.wizardProgress} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4} aria-label="Etapa atual">
        <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>
      <p className={styles.wizardHint}>Etapa {step + 1} de 4 · {preview.filled} de 5 informações principais preenchidas. Apenas o nome é obrigatório para começar.</p>

      <form action={createProductProjectAction} ref={formRef} className={styles.form}
        onInput={refreshPreview} onChange={refreshPreview}
        onInvalidCapture={event => { if (event.target === titleInput.current) setStep(0); }}>
        <section className={styles.section} hidden={step !== 0} aria-labelledby="step-identity">
          <div className={styles.sectionHead}><span className={styles.step}>1</span><div><h2 id="step-identity">{STEPS[0].title}</h2><p>{STEPS[0].description}</p></div></div>
          <label>Nome do projeto <span className={styles.help}>Obrigatório</span>
            <input ref={titleInput} name="title" minLength={2} maxLength={140} required placeholder="Ex.: AquaTrack" />
          </label>
          <div className={styles.grid2}>
            <label>Categoria <input name="category" maxLength={100} placeholder="Ex.: Educação, Saúde, Games" /><span className={styles.help}>Área ou assunto principal.</span></label>
            <label>Estágio <select name="stage" defaultValue="Ideia"><option>Ideia</option><option>Validação</option><option>Protótipo</option><option>MVP</option><option>Projeto ativo</option></select></label>
          </div>
          <label>Descrição curta <textarea name="short_description" maxLength={320} rows={3} placeholder="Em uma ou duas frases, o que você está criando?" /></label>
          <label>Problema <textarea name="problem" maxLength={4000} rows={3} placeholder="Que problema ou necessidade motivou o projeto?" /></label>
          <label>Solução <textarea name="solution" maxLength={4000} rows={3} placeholder="Como o projeto pretende resolver esse problema?" /></label>
          <details className={styles.optionalGroup}>
            <summary>Mais detalhes de identidade (opcional)</summary>
            <div className={styles.optionalContent}><ProjectIdentityExtraFields /></div>
          </details>
        </section>

        <section className={styles.section} hidden={step !== 1} aria-labelledby="step-development">
          <div className={styles.sectionHead}><span className={styles.step}>2</span><div><h2 id="step-development">{STEPS[1].title}</h2><p>{STEPS[1].description}</p></div></div>
          <label>Impacto esperado <textarea name="impact" maxLength={4000} placeholder="O que deve melhorar para as pessoas beneficiadas?" /></label>
          <details className={styles.optionalGroup}>
            <summary>Validação, tecnologias e próximos passos (opcional)</summary>
            <div className={styles.optionalContent}><ProjectDevelopmentExtraFields /></div>
          </details>
        </section>

        <section className={styles.section} hidden={step !== 2} aria-labelledby="step-team">
          <div className={styles.sectionHead}><span className={styles.step}>3</span><div><h2 id="step-team">{STEPS[2].title}</h2><p>{STEPS[2].description}</p></div></div>
          <label>Quem publica este projeto?
            <select name="owner" defaultValue="personal">
              <option value="personal">Meu perfil · {name}</option>
              {teams.map(team => <option key={team.id} value={team.id}>Equipe · {team.name}</option>)}
            </select>
            <span className={styles.help}>Os integrantes e suas funções são gerenciados no perfil da equipe, evitando cadastros repetidos.</span>
          </label>
          <label>Oportunidades de colaboração
            <input name="needs" maxLength={1200} placeholder="Ex.: mentor, designer, testes, patrocínio" />
            <span className={styles.help}>Separe por vírgulas. Inclua apenas as ajudas que busca agora.</span>
          </label>
          <ProjectOpportunityExtraFields />
          <p className={styles.wizardHint}>Não tem equipe ou não busca investimento? Pode seguir sem preencher esses campos.</p>
        </section>

        <section className={styles.section} hidden={step !== 3} aria-labelledby="step-publish">
          <div className={styles.sectionHead}><span className={styles.step}>4</span><div><h2 id="step-publish">{STEPS[3].title}</h2><p>{STEPS[3].description}</p></div></div>
          <div className={styles.grid2}>
            <label>Site ou demonstração <input name="website_url" type="url" maxLength={500} placeholder="https://..." /></label>
            <label>Repositório <input name="repository_url" type="url" maxLength={500} placeholder="https://github.com/..." /></label>
          </div>
          <div className={styles.grid2}>
            <label>Localização <input name="location" maxLength={160} placeholder="Ex.: Rio de Janeiro ou remoto" /></label>
            <label>Tags <input name="tags" maxLength={700} placeholder="IA, Educação, Sustentabilidade" /><span className={styles.help}>Separe por vírgulas.</span></label>
          </div>
          <details className={styles.optionalGroup}>
            <summary>Descrição completa / README (opcional)</summary>
            <div className={styles.optionalContent}><label>Descrição completa <textarea name="readme" rows={7} maxLength={20000} placeholder="Contexto, funcionalidades e detalhes que deseja compartilhar." /></label></div>
          </details>
          <div className={styles.mediaNote}>Imagem de capa, galeria, documentos e outros arquivos podem ser adicionados na página do projeto depois da criação.</div>
          <label>Visibilidade
            <select name="visibility" defaultValue="platform">
              <option value="platform">Visível para usuários do Envista</option>
              <option value="private">Privado — só você e sua equipe</option>
            </select>
          </label>
          <div className={styles.preview} aria-live="polite">
            <span className={styles.previewLabel}>PRÉVIA DO PROJETO</span>
            <span className={styles.previewMeta}>{preview.stage}{preview.category ? ` · ${preview.category}` : ""}</span>
            <h3>{preview.title || "Nome do projeto"}</h3>
            <p>{preview.short_description || "Sua descrição curta aparecerá aqui quando for preenchida."}</p>
          </div>
        </section>
        <div className={styles.actions}>
          {step > 0 ? <button type="button" className={styles.cancel} onClick={goBack}>Voltar</button> : <Link className={styles.cancel} href="/app/projects">Cancelar</Link>}
          {step < 3 ? <button className={styles.submit} type="button" onClick={next}>Continuar</button> : (
            <>
              <button className={styles.cancel} name="publication_intent" value="draft" type="submit">Salvar como rascunho privado</button>
              <button className={styles.submit} name="publication_intent" value="publish" type="submit">Criar projeto</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
