import { describe, expect, it } from "vitest";
import { VERIFIED_COMPETITION_CATALOG_2026 } from "./catalog-2026";
import { CATALOG_SCANNER_SOURCE_IDS, CATALOG_SCANNER_SOURCES } from "./catalog-live-scan";

describe("curated competition live scanner coverage", () => {
  it("has an official scanner for every curated competition", () => {
    const catalogIds = VERIFIED_COMPETITION_CATALOG_2026.map((competition) => competition.id).sort();
    expect([...CATALOG_SCANNER_SOURCE_IDS].sort()).toEqual(catalogIds);
  });

  it("uses an https official source for every scanner", () => {
    for (const competition of VERIFIED_COMPETITION_CATALOG_2026) {
      const scanner = CATALOG_SCANNER_SOURCES[competition.id];
      expect(scanner).toBeTruthy();
      expect(scanner.url.startsWith("https://")).toBe(true);
      expect(scanner.aliases.length).toBeGreaterThan(0);
    }
  });
});
