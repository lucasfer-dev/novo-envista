export function getGreeting(hour: number) {
  return hour >= 6 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 19 ? "Boa tarde" : "Boa noite";
}

export function validateParticipantLocation(city: string, state: string) {
  return city.trim().length > 0 && state.trim().length > 0;
}

export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function canFollowProject(authorType: "user" | "team", authorId: string) {
  return authorId !== "u1" && !(authorType === "team" && ["t1", "t2"].includes(authorId));
}
