export type AgeBand = "child" | "adolescent" | "adult";

function utcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function parseBirthDate(value: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    utcDay(date) > utcDay(now)
  ) {
    return null;
  }

  let age = now.getUTCFullYear() - year;
  const birthdayPassed =
    now.getUTCMonth() > month - 1 ||
    (now.getUTCMonth() === month - 1 && now.getUTCDate() >= day);
  if (!birthdayPassed) age -= 1;

  if (age < 0 || age > 130) return null;
  return date;
}

export function formatBirthDateForSerpro(value: string, now = new Date()) {
  const date = parseBirthDate(value, now);
  if (!date) return null;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}${month}${date.getUTCFullYear()}`;
}

export function ageBandFromBirthDate(value: string, now = new Date()): AgeBand | null {
  const date = parseBirthDate(value, now);
  if (!date) return null;

  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const birthdayPassed =
    now.getUTCMonth() > date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() >= date.getUTCDate());
  if (!birthdayPassed) age -= 1;

  if (age < 12) return "child";
  if (age < 18) return "adolescent";
  return "adult";
}
