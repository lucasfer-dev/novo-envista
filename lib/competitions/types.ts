export type CompetitionStatus = "OPEN" | "UPCOMING" | "CLOSED" | "UNKNOWN";

export interface LiveCompetition {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  modalities: string[];
  minAge: number | null;
  maxAge: number | null;
  eligibility: string;
  city: string;
  state: string;
  country: string;
  level: string;
  stages: string[];
  registrationStart: string | null;
  registrationEnd: string | null;
  eventDate: string | null;
  officialUrl: string;
  sourceName: string;
  evidence: string;
  confidence: number;
  status: CompetitionStatus;
  description?: string;
  type?: string;
  areas?: string[];
  targetAudience?: string[];
  participation?: "Individual" | "Equipe" | "Ambos" | string;
  scope?: string;
  format?: "Presencial" | "Online" | "Híbrida" | string;
  free?: boolean | null;
  task?: string;
  prize?: string;
  registrationUrl?: string;
  regulationUrl?: string;
  socialUrls?: string[];
}

export interface LiveCompetitionsResponse {
  items: LiveCompetition[];
  checkedAt: string;
  sourcesChecked: number;
  errors: string[];
  mode: string;
}
