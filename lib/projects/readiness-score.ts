export type ProjectReadinessInput = {
  short_description?: string | null;
  problem?: string | null;
  solution?: string | null;
  impact?: string | null;
  stage?: string | null;
  category?: string | null;
  location?: string | null;
  tags?: string[] | null;
  needs?: string[] | null;
  readme?: string | null;
  cover_path?: string | null;
  website_url?: string | null;
  repository_url?: string | null;
  demo_url?: string | null;
  design_url?: string | null;
};

export type ProjectReadinessResult = {
  score: number;
  level: "inicial" | "em evolução" | "pronto para apresentar";
  completed: string[];
  missing: string[];
};

type Criterion = {
  label: string;
  weight: number;
  ok: (project: ProjectReadinessInput) => boolean;
};

const hasText = (value?: string | null, min = 1) => Boolean(value?.trim() && value.trim().length >= min);

const criteria: Criterion[] = [
  { label: "Descrição curta clara", weight: 10, ok: (p) => hasText(p.short_description, 20) },
  { label: "Problema bem definido", weight: 12, ok: (p) => hasText(p.problem, 40) },
  { label: "Solução explicada", weight: 12, ok: (p) => hasText(p.solution, 40) },
  { label: "Impacto ou resultado esperado", weight: 8, ok: (p) => hasText(p.impact, 30) },
  { label: "Estágio e categoria definidos", weight: 8, ok: (p) => hasText(p.stage) && hasText(p.category) },
  { label: "Tags para descoberta", weight: 8, ok: (p) => Boolean(p.tags?.length) },
  { label: "Necessidades do projeto", weight: 7, ok: (p) => Boolean(p.needs?.length) },
  { label: "README detalhado", weight: 12, ok: (p) => hasText(p.readme, 180) },
  { label: "Imagem de capa", weight: 7, ok: (p) => hasText(p.cover_path) },
  { label: "Localização informada", weight: 4, ok: (p) => hasText(p.location) },
  {
    label: "Evidência externa (site, demo, código ou design)",
    weight: 12,
    ok: (p) => Boolean(p.website_url || p.demo_url || p.repository_url || p.design_url),
  },
];

export function calculateProjectReadiness(project: ProjectReadinessInput): ProjectReadinessResult {
  const completed = criteria.filter((criterion) => criterion.ok(project));
  const missing = criteria.filter((criterion) => !criterion.ok(project));
  const score = completed.reduce((sum, criterion) => sum + criterion.weight, 0);

  return {
    score,
    level: score >= 80 ? "pronto para apresentar" : score >= 50 ? "em evolução" : "inicial",
    completed: completed.map((criterion) => criterion.label),
    missing: missing.map((criterion) => criterion.label),
  };
}
