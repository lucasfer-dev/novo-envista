export type AgeBand = "child" | "adolescent" | "adult";

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

function brazilDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const number = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { year: number("year"), month: number("month"), day: number("day") };
}

function dateKey(year: number, month: number, day: number) {
  return year * 10_000 + month * 100 + day;
}

export function parseBirthDate(value: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = brazilDateParts(now);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    dateKey(year, month, day) > dateKey(today.year, today.month, today.day)
  ) {
    return null;
  }

  let age = today.year - year;
  const birthdayPassed = today.month > month || (today.month === month && today.day >= day);
  if (!birthdayPassed) age -= 1;
  if (age < 0 || age > 130) return null;

  return date;
}

export function formatBirthDateForSerpro(value: string, now = new Date()) {
  const date = parseBirthDate(value, now);
  if (!date) return null;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  return `${day}${month}${year}`;
}

export function ageBandFromBirthDate(value: string, now = new Date()): AgeBand | null {
  const date = parseBirthDate(value, now);
  if (!date) return null;

  const today = brazilDateParts(now);
  const birthMonth = date.getUTCMonth() + 1;
  const birthDay = date.getUTCDate();
  let age = today.year - date.getUTCFullYear();
  const birthdayPassed =
    today.month > birthMonth || (today.month === birthMonth && today.day >= birthDay);
  if (!birthdayPassed) age -= 1;

  if (age < 12) return "child";
  if (age < 18) return "adolescent";
  return "adult";
}
