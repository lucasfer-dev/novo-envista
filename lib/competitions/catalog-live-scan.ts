import { VERIFIED_COMPETITION_CATALOG_2026 } from "@/lib/competitions/catalog-2026";
import type { CompetitionStatus, LiveCompetition } from "@/lib/competitions/types";

type CatalogScannerSource = {
  id: string;
  url: string;
  aliases: RegExp[];
};

const MONTHS: Record<string, number> = {
  janeiro: 1, jan: 1,
  fevereiro: 2, fev: 2,
  marco: 3, mar: 3,
  abril: 4, abr: 4,
  maio: 5, mai: 5,
  junho: 6, jun: 6,
  julho: 7, jul: 7,
  agosto: 8, ago: 8,
  setembro: 9, set: 9,
  outubro: 10, out: 10,
  novembro: 11, nov: 11,
  dezembro: 12, dez: 12,
};

export const CATALOG_SCANNER_SOURCES: Record<string, CatalogScannerSource> = {
  "obm-2026": {
    id: "obm-2026",
    url: "https://www.obm.org.br/informacoes-gerais/calendario",
    aliases: [/Olimp[ií]ada Brasileira de Matem[aá]tica/i, /\bOBM\b/i],
  },
  "obmep-2026": {
    id: "obmep-2026",
    url: "https://www.obmep.org.br/regulamento.htm",
    aliases: [/Olimp[ií]ada Brasileira de Matem[aá]tica das Escolas P[uú]blicas/i, /\bOBMEP\b/i],
  },
  "obf-2026": {
    id: "obf-2026",
    url: "https://www1.fisica.org.br/olimpiada/2026/index.php/calendario",
    aliases: [/Olimp[ií]ada Brasileira de F[ií]sica/i, /\bOBF\b/i],
  },
  "obi-2026": {
    id: "obi-2026",
    url: "https://olimpiada.ic.unicamp.br/",
    aliases: [/Olimp[ií]ada Brasileira de Inform[aá]tica/i, /\bOBI\b/i],
  },
  "obq-2026": {
    id: "obq-2026",
    url: "https://obquimica.org/olimpiada/olimpiada-brasileira-de-quimica",
    aliases: [/Olimp[ií]ada Brasileira de Qu[ií]mica/i, /\bOBQ\b/i],
  },
  "obb-2026": {
    id: "obb-2026",
    url: "https://olimpiadasdebiologia.butantan.gov.br/cronograma",
    aliases: [/Olimp[ií]ada Brasileira de Biologia/i, /\bOBB\b/i],
  },
  "obg-2026": {
    id: "obg-2026",
    url: "https://obgeografia.com.br/",
    aliases: [/Olimp[ií]ada Brasileira de Geografia/i, /\bOBG\b/i],
  },
  "onc-2026": {
    id: "onc-2026",
    url: "https://onciencias.org/",
    aliases: [/Olimp[ií]ada Nacional de Ci[eê]ncias/i, /\bONC\b/i],
  },
  "onee-2026": {
    id: "onee-2026",
    url: "https://onee.org.br/",
    aliases: [/Olimp[ií]ada Nacional de Efici[eê]ncia Energ[eé]tica/i, /\bONEE\b/i],
  },
  "fecti-2026": {
    id: "fecti-2026",
    url: "https://fecti.cecierj.edu.br/login",
    aliases: [/Feira de Ci[eê]ncia,? Tecnologia e Inova[cç][aã]o/i, /\bFECTI\b/i],
  },
  "febic-2026": {
    id: "febic-2026",
    url: "https://www.ibicsc.com.br/public/febic.php",
    aliases: [/Feira Brasileira de Inicia[cç][aã]o Cient[ií]fica/i, /\bFEBIC\b/i],
  },
  "desafio-liga-jovem-2026": {
    id: "desafio-liga-jovem-2026",
    url: "https://www.desafioligajovem.com.br/",
    aliases: [/Desafio Liga Jovem/i, /Liga Jovem/i],
  },
  onda: {
    id: "onda",
    url: "https://uergs.edu.br/mais-pela-extensao",
    aliases: [/Olimp[ií]ada Nacional de Aplicativos/i, /\bONDA\b/i],
  },
  "desafio-led-globo-2026": {
    id: "desafio-led-globo-2026",
    url: "https://somos.globo.com/movimento-led/desafio-led/",
    aliases: [/Desafio LED/i, /Me D[aá] Uma Luz A[ií]/i, /Movimento LED/i],
  },
  sapientia: {
    id: "sapientia",
    url: "https://olimpiadadofuturo.com.br/",
    aliases: [/Sapientia/i, /Olimp[ií]ada do Futuro/i],
  },
  "mostratec-2026": {
    id: "mostratec-2026",
    url: "https://mostratec.liberato.com.br/cronograma/",
    aliases: [/MOSTRATEC/i, /Mostra Internacional de Ci[eê]ncia e Tecnologia/i],
  },
  "obt-2026": {
    id: "obt-2026",
    url: "https://www.alphalumen.org.br/olimpiada-brasileira-de-tecnologia-obt/",
    aliases: [/Olimp[ií]ada Brasileira de Tecnologia/i, /\bOBT\b/i],
  },
  "oba-2026": {
    id: "oba-2026",
    url: "https://www.oba.org.br/",
    aliases: [/Olimp[ií]ada Brasileira de Astronomia e Astron[aá]utica/i, /\bOBA\b/i],
  },
  "solve-for-tomorrow-brasil-2026": {
    id: "solve-for-tomorrow-brasil-2026",
    url: "https://solvefortomorrowbrasil.com.br/",
    aliases: [/Solve for Tomorrow/i, /Samsung.*Tomorrow/i],
  },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&atilde;/gi, "ã")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
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

