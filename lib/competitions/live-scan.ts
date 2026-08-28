import type { CompetitionStatus, LiveCompetition, LiveCompetitionsResponse } from "@/lib/competitions/types";

const YEAR = 2026;

const SOURCES = {
  mnr: "https://mnr.robocup.org.br/cronograma/",
  tjr: "https://torneiojrobotica.org/CALEND%C3%81RIO-2026/",
  robocode: "https://robotica.cps.sp.gov.br/robocode-2026/",
  obr: "https://obr.robocup.org.br/2026/03/12/inscricoes-abertas-para-a-olimpiada-brasileira-de-robotica-2026/",
  fllExplore: "https://www.firstlegoleague.com.br/first-lego-league-explore",
  fllChallenge: "https://www.firstlegoleague.com.br/first-lego-league-challenge",
} as const;

const STATE_CODES: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA", "mato grosso": "MT",
  "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA", paraiba: "PB", parana: "PR",
  pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS",
  rondonia: "RO", roraima: "RR", "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ordm;/gi, "º")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú");
}

function htmlToLines(html: string) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|tr|td|th|h1|h2|h3|h4|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function isoDate(raw: string | null | undefined, year = YEAR) {
  if (!raw) return null;
  const match = raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const actualYear = Number(match[3] || year);
  if (!day || !month) return null;
  return `${actualYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDate(raw: string | null | undefined, year = YEAR) {
  if (!raw) return null;
  const matches = [...raw.matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/g)];
  const match = matches.at(-1);
  if (!match) return isoDate(raw, year);
  return isoDate(match[0], year);
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
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; EnvistaCompetitionFinder/1.0; +https://envista-novo.vercel.app)",
      },
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 900 } }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function stateCodeFromLabel(label: string) {
  const normalized = normalize(label);
  for (const [name, code] of Object.entries(STATE_CODES)) {
    if (normalized === name || normalized.endsWith(`, ${name}`)) return code;
  }
  const code = label.match(/\b([A-Z]{2})\b/)?.[1];
  return code || "";
}

function cityFromMnr(label: string, location: string, state: string) {
  if (label.includes(",")) return label.split(",")[0].trim();
  const slash = location.match(/([A-Za-zÀ-ÿ .'-]+)\s*\/\s*[A-Z]{2}\b/);
  if (slash) return slash[1].split("–").at(-1)?.trim() || slash[1].trim();
  const dash = location.match(/([A-Za-zÀ-ÿ .'-]+)\s*[–-]\s*[A-Z]{2}\b/);
  if (dash) return dash[1].split(",").at(-1)?.trim() || dash[1].trim();
  const known: Record<string, string> = {
    AC: "Rio Branco", AM: "Manaus", PB: "João Pessoa", PE: "Recife", RJ: "Volta Redonda", RS: "Porto Alegre", SP: "São Caetano do Sul", MT: "Rondonópolis",
  };
  return known[state] || label;
}

function parseMnr(html: string): LiveCompetition[] {
  const text = htmlToLines(html);
  const rows: LiveCompetition[] = [];

  const nationalStart = isoDate(text.match(/Início das inscrições:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1]);
  const nationalEnd = isoDate(text.match(/Fim das inscrições:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1]);
  if (nationalStart || nationalEnd) {
    rows.push(item({
      id: `mnr-nacional-${nationalEnd || YEAR}`,
      name: `Mostra Nacional de Robótica ${YEAR}`,
      organizer: "Mostra Nacional de Robótica / RoboCup Brasil",
      modalities: ["Projetos Inovadores", "Robótica", "Ciência e Tecnologia"],
      minAge: null,
      maxAge: null,
      eligibility: "Projetos de diferentes níveis de ensino; o enquadramento depende da categoria e do regulamento oficial.",
      city: "João Pessoa",
      state: "PB",
      country: "Brasil",
      level: "Nacional",
      stages: ["Mostra Nacional", "Presencial", "Virtual"],
      registrationStart: nationalStart,
      registrationEnd: nationalEnd,
      eventDate: "2026-11-23",
      officialUrl: SOURCES.mnr,
      sourceName: "MNR — Cronograma oficial 2026",
      evidence: nationalEnd ? `O cronograma oficial informa inscrições de ${nationalStart?.split("-").reverse().join("/")} até ${nationalEnd.split("-").reverse().join("/")}.` : "Período de inscrição identificado no cronograma oficial.",
      confidence: 100,
      status: statusFromWindow(nationalStart, nationalEnd),
    }));
  }

  const pattern = /(?:^|\n)([^\n]+)\nRep:[^\n]*\nInício das inscrições:\s*(\d{1,2}\/\d{1,2}\/\d{4})\nFim das inscrições:\s*(\d{1,2}\/\d{1,2}\/\d{4})\nData evento:\s*([^\n]+)\nLocal evento:\s*([^\n]+)/g;
  for (const match of text.matchAll(pattern)) {
    const label = match[1].trim();
    const start = isoDate(match[2]);
    const end = isoDate(match[3]);
    const eventDate = isoDate(match[4]);
    const location = match[5].trim();
    const state = stateCodeFromLabel(label) || stateCodeFromLabel(location);
    const city = cityFromMnr(label, location, state);
    const sectionIndex = text.indexOf(match[0]);
    const regionalIndex = text.indexOf("Etapas Regionais");
    const level = regionalIndex >= 0 && sectionIndex > regionalIndex ? "Regional" : "Estadual";
    const status = statusFromWindow(start, end);
    rows.push(item({
      id: `mnr-${state || "BR"}-${label}-${end || eventDate || YEAR}`,
      name: `MNR ${YEAR} — ${label}`,
      organizer: "Mostra Nacional de Robótica / RoboCup Brasil",
      modalities: ["Projetos Inovadores", "Robótica", "Ciência e Tecnologia"],
      minAge: null,
      maxAge: null,
      eligibility: "A MNR recebe projetos de diferentes níveis de ensino. A categoria exata deve ser confirmada no regulamento oficial.",
      city,
      state,
      country: "Brasil",
      level,
      stages: [level],
      registrationStart: start,
      registrationEnd: end,
      eventDate,
      officialUrl: SOURCES.mnr,
      sourceName: "MNR — Cronograma oficial 2026",
      evidence: status === "OPEN"
        ? `O cronograma oficial informa inscrições vigentes até ${match[3]}.`
        : status === "UPCOMING"
          ? `O cronograma oficial informa abertura das inscrições em ${match[2]}.`
          : `O cronograma oficial informa encerramento das inscrições em ${match[3]}.`,
      confidence: 100,
      status,
    }));
  }
  return rows;
}

function parseTjr(html: string): LiveCompetition[] {
  const rows: LiveCompetition[] = [];
  for (const tr of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const raw = tr[0];
    const text = htmlToLines(raw).replace(/\n+/g, " | ");
    const eventMatch = text.match(/TJR\s+([A-Z]{2})\s*[-–]\s*([^|]+)/i);
    const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2})(?:\/\d{4})?\b/);
    if (!eventMatch || !dateMatch) continue;
    const state = eventMatch[1].toUpperCase();
    const city = eventMatch[2].trim().replace(/\s{2,}/g, " ");
    const eventDate = isoDate(dateMatch[1]);
    if (!eventDate) continue;
    const today = todayKey();
    const hasRegistrationLink = /href=["'][^"']+(?:docs\.google\.com|forms\.gle|form|inscri)[^"']*["']/i.test(raw) || />\s*LINK\s*</i.test(raw);
    const status: CompetitionStatus = eventDate < today ? "CLOSED" : hasRegistrationLink ? "OPEN" : "UNKNOWN";
    const cells = text.split("|").map((value) => value.trim()).filter(Boolean);
    const support = cells.find((value) => !/^\d{1,2}\/\d{1,2}/.test(value) && !/TJR\s+[A-Z]{2}/i.test(value) && !/^LINK$/i.test(value) && !/Data|Equipes|Inscri/i.test(value));
    rows.push(item({
      id: `tjr-${state}-${city}-${eventDate}`,
      name: `TJR ${YEAR} — ${city}`,
      organizer: "Instituto TJR / Torneio Juvenil de Robótica",
      modalities: ["Robótica", "Sumô de Robôs", "Resgate", "Robô Autônomo", "Drones"],
      minAge: null,
      maxAge: null,
      eligibility: `A idade depende do desafio escolhido.${support ? ` Instituição de apoio: ${support}.` : ""} Consulte o regulamento oficial.`,
      city,
      state,
      country: "Brasil",
      level: "Regional",
      stages: ["Regional", "Final Anual"],
      registrationStart: null,
      registrationEnd: null,
      eventDate,
      officialUrl: SOURCES.tjr,
      sourceName: "TJR — Calendário oficial 2026",
      evidence: status === "CLOSED"
        ? "A data da etapa publicada no calendário oficial já passou."
        : hasRegistrationLink
          ? "A etapa futura está no calendário oficial e a linha possui link de inscrição. O calendário não informa prazo final específico."
          : "A etapa futura está no calendário oficial, mas não foi possível confirmar inscrição aberta nesta consulta.",
      confidence: hasRegistrationLink ? 90 : 82,
      status,
    }));
  }
  return rows;
}

function parseRobocode(html: string): LiveCompetition[] {
  const text = htmlToLines(html);
  const deadlineRaw = text.match(/Até\s+(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] || text.match(/até\s+(\d{1,2}\/\d{1,2})/i)?.[1];
  const end = isoDate(deadlineRaw);
  const hasRegistration = /Inscrever Equipe|link de inscrição/i.test(text);
  const status = end ? statusFromWindow(null, end) : hasRegistration ? "OPEN" : "UNKNOWN";
  return [item({
    id: "robocode-cps-2026",
    name: "14º Torneio Robocode 2026",
    organizer: "Centro Paula Souza",
    modalities: ["Programação", "Robótica Virtual", "Tecnologia", "Java"],
    minAge: null,
    maxAge: null,
    eligibility: "Exclusivo para alunos matriculados em Etecs e Fatecs; equipes de até 3 integrantes.",
    city: "Online / unidades CPS",
    state: "SP",
    country: "Brasil",
    level: "Estadual",
    stages: ["Fase Local", "Grande Final Online"],
    registrationStart: null,
    registrationEnd: end,
    eventDate: "2026-11-01",
    officialUrl: SOURCES.robocode,
    sourceName: "Centro Paula Souza — Robocode 2026",
    evidence: end ? `A página oficial oferece inscrição e informa prazo até ${deadlineRaw}.` : "A página oficial do torneio foi localizada, mas o prazo não pôde ser extraído.",
    confidence: end && hasRegistration ? 100 : 85,
    status,
  })];
}

function parseObr(html: string): LiveCompetition[] {
  const text = htmlToLines(html);
  const practical = text.match(/Modalidade Prática[\s\S]*?(\d{1,2}\s+de\s+março\s+a\s+\d{1,2}\s+de\s+abril)/i);
  const theoretical = text.match(/Modalidade Teórica[\s\S]*?(\d{1,2}\s+de\s+março\s+a\s+\d{1,2}\s+de\s+junho)/i);
  const rows: LiveCompetition[] = [];
  if (practical || /12 de março a 30 de abril/i.test(text)) {
    rows.push(item({
      id: "obr-pratica-2026",
      name: "OBR 2026 — Modalidade Prática",
      organizer: "Olimpíada Brasileira de Robótica / RoboCup Brasil",
      modalities: ["Robótica", "Resgate", "Robótica Artística", "Robótica Virtual"],
      minAge: null,
      maxAge: null,
      eligibility: "Estudantes de escolas públicas ou privadas do ensino fundamental, médio ou técnico integrado; níveis definidos por ano escolar e modalidade.",
      city: "Brasil",
      state: "",
      country: "Brasil",
      level: "Nacional",
      stages: ["Regional", "Estadual", "Nacional"],
      registrationStart: "2026-03-12",
      registrationEnd: "2026-04-30",
      eventDate: "2026-11-23",
      officialUrl: SOURCES.obr,
      sourceName: "OBR — Calendário de inscrições 2026",
      evidence: "A notícia oficial informa período de inscrição da modalidade prática de 12/03 a 30/04/2026.",
      confidence: 100,
      status: statusFromWindow("2026-03-12", "2026-04-30"),
    }));
  }
  if (theoretical || /12 de março a 12 de junho/i.test(text)) {
    rows.push(item({
      id: "obr-teorica-2026",
      name: "OBR 2026 — Modalidade Teórica",
      organizer: "Olimpíada Brasileira de Robótica / RoboCup Brasil",
      modalities: ["Robótica", "Olimpíada Científica", "Tecnologia"],
      minAge: null,
      maxAge: null,
      eligibility: "Estudantes de escolas públicas ou privadas do ensino fundamental, médio ou técnico integrado; participação organizada pela instituição de ensino.",
      city: "Brasil",
      state: "",
      country: "Brasil",
      level: "Nacional",
      stages: ["Fase 1", "Fase 2"],
      registrationStart: "2026-03-12",
      registrationEnd: "2026-06-12",
      eventDate: "2026-08-11",
      officialUrl: SOURCES.obr,
      sourceName: "OBR — Calendário de inscrições 2026",
      evidence: "A notícia oficial informa período de inscrição da modalidade teórica de 12/03 a 12/06/2026.",
      confidence: 100,
      status: statusFromWindow("2026-03-12", "2026-06-12"),
    }));
  }
  return rows;
}

function parseFllExplore(html: string): LiveCompetition[] {
  const text = htmlToLines(html);
  const open = /Inscrições abertas!?/i.test(text) && /Fazer inscrição|Inscreva as suas equipes/i.test(text);
  return [item({
    id: "fll-explore-2026",
    name: "FIRST LEGO League Explore",
    organizer: "FIRST / Educacional - Positivo Tecnologia",
    modalities: ["Robótica Educacional", "Projetos Inovadores", "LEGO"],
    minAge: 6,
    maxAge: 10,
    eligibility: "Equipes de até 6 alunos, de 6 a 10 anos; pode ser atividade escolar, extracurricular ou equipe independente.",
    city: "Brasil",
    state: "",
    country: "Brasil",
    level: "Internacional",
    stages: ["Local", "Regional", "Nacional", "Internacional"],
    registrationStart: null,
    registrationEnd: null,
    eventDate: null,
    officialUrl: SOURCES.fllExplore,
    sourceName: "FIRST LEGO League Brasil — Explore",
    evidence: open ? "A página oficial exibe 'Inscrições abertas!' e oferece ação para fazer a inscrição." : "A página oficial foi consultada, mas a abertura das inscrições não foi confirmada nesta leitura.",
    confidence: open ? 100 : 75,
    status: open ? "OPEN" : "UNKNOWN",
  })];
}

function parseFllChallenge(html: string): LiveCompetition[] {
  const text = htmlToLines(html);
  const hasParticipation = /Inscreva-se no site do operador nacional/i.test(text);
  return [item({
    id: "fll-challenge-2026",
    name: "FIRST LEGO League Challenge",
    organizer: "FIRST / SESI Departamento Nacional",
    modalities: ["Robótica Educacional", "LEGO", "Projeto de Inovação"],
    minAge: 9,
    maxAge: 15,
    eligibility: "Equipes de estudantes de 9 a 15 anos; detalhes de inscrição e calendário são publicados pelo operador nacional SESI.",
    city: "Brasil",
    state: "",
    country: "Brasil",
    level: "Internacional",
    stages: ["Regional", "Nacional", "Internacional"],
    registrationStart: null,
    registrationEnd: null,
    eventDate: null,
    officialUrl: SOURCES.fllChallenge,
    sourceName: "FIRST LEGO League Brasil — Challenge",
    evidence: hasParticipation ? "A página oficial orienta a inscrição pelo operador nacional, mas não publica nesta página um período de inscrição verificável." : "A página oficial foi encontrada sem período de inscrição verificável.",
    confidence: 80,
    status: "UNKNOWN",
  })];
}

function dedupe(items: LiveCompetition[]) {
  const map = new Map<string, LiveCompetition>();
  for (const competition of items) {
    const key = normalize(`${competition.name}|${competition.city}|${competition.eventDate || ""}`);
    const current = map.get(key);
    if (!current || competition.confidence > current.confidence) map.set(key, competition);
  }
  return Array.from(map.values());
}

export async function scanOfficialCompetitions({ fresh = false }: { fresh?: boolean } = {}): Promise<LiveCompetitionsResponse> {
  const entries = Object.entries(SOURCES) as Array<[keyof typeof SOURCES, string]>;
  const settled = await Promise.allSettled(entries.map(async ([key, url]) => ({ key, html: await fetchOfficial(url, fresh) })));
  const items: LiveCompetition[] = [];
  const errors: string[] = [];

  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    const [key] = entries[index];
    if (result.status === "rejected") {
      errors.push(`${key}: ${result.reason instanceof Error ? result.reason.message : "falha ao consultar fonte"}`);
      continue;
    }
    try {
      if (key === "mnr") items.push(...parseMnr(result.value.html));
      if (key === "tjr") items.push(...parseTjr(result.value.html));
      if (key === "robocode") items.push(...parseRobocode(result.value.html));
      if (key === "obr") items.push(...parseObr(result.value.html));
      if (key === "fllExplore") items.push(...parseFllExplore(result.value.html));
      if (key === "fllChallenge") items.push(...parseFllChallenge(result.value.html));
    } catch (error) {
      errors.push(`${key}: ${error instanceof Error ? error.message : "erro de interpretação"}`);
    }
  }

  const finalItems = dedupe(items).sort((a, b) => {
    const order: Record<CompetitionStatus, number> = { OPEN: 0, UPCOMING: 1, UNKNOWN: 2, CLOSED: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    const aDate = a.registrationEnd || a.eventDate || "9999-12-31";
    const bDate = b.registrationEnd || b.eventDate || "9999-12-31";
    return aDate.localeCompare(bDate);
  });

  return {
    items: finalItems,
    checkedAt: new Date().toISOString(),
    sourcesChecked: settled.filter((result) => result.status === "fulfilled").length,
    errors,
    mode: fresh ? "envista-live-official-scan-fresh-v1" : "envista-live-official-scan-v1",
  };
}

export { SOURCES };
