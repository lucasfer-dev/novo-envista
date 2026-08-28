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
}

export interface LiveCompetitionsResponse {
  items: LiveCompetition[];
  checkedAt: string;
  sourcesChecked: number;
  errors: string[];
  mode: string;
}
