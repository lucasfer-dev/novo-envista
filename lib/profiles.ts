import { investor, people, teams } from "../data/mock";
import { Team, User } from "../types";

export type ProfileKind = "participant" | "investor" | "team";
export type EntityKind = ProfileKind | "project";
export type AppContext = "participant" | "investor";
export type NavigationSource = "explore" | "social" | "messages" | "management";

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
  const base = context === "investor" ? "/investor" : "";
  if (kind === "team") return `${base}/teams/${idOrSlug}`;
  return `${base}/${kind === "participant" ? "participants" : "investors"}/${idOrSlug}`;
}

export function entityRoute({
  type,
  id,
  source,
  context = "participant",
}: {
  type: EntityKind;
  id: string;
  source: NavigationSource;
  context?: AppContext;
}): string {
  const base = context === "investor" ? "/investor" : "";
  const segment = type === "participant" ? "participants" : type === "investor" ? "investors" : `${type}s`;
  return source === "management" ? `${base}/${segment}/${id}` : `${base}/${source}/${segment}/${id}`;
}

export function parsePublicEntityRoute(pathname: string): {
  context: AppContext;
  source: Exclude<NavigationSource, "management">;
  type: EntityKind;
  id: string;
} | undefined {
  const clean = pathname.match(/^\/(explore|social|messages)\/(participants|investors|teams|projects)\/([^/]+)$/);
  const scoped = pathname.match(/^\/(app|investor)\/(explore|social|messages)\/(participants|investors|teams|projects)\/([^/]+)$/);
  if (!clean && !scoped) return undefined;
  const source = (clean?.[1] || scoped?.[2]) as "explore" | "social" | "messages";
  const segment = clean?.[2] || scoped?.[3] || "";
  const id = clean?.[3] || scoped?.[4] || "";
  const type = segment === "participants" ? "participant" : segment === "investors" ? "investor" : segment.slice(0, -1) as EntityKind;
  return { context: scoped?.[1] === "investor" ? "investor" : "participant", source, type, id };
}
