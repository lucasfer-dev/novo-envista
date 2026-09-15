import type { CompetitionStatus, LiveCompetition } from "@/lib/competitions/types";

const EXTRA_SOURCES = {
  febrace: "https://febrace.org.br/calendario/datas-importantes/",
  campusMobile: "https://www.institutoclaro.org.br/campus-mobile/",
  teenTech: "https://teentech.teckids.org.br/",
  latinoware: "https://latinoware.org/8o-hackathon-23o-latinoware/",
  avancaCafe: "https://ipetech.ufla.br/index.php/avanca-cafe/",
  maratonaTech: "https://www.maratona.tech/",
  wro: "https://www.wrobr.com.br/inscricoes",
  cbr: "https://cbr.robocup.org.br/index.php/inscricoes/",
} as const;

type ExtraKey = keyof typeof EXTRA_SOURCES;

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function statusFromWindow(start: string | null, end: string | null): CompetitionStatus {
  const today = todayKey();
  if (start && today < start) return "UPCOMING";
  if (end && today > end) return "CLOSED";
  if ((!start || today >= start) && (!end || today <= end)) return "OPEN";
  return "UNKNOWN";
}

function slugFromId(id: string) {
  return Buffer.from(id, "utf8").toString("base64url");
}

function item(value: Omit<LiveCompetition, "slug">): LiveCompetition {
  return { ...value, slug: slugFromId(value.id) };
}

async function fetchOfficial(url: string, fresh: boolean) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; EnvistaCompetitionFinder/1.0; +https://useenvista.com.br)",
      },
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 900 } }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseFebrace(html: string) {
  const text = textFromHtml(html);
  if (!/FEBRACE\s+2027/i.test(text)) return [];
  const open = /22\s+jun\s+2026[\s\S]*Abertura das Inscrições de projetos/i.test(text);
  const deadline = /20\s+out\s+2026[\s\S]*Data Limite para envio completo de projetos/i.test(text);
  if (!open && !deadline) return [];
  return [item({
    id: "febrace-2027",
    name: "FEBRACE 2027 — Feira Brasileira de Ciências e Engenharia",
    organizer: "Escola Politécnica da USP / LSI-TEC",
    modalities: ["Ciências", "Engenharia", "Projetos Inovadores", "Tecnologia"],
    minAge: null,
    maxAge: null,
    eligibility: "Estudantes do 8º ou 9º ano do Ensino Fundamental, Ensino Médio ou Técnico durante 2026, conforme regras oficiais da FEBRACE 2027.",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    level: "Nacional",
    stages: ["Submissão de projeto", "Seleção", "Mostra de finalistas"],
    registrationStart: "2026-06-22",
    registrationEnd: "2026-10-20",
    eventDate: "2027-03-15",
    officialUrl: EXTRA_SOURCES.febrace,
    sourceName: "FEBRACE — calendário oficial",
    evidence: "O calendário oficial da FEBRACE 2027 informa abertura em 22/06/2026 e prazo para envio completo do projeto até 20/10/2026.",
    confidence: 100,
    status: statusFromWindow("2026-06-22", "2026-10-20"),
  })];
}

function parseCampusMobile(html: string) {
  const text = textFromHtml(html);
  if (!/Campus Mobile/i.test(text) || !/15/i.test(text)) return [];
  const registrationSignal = /Inscreva-se|Faça a sua Inscrição|inscrições/i.test(text);
  if (!registrationSignal) return [];
  return [item({
    id: "campus-mobile-15-2026",
    name: "15º Campus Mobile",
    organizer: "Instituto Claro / LSI-TEC / Escola Politécnica da USP",
    modalities: ["Tecnologia Mobile", "Inovação", "Educação", "Saúde", "Acessibilidade", "Green Tech"],
    minAge: null,
    maxAge: null,
    eligibility: "Estudantes de graduação, mestrado ou doutorado no Brasil e pessoas que concluíram esses cursos em 2025 ou 2026; projetos individuais ou em equipes de até 3 integrantes.",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição", "Seleção", "Mentorias", "Semana presencial", "Final"],
    registrationStart: null,
    registrationEnd: "2026-10-18",
    eventDate: null,
    officialUrl: EXTRA_SOURCES.campusMobile,
    sourceName: "Instituto Claro — Campus Mobile",
    evidence: "A 15ª edição está com inscrições de projetos em 2026; o prazo oficial divulgado pelo Instituto Claro termina em 18/10/2026.",
    confidence: 98,
    status: statusFromWindow(null, "2026-10-18"),
  })];
}

