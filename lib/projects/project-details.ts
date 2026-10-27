/** Informações opcionais do projeto. A coluna JSONB permite evoluir o formulário sem quebrar projetos antigos. */
export type ProjectDetails = {
  project_type: string;
  main_goal: string;
  target_audience: string;
  competitive_edge: string;
  technologies: string[];
  validation: string;
  challenges: string;
  next_goals: string;
  seeking_investment: boolean;
};

const projectTypes = new Set(["academic", "startup", "social", "personal", "research", "business", "other"]);
export const PROJECT_TYPE_LABELS: Record<string, string> = {
  academic: "Acadêmico",
  startup: "Startup",
  social: "Impacto social",
  personal: "Pessoal / portfólio",
  research: "Pesquisa",
  business: "Negócio",
  other: "Outro",
};

function getText(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function uniqueList(raw: string, max = 12): string[] {
  return Array.from(new Set(raw.split(",").map(item => item.trim().slice(0, 80)).filter(Boolean))).slice(0, max);
}

/** Parse seguro: nenhuma chave arbitrária enviada pelo navegador é persistida. */
export function readProjectDetails(formData: FormData): ProjectDetails {
  const rawType = getText(formData, "project_type", 40);
  return {
    project_type: projectTypes.has(rawType) ? rawType : "",
    main_goal: getText(formData, "main_goal", 2000),
    target_audience: getText(formData, "target_audience", 1200),
    competitive_edge: getText(formData, "competitive_edge", 2000),
    technologies: uniqueList(getText(formData, "technologies", 1200)),
    validation: getText(formData, "validation", 4000),
    challenges: getText(formData, "challenges", 2000),
    next_goals: getText(formData, "next_goals", 2000),
    seeking_investment: formData.get("seeking_investment") === "on",
  };
}

/** Compatível com registros criados antes da migração. */
export function normalizeProjectDetails(input: unknown): ProjectDetails {
  const raw = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  const str = (key: string, max: number) => typeof raw[key] === "string" ? (raw[key] as string).slice(0, max) : "";
  return {
    project_type: projectTypes.has(str("project_type", 40)) ? str("project_type", 40) : "",
    main_goal: str("main_goal", 2000),
    target_audience: str("target_audience", 1200),
    competitive_edge: str("competitive_edge", 2000),
    technologies: Array.isArray(raw.technologies) ? raw.technologies.filter((value): value is string => typeof value === "string").slice(0, 12).map(value => value.slice(0, 80)) : [],
    validation: str("validation", 4000),
    challenges: str("challenges", 2000),
    next_goals: str("next_goals", 2000),
    seeking_investment: raw.seeking_investment === true,
  };
}
