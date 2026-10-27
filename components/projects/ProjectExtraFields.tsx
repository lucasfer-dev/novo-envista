import { normalizeProjectDetails, PROJECT_TYPE_LABELS, type ProjectDetails } from "@/lib/projects/project-details";

type DetailsProps = { details?: Partial<ProjectDetails> | null };

export function ProjectIdentityExtraFields({ details: initial }: DetailsProps) {
  const details = normalizeProjectDetails(initial);
  return (
    <>
      <label>Tipo de projeto
        <select name="project_type" defaultValue={details.project_type}>
          <option value="">Selecionar (opcional)</option>
          {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <small>O tipo descreve a iniciativa; a categoria descreve o assunto (ex.: Educação).</small>
      </label>
      <label>Objetivo principal
        <textarea name="main_goal" maxLength={2000} defaultValue={details.main_goal} placeholder="Qual resultado você quer alcançar?" />
      </label>
      <label>Público-alvo
        <textarea name="target_audience" maxLength={1200} defaultValue={details.target_audience} placeholder="Quem se beneficia dessa solução?" />
      </label>
    </>
  );
}

export function ProjectDevelopmentExtraFields({ details: initial }: DetailsProps) {
  const details = normalizeProjectDetails(initial);
  return (
    <>
      <label>Diferencial competitivo
        <textarea name="competitive_edge" maxLength={2000} defaultValue={details.competitive_edge} placeholder="O que diferencia sua proposta das alternativas?" />
      </label>
      <label>Tecnologias utilizadas
        <input name="technologies" maxLength={1200} defaultValue={details.technologies.join(", ")} placeholder="Ex.: React, Arduino, Python (se houver)" />
        <small>Opcional. Separe por vírgula. Projetos não tecnológicos também são bem-vindos.</small>
      </label>
      <label>Validação e resultados reais
        <textarea name="validation" maxLength={4000} defaultValue={details.validation} placeholder="Testes, entrevistas, números ou feedbacks. Se ainda não testou, deixe em branco." />
      </label>
      <label>Principais desafios
        <textarea name="challenges" maxLength={2000} defaultValue={details.challenges} placeholder="O que está dificultando a evolução do projeto?" />
      </label>
      <label>Próximos objetivos
        <textarea name="next_goals" maxLength={2000} defaultValue={details.next_goals} placeholder="Quais os próximos marcos ou entregas?" />
      </label>
    </>
  );
}

export function ProjectOpportunityExtraFields({ details: initial }: DetailsProps) {
  const details = normalizeProjectDetails(initial);
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <input type="checkbox" name="seeking_investment" defaultChecked={details.seeking_investment} style={{ width: "auto", marginTop: 3 }} />
      <span>Estou buscando investimento <small style={{ display: "block", fontWeight: 400 }}>Marque apenas se deseja receber contatos de investidores. Não garante captação.</small></span>
    </label>
  );
}

export function ProjectExtendedDescription({ details: initial }: DetailsProps) {
  const details = normalizeProjectDetails(initial);
  return (
    <>
      {details.project_type ? <><h2>Tipo de projeto</h2><p>{PROJECT_TYPE_LABELS[details.project_type]}</p></> : null}
      {details.main_goal ? <><h2>Objetivo principal</h2><p>{details.main_goal}</p></> : null}
      {details.target_audience ? <><h2>Público-alvo</h2><p>{details.target_audience}</p></> : null}
      {details.competitive_edge ? <><h2>Diferencial</h2><p>{details.competitive_edge}</p></> : null}
      {details.technologies.length ? <><h2>Tecnologias</h2><div className="chips">{details.technologies.map(item => <span key={item}>{item}</span>)}</div></> : null}
      {details.validation ? <><h2>Validação e resultados</h2><p>{details.validation}</p></> : null}
      {details.challenges ? <><h2>Desafios</h2><p>{details.challenges}</p></> : null}
      {details.next_goals ? <><h2>Próximos objetivos</h2><p>{details.next_goals}</p></> : null}
      {details.seeking_investment ? <><h2>Oportunidades</h2><p>Este projeto está aberto a conversas sobre investimento.</p></> : null}
    </>
  );
}