function parseTeenTech(html: string) {
  const text = textFromHtml(html);
  if (!/TeenTech\s+2026/i.test(text) || !/25\s+de\s+setembro\s+de\s+2026/i.test(text)) return [];
  return [item({
    id: "teentech-2026",
    name: "Hackathon TeenTech 2026",
    organizer: "Instituto Teckids",
    modalities: ["Hackathon", "Segurança Digital", "Programação", "Impacto Social"],
    minAge: null,
    maxAge: null,
    eligibility: "Voltado a jovens estudantes em equipes. Os critérios de faixa etária e composição devem ser confirmados no regulamento oficial antes da inscrição.",
    city: "Brasília",
    state: "DF",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição de equipe", "Avaliação", "Mentorias", "Final nacional"],
    registrationStart: null,
    registrationEnd: "2026-09-25",
    eventDate: null,
    officialUrl: EXTRA_SOURCES.teenTech,
    sourceName: "Instituto Teckids — TeenTech",
    evidence: "A página oficial informa encerramento das inscrições em 25/09/2026, mentorias em setembro/outubro e final nacional em Brasília em dezembro.",
    confidence: 94,
    status: statusFromWindow(null, "2026-09-25"),
  })];
}

function parseLatinoware(html: string) {
  const text = textFromHtml(html);
  if (!/8º?\s*Hackathon/i.test(text) || !/Latinoware\s+2026/i.test(text)) return [];
  return [item({
    id: "latinoware-hackathon-2026",
    name: "8º Hackathon Latinoware 2026",
    organizer: "Latinoware",
    modalities: ["Software Livre", "IA", "Segurança", "Hardware", "Impacto Social"],
    minAge: 18,
    maxAge: null,
    eligibility: "Pessoas com 18 anos ou mais inscritas no 23º Latinoware; equipes de 3 a 5 integrantes, inclusive multidisciplinares.",
    city: "Foz do Iguaçu",
    state: "PR",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição", "Hackathon presencial", "Demoday"],
    registrationStart: "2026-09-10",
    registrationEnd: "2026-10-05",
    eventDate: "2026-10-14",
    officialUrl: EXTRA_SOURCES.latinoware,
    sourceName: "Latinoware — regulamento oficial do Hackathon",
    evidence: "O regulamento oficial informa inscrições de 10/09 a 05/10/2026 e evento presencial de 14 a 16/10 em Foz do Iguaçu/PR.",
    confidence: 100,
    status: statusFromWindow("2026-09-10", "2026-10-05"),
  })];
}

function parseAvancaCafe(html: string) {
  const text = textFromHtml(html);
  if (!/Avança Café\s+2026/i.test(text) || !/24\s+de\s+setembro/i.test(text)) return [];
  return [item({
    id: "avanca-cafe-2026",
    name: "Avança Café 2026",
    organizer: "Embrapa Café / IpêTech-UFLA / tecnoPARQ-UFV",
    modalities: ["Hackathon", "AgTech", "Automação", "Tecnologia", "Startups"],
    minAge: 18,
    maxAge: null,
    eligibility: "Equipes de 3 a 6 integrantes, todos maiores de 18 anos, de qualquer lugar do Brasil, com solução tecnológica para a cadeia produtiva do café.",
    city: "Brasil",
    state: "",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição", "Hackathon", "Pré-aceleração", "Demoday"],
    registrationStart: "2026-08-13",
    registrationEnd: "2026-09-24",
    eventDate: "2026-09-26",
    officialUrl: EXTRA_SOURCES.avancaCafe,
    sourceName: "IpêTech/UFLA — Avança Café",
    evidence: "A página oficial informa inscrições gratuitas de 13/08 a 24/09/2026 e Hackathon em 26 e 27/09.",
    confidence: 100,
    status: statusFromWindow("2026-08-13", "2026-09-24"),
  })];
}

function parseMaratonaTech(html: string) {
  const text = textFromHtml(html);
  if (!/Maratona Tech/i.test(text) || !/5ª edição/i.test(text)) return [];
  return [item({
    id: "maratona-tech-2026",
    name: "Maratona Tech 2026",
    organizer: "Associação Cactus",
    modalities: ["Tecnologia", "Pensamento Computacional", "Cultura Digital", "Desafios em Equipe"],
    minAge: null,
    maxAge: null,
    eligibility: "Estudantes dos anos finais do Ensino Fundamental e do Ensino Médio, de escolas públicas ou particulares, inscritos por professor/escola.",
    city: "Online / Brasil",
    state: "",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição", "Fase 1 em equipe", "Fase 2 nacional", "Premiação"],
    registrationStart: "2026-05-25",
    registrationEnd: "2026-08-24",
    eventDate: "2026-10-05",
    officialUrl: EXTRA_SOURCES.maratonaTech,
    sourceName: "Maratona Tech — site oficial",
    evidence: "O site oficial informa inscrições de 25/05 a 24/08, Fase 1 de 03/08 a 20/09 e Fase 2 de 05/10 a 19/10/2026.",
    confidence: 100,
    status: statusFromWindow("2026-05-25", "2026-08-24"),
  })];
}

