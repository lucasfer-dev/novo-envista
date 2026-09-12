import { describe, expect, it } from "vitest";
import { ageBandFromBirthDate, formatBirthDateForSerpro, parseBirthDate } from "./birth-date";

const now = new Date("2026-09-11T12:00:00.000Z");

describe("birth date identity helpers", () => {
  it("formats ISO dates for Serpro as DDMMAAAA", () => {
    expect(formatBirthDateForSerpro("2007-07-03", now)).toBe("03072007");
  });

  it("rejects impossible and future dates", () => {
    expect(parseBirthDate("2026-02-30", now)).toBeNull();
    expect(parseBirthDate("2027-01-01", now)).toBeNull();
  });

  it("derives child, adolescent and adult bands", () => {
    expect(ageBandFromBirthDate("2018-01-01", now)).toBe("child");
    expect(ageBandFromBirthDate("2010-01-01", now)).toBe("adolescent");
    expect(ageBandFromBirthDate("2000-01-01", now)).toBe("adult");
  });

  it("uses the Brazil calendar day near midnight UTC", () => {
    const lateEveningInBrazil = new Date("2026-09-12T01:30:00.000Z");
    expect(parseBirthDate("2026-09-12", lateEveningInBrazil)).toBeNull();
    expect(ageBandFromBirthDate("2008-09-12", lateEveningInBrazil)).toBe("adolescent");
  });
});
