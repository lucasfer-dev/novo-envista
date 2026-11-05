import { describe, expect, it } from "vitest";
import { normalizeCompetitionStatus } from "./status-validation";
import type { LiveCompetition } from "./types";

const event = (data: Partial<LiveCompetition>) => ({
  id: "fixture", slug: "fixture", name: "Evento", status: "OPEN",
  registrationStart: null, registrationEnd: null, eventDate: null, ...data,
} as LiveCompetition);
const today = new Date("2026-11-05T15:00:00Z");

describe("competition deadlines", () => {
  it("closes the expired OBM and MOSTRATEC editions", () => {
    expect(normalizeCompetitionStatus(event({ registrationEnd: "2026-10-02" }), today).status).toBe("CLOSED");
    expect(normalizeCompetitionStatus(event({ registrationEnd: "2026-09-30" }), today).status).toBe("CLOSED");
  });
  it("does not close on the deadline day", () => {
    expect(normalizeCompetitionStatus(event({ registrationEnd: "2026-11-05" }), today).status).toBe("OPEN");
  });
  it("does not invent open status when dates are unknown", () => {
    expect(normalizeCompetitionStatus(event({ status: "UNKNOWN" }), today).status).toBe("UNKNOWN");
  });
  it("respects future openings", () => {
    expect(normalizeCompetitionStatus(event({ registrationStart: "2026-12-01" }), today).status).toBe("UPCOMING");
  });
  it("closes expired events without a registration end", () => {
    expect(normalizeCompetitionStatus(event({ eventDate: "2026-10-08" }), today).status).toBe("CLOSED");
  });
});
