const OPPORTUNITIES = new Set(["developer", "designer", "mentor", "investor", "tester", "partner", "community"]);
const PROJECT_TYPES = new Set(["personal", "startup", "academic", "social", "research", "other"]);

function field(formData: FormData, name: string, maxLength: number): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

function list(raw: string, maxItems: number): string[] {
  return Array.from(new Set(raw.split(",").map((item) => item.trim().slice(0, 80)).filter(Boolean))).slice(0, maxItems);
}

function httpsUrl(raw: string): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

export function projectProfileFields(formData: FormData) {
  const projectType = field(formData, "project_type", 30);
  const seekingInvestment = formData.get("seeking_investment") === "on";
  return {
    project_type: PROJECT_TYPES.has(projectType) ? projectType : "personal",
    target_audience: field(formData, "target_audience", 2000),
    differentiator: field(formData, "differentiator", 4000),
    objective: field(formData, "objective", 2000),
    team_description: field(formData, "team_description", 2000),
    challenges: field(formData, "challenges", 4000),
    technologies: list(field(formData, "technologies", 1800), 20),
    collaboration_roles: Array.from(new Set(formData.getAll("collaboration_roles").filter((value): value is string => typeof value === "string" && OPPORTUNITIES.has(value)))).slice(0, 10),
    seeking_investment: seekingInvestment,
    business_model: seekingInvestment ? field(formData, "business_model", 2000) : "",
    target_market: seekingInvestment ? field(formData, "target_market", 2000) : "",
    traction: seekingInvestment ? field(formData, "traction", 2000) : "",
    investment_amount: seekingInvestment ? field(formData, "investment_amount", 100) : "",
    use_of_funds: seekingInvestment ? field(formData, "use_of_funds", 2000) : "",
    pitch_deck_url: seekingInvestment ? httpsUrl(field(formData, "pitch_deck_url", 500)) : "",
  };
}