function iso(year: number, month: number, day: number) {
  if (!year || !month || !day || month > 12 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateToken(token: string, fallbackYear: number) {
  const slash = token.match(/(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/);
  if (slash) {
    let year = Number(slash[3] || fallbackYear);
    if (year < 100) year += 2000;
    return iso(year, Number(slash[2]), Number(slash[1]));
  }

  const named = normalize(token).match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(20\d{2})/);
  if (!named) return null;
  return iso(Number(named[3]), MONTHS[named[2]] || 0, Number(named[1]));
}

function registrationDates(text: string, base: LiveCompetition) {
  const normalized = normalize(text);
  const currentYear = Number(todayKey().slice(0, 4));
  const years = [...normalized.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  const fallbackYear = years.filter((year) => year >= currentYear - 1 && year <= currentYear + 2).sort((a, b) => b - a)[0] || currentYear;

  const windows: string[] = [];
  for (const match of normalized.matchAll(/inscri[cç][aã]o|inscri[cç][oõ]es|submiss[aã]o|submiss[oõ]es|cadastro|prazo|envio de projetos/g)) {
    const index = match.index ?? 0;
    windows.push(normalized.slice(Math.max(0, index - 80), Math.min(normalized.length, index + 320)));
  }
  const registrationText = windows.join(" ");

  const tokens: Array<{ index: number; value: string }> = [];
  for (const match of registrationText.matchAll(/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\b/g)) {
    tokens.push({ index: match.index ?? 0, value: match[0] });
  }
  for (const match of registrationText.matchAll(/\b\d{1,2}\s+(?:de\s+)?(?:janeiro|jan|fevereiro|fev|marco|mar|abril|abr|maio|mai|junho|jun|julho|jul|agosto|ago|setembro|set|outubro|out|novembro|nov|dezembro|dez)\s+(?:de\s+)?20\d{2}\b/g)) {
    tokens.push({ index: match.index ?? 0, value: match[0] });
  }

  const dates = Array.from(new Set(tokens.sort((a, b) => a.index - b.index).map((entry) => parseDateToken(entry.value, fallbackYear)).filter((value): value is string => Boolean(value))));
  if (!dates.length) return { start: base.registrationStart, end: base.registrationEnd, detected: false };

  // Prefer a plausible registration window close to the current/next edition.
  const plausible = dates.filter((date) => Number(date.slice(0, 4)) >= currentYear - 1 && Number(date.slice(0, 4)) <= currentYear + 2);
  const chosen = plausible.length ? plausible : dates;
  return {
    start: chosen.length >= 2 ? chosen[0] : base.registrationStart,
    end: chosen.length >= 2 ? chosen[chosen.length - 1] : chosen[0],
    detected: true,
  };
}

function statusFromWindow(start: string | null, end: string | null): CompetitionStatus {
  const today = todayKey();
  if (start && today < start) return "UPCOMING";
  if (end && today > end) return "CLOSED";
  if ((start || end) && (!start || today >= start) && (!end || today <= end)) return "OPEN";
  return "UNKNOWN";
}

function textualStatus(text: string): CompetitionStatus | null {
  const normalized = normalize(text);
  const open = /inscricoes abertas|inscricao aberta|inscreva-se|faca sua inscricao|participe agora|submissoes abertas/.test(normalized);
  const closed = /inscricoes encerradas|inscricao encerrada|prazo encerrado|submissoes encerradas/.test(normalized);
  const upcoming = /inscricoes em breve|proxima edicao|aguarde a proxima edicao|em breve/.test(normalized);
  if (open && !closed) return "OPEN";
  if (closed && !open) return "CLOSED";
  if (upcoming && !open) return "UPCOMING";
  return null;
}

function pageMentionsSource(text: string, source: CatalogScannerSource) {
  return source.aliases.some((pattern) => pattern.test(text));
}

async function fetchOfficial(url: string, fresh: boolean) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; EnvistaCompetitionMonitor/2.0; +https://useenvista.com.br)",
      },
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function liveItem(base: LiveCompetition, source: CatalogScannerSource, html: string): LiveCompetition | null {
  const text = htmlToText(html);
  if (!text || !pageMentionsSource(text, source)) return null;

  const dates = registrationDates(text, base);
  const signalStatus = textualStatus(text);
  const datedStatus = statusFromWindow(dates.start, dates.end);
  const status = dates.detected && datedStatus !== "UNKNOWN" ? datedStatus : signalStatus || datedStatus || base.status;
  const checkedAt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const evidence = dates.detected
    ? `Fonte oficial consultada em ${checkedAt}. O scanner identificou datas de inscrição na página e recalculou o status automaticamente.`
    : signalStatus
      ? `Fonte oficial consultada em ${checkedAt}. O scanner identificou o estado das inscrições pelo conteúdo publicado pela organização.`
      : `Fonte oficial consultada em ${checkedAt}. A competição foi confirmada na página; como não houve nova janela de inscrição legível, o último calendário verificado foi preservado.`;

  return {
    ...base,
    officialUrl: source.url,
    registrationStart: dates.start,
    registrationEnd: dates.end,
    status,
    sourceName: `${base.sourceName} · monitoramento automático`,
    evidence,
    confidence: dates.detected || signalStatus ? 100 : Math.max(85, Math.min(base.confidence, 98)),
  };
}

export async function scanCatalogOfficialCompetitions({ fresh = false }: { fresh?: boolean } = {}) {
  const byId = new Map(VERIFIED_COMPETITION_CATALOG_2026.map((competition) => [competition.id, competition]));
  const entries = Object.values(CATALOG_SCANNER_SOURCES);
  const settled = await Promise.allSettled(entries.map(async (source) => ({
    source,
    html: await fetchOfficial(source.url, fresh),
  })));

  const items: LiveCompetition[] = [];
  const errors: string[] = [];
  let sourcesChecked = 0;

  for (const [index, result] of settled.entries()) {
    const source = entries[index];
    const base = byId.get(source.id);
    if (!base) {
      errors.push(`${source.id}: scanner sem item correspondente no catálogo`);
      continue;
    }
    if (result.status === "rejected") {
      errors.push(`${source.id}: ${result.reason instanceof Error ? result.reason.message : "falha ao consultar fonte oficial"}`);
      continue;
    }

    sourcesChecked += 1;
    const updated = liveItem(base, result.value.source, result.value.html);
    if (updated) items.push(updated);
    else errors.push(`${source.id}: fonte respondeu, mas a competição não foi reconhecida no conteúdo atual`);
  }

  const missingScanners = VERIFIED_COMPETITION_CATALOG_2026
    .filter((competition) => !CATALOG_SCANNER_SOURCES[competition.id])
    .map((competition) => competition.id);
  for (const id of missingScanners) errors.push(`${id}: competição sem scanner oficial configurado`);

  return { items, errors, sourcesChecked };
}

export const CATALOG_SCANNER_SOURCE_IDS = Object.keys(CATALOG_SCANNER_SOURCES);
