import { investor, people, teams } from "../data/mock";
import { Team, User } from "../types";

export type ProfileKind = "participant" | "investor" | "team";
export type AppContext = "participant" | "investor";

export function getParticipantById(idOrUsername: string): User | undefined {
  return people.find((person) =>
    person.role === "participant" && [person.id, person.username].includes(idOrUsername),
  );
}

export function getInvestorById(idOrUsername: string): User | undefined {
  return [investor].find((person) =>
    [person.id, person.username].includes(idOrUsername),
  );
}

export function getTeamById(idOrSlug: string, source: Team[] = teams): Team | undefined {
  return source.find((team) => [team.id, team.slug].includes(idOrSlug));
}

export function profileRoute(
  kind: ProfileKind,
  idOrSlug: string,
  context: AppContext = "participant",
): string {
  const base = context === "investor" ? "/investor" : "/app";
  if (kind === "team") return `${base}/teams/${idOrSlug}`;
  return `${base}/${kind === "participant" ? "participants" : "investors"}/${idOrSlug}`;
}
