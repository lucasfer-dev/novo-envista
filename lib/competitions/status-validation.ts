import type { LiveCompetition } from "./types";

export function normalizeCompetitionStatus(event: LiveCompetition, now = new Date()): LiveCompetition {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (key: string) => parts.find((item) => item.type === key)?.value || "";
  const today = [part("year"), part("month"), part("day")].join("-");
  const isDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  if (isDate(event.registrationEnd) && event.registrationEnd < today) return { ...event, status: "CLOSED" };
  if (isDate(event.registrationStart) && event.registrationStart > today && event.status === "OPEN") return { ...event, status: "UPCOMING" };
  if (!isDate(event.registrationEnd) && isDate(event.eventDate) && event.eventDate < today && event.status === "OPEN") return { ...event, status: "CLOSED" };
  return event;
}