function parseWro(html: string) {
  const text = textFromHtml(html);
  if (!/ETAPA NACIONAL/i.test(text) || !/29\s+de\s+agosto\s+de\s+2026/i.test(text)) return [];
  return [item({
    id: "wro-brasil-2026",
    name: "World Robot Olympiad Brasil 2026",
    organizer: "WRO Brasil",
    modalities: ["Robótica", "Programação", "Engenharia", "Robôs Autônomos"],
    minAge: null,
    maxAge: null,
    eligibility: "Equipes de estudantes conforme as categorias etárias e técnicas definidas pela WRO. Consulte o regulamento oficial da temporada.",
    city: "Joinville",
    state: "SC",
    country: "Brasil",
    level: "Nacional / Internacional",
    stages: ["Etapas classificatórias", "Etapa nacional", "Internacional"],
    registrationStart: null,
    registrationEnd: null,
    eventDate: "2026-08-29",
    officialUrl: EXTRA_SOURCES.wro,
    sourceName: "WRO Brasil — inscrições",
    evidence: "A página oficial de inscrição informa a etapa nacional em 29/08/2026 no Centreventos Cau Hansen, em Joinville/SC.",
    confidence: 88,
    status: todayKey() > "2026-08-29" ? "CLOSED" : "UNKNOWN",
  })];
}

function parseCbr(html: string) {
  const text = textFromHtml(html);
  if (!/Cronograma de Inscrições\s+2026/i.test(text) || !/22\/06\s+a\s+24\/08\/2026/i.test(text)) return [];
  return [item({
    id: "cbr-petrobras-2026",
    name: "Competição Brasileira de Robótica PETROBRAS 2026",
    organizer: "RoboCup Brasil",
    modalities: ["Robótica", "RoboCup Soccer", "RoboCup @Home", "Robôs Aéreos"],
    minAge: null,
    maxAge: null,
    eligibility: "Equipes vinculadas a instituições educacionais e enquadradas nas ligas/categorias da CBR; requisitos específicos dependem de cada liga.",
    city: "João Pessoa",
    state: "PB",
    country: "Brasil",
    level: "Nacional",
    stages: ["Inscrição", "Avaliação de TDP", "Qualificação", "Competição nacional"],
    registrationStart: "2026-06-22",
    registrationEnd: "2026-08-24",
    eventDate: "2026-11-23",
    officialUrl: EXTRA_SOURCES.cbr,
    sourceName: "CBR PETROBRAS — inscrições oficiais",
    evidence: "A página oficial informa inscrições de equipes de 22/06 a 24/08/2026 e etapas de avaliação/qualificação posteriores.",
    confidence: 100,
    status: statusFromWindow("2026-06-22", "2026-08-24"),
  })];
}

const PARSERS: Record<ExtraKey, (html: string) => LiveCompetition[]> = {
  febrace: parseFebrace,
  campusMobile: parseCampusMobile,
  teenTech: parseTeenTech,
  latinoware: parseLatinoware,
  avancaCafe: parseAvancaCafe,
  maratonaTech: parseMaratonaTech,
  wro: parseWro,
  cbr: parseCbr,
};

export async function scanExtraOfficialCompetitions({ fresh = false }: { fresh?: boolean } = {}) {
  const entries = Object.entries(EXTRA_SOURCES) as Array<[ExtraKey, string]>;
  const settled = await Promise.allSettled(entries.map(async ([key, url]) => ({ key, html: await fetchOfficial(url, fresh) })));
  const items: LiveCompetition[] = [];
  const errors: string[] = [];
  let sourcesChecked = 0;

  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    const [key] = entries[index];
    if (result.status === "rejected") {
      errors.push(`${key}: ${result.reason instanceof Error ? result.reason.message : "falha ao consultar fonte"}`);
      continue;
    }
    sourcesChecked += 1;
    try {
      items.push(...PARSERS[key](result.value.html));
    } catch (error) {
      errors.push(`${key}: ${error instanceof Error ? error.message : "erro de interpretação"}`);
    }
  }

  return { items, errors, sourcesChecked };
}

export { EXTRA_SOURCES };
