import type { LiveCompetition } from "@/lib/competitions/types";

export interface RecommendationTeam {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  city: string;
  tags: string[];
}

export interface RecommendationProject {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  location: string;
  tags: string[];
  ownerTeamId: string | null;
}

export interface RecommendationProfile {
  city: string;
  state: string;
  tags: string[];
}

export interface CompetitionRecommendationContext {
  profile: RecommendationProfile;
  teams: RecommendationTeam[];
  projects: RecommendationProject[];
}

export interface CompetitionMatch {
  kind: "project" | "team";
  entityId: string;
  entitySlug: string;
  entityName: string;
  score: number;
  reasons: string[];
}

export interface CompetitionRecommendation {
  project: CompetitionMatch | null;
  team: CompetitionMatch | null;
  profileScore: number;
  profileReasons: string[];
  score: number;
}

const TOPIC_GROUPS = [
  { label: "Robótica", terms: ["robotica", "robo", "robos", "arduino", "iot", "eletronica", "automacao", "sensor", "sensores", "mecatronica", "lego"] },
  { label: "Programação", terms: ["programacao", "software", "javascript", "typescript", "python", "java", "web", "aplicativo", "aplicativos", "computacao"] },
  { label: "IA", terms: ["ia", "inteligencia artificial", "machine learning", "visao computacional"] },
  { label: "Sustentabilidade", terms: ["sustentabilidade", "sustentavel", "ambiental", "meio ambiente", "agua", "energia", "solar", "reciclagem"] },
  { label: "Educação", terms: ["educacao", "edtech", "aprendizagem", "escola", "ensino"] },
  { label: "Acessibilidade", terms: ["acessibilidade", "assistiva", "inclusao"] },
  { label: "Inovação", terms: ["inovacao", "inovador", "inovadores", "impacto social", "empreendedorismo", "projeto inovador", "projetos inovadores"] },
  { label: "Ciência", terms: ["ciencia", "cientifico", "olimpiada", "matematica", "fisica", "quimica", "biologia", "astronomia"] },
  { label: "Games", terms: ["game", "games", "jogo", "jogos", "desenvolvimento de jogos"] },
  { label: "Resgate", terms: ["resgate", "rescue"] },
  { label: "Sumô", terms: ["sumo", "sumo de robos"] },
  { label: "Drones", terms: ["drone", "drones"] },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, term: string) {
  const normalizedTerm = normalize(term);
  return normalizedTerm.length <= 2 ? (` ${text} `).includes(` ${normalizedTerm} `) : text.includes(normalizedTerm);
}

function competitionText(item: LiveCompetition) {
  return normalize([item.name, item.organizer, item.eligibility, item.level, ...item.modalities, ...item.stages].join(" "));
}

function topicMatches(entityText: string, item: LiveCompetition) {
  const compText = competitionText(item);
  return TOPIC_GROUPS.filter((group) => group.terms.some((term) => containsTerm(entityText, term)) && group.terms.some((term) => containsTerm(compText, term))).map((group) => group.label);
}

function entityLocationReason(location: string, item: LiveCompetition) {
  const value = normalize(location);
  if (!value || !item.state) return null;
  const state = normalize(item.state);
  const city = normalize(item.city);
  if (city && value.includes(city)) return item.city;
  if (state && (` ${value} `).includes(` ${state} `)) return item.state;
  return null;
}

function profileLocationScore(profile: RecommendationProfile, item: LiveCompetition) {
  const city = normalize(profile.city);
  const state = normalize(profile.state);
  const itemCity = normalize(item.city);
  const itemState = normalize(item.state);
  if (city && itemCity && (city === itemCity || city.includes(itemCity) || itemCity.includes(city))) {
    return { score: 8, reason: `Perto de você · ${item.city}` };
  }
  if (state && itemState && state === itemState) return { score: 4, reason: `No seu estado · ${item.state}` };
  return { score: 0, reason: "" };
}

function scoreProfile(profile: RecommendationProfile, item: LiveCompetition) {
  if (item.status === "CLOSED") return { score: 0, reasons: [] as string[] };
  const topics = topicMatches(normalize(profile.tags.join(" ")), item);
  const location = profileLocationScore(profile, item);
  const reasons = [...topics.slice(0, 3)];
  let score = topics.length * 4 + location.score;
  if (location.reason) reasons.push(location.reason);
  if (score > 0 && item.status === "OPEN") score += 1;
  return { score, reasons };
}

function scoreEntity(entityText: string, location: string, item: LiveCompetition) {
  if (item.status === "CLOSED") return { score: 0, reasons: [] as string[] };
  const topics = topicMatches(normalize(entityText), item);
  const locationMatch = entityLocationReason(location, item);
  const reasons = [...topics.slice(0, 3)];
  let score = topics.length * 4;
  if (locationMatch) {
    score += 2;
    reasons.push(locationMatch);
  }
  if (score > 0 && item.status === "OPEN") score += 1;
  return { score, reasons };
}

function projectMatch(project: RecommendationProject, item: LiveCompetition): CompetitionMatch | null {
  const result = scoreEntity([project.title, project.shortDescription, project.category, ...project.tags].join(" "), project.location, item);
  if (result.score < 4 || !result.reasons.length) return null;
  return { kind: "project", entityId: project.id, entitySlug: project.slug, entityName: project.title, score: result.score, reasons: result.reasons };
}

function teamMatch(team: RecommendationTeam, item: LiveCompetition): CompetitionMatch | null {
  const result = scoreEntity([team.name, team.description, team.category, ...team.tags].join(" "), team.city, item);
  if (result.score < 4 || !result.reasons.length) return null;
  return { kind: "team", entityId: team.id, entitySlug: team.slug, entityName: team.name, score: result.score, reasons: result.reasons };
}

export function recommendCompetition(item: LiveCompetition, context: CompetitionRecommendationContext): CompetitionRecommendation {
  const projects = context.projects.map((project) => projectMatch(project, item)).filter((value): value is CompetitionMatch => Boolean(value)).sort((a, b) => b.score - a.score);
  const teams = context.teams.map((team) => teamMatch(team, item)).filter((value): value is CompetitionMatch => Boolean(value)).sort((a, b) => b.score - a.score);
  const profile = scoreProfile(context.profile, item);
  const project = projects[0] || null;
  const team = teams[0] || null;
  return {
    project,
    team,
    profileScore: profile.score,
    profileReasons: profile.reasons,
    score: Math.max(profile.score, project?.score || 0, team?.score || 0),
  };
}

export function hasRecommendationContext(context: CompetitionRecommendationContext) {
  return Boolean(context.profile.city || context.profile.state || context.profile.tags.length || context.projects.length || context.teams.length);
}
