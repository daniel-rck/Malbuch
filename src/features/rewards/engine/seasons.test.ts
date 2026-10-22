import { describe, expect, it } from "vitest";
import { activeSeasons, easterSunday, seasonKey } from "./seasons.ts";

describe("seasons", () => {
  it("find Easter Sunday", () => {
    expect(easterSunday(2026)).toEqual([4, 5]);
    expect(easterSunday(2027)).toEqual([3, 28]);
    expect(easterSunday(2028)).toEqual([4, 16]);
    expect(easterSunday(2029)).toEqual([4, 1]);
    expect(easterSunday(2030)).toEqual([4, 21]);
  });

  it("run from two weeks before Easter to a week after", () => {
    expect(activeSeasons("2026-03-21")).toEqual([]);
    expect(activeSeasons("2026-03-22")).toEqual(["ostern"]);
    expect(activeSeasons("2026-04-12")).toEqual(["ostern"]);
    expect(activeSeasons("2026-04-13")).toEqual([]);
    // Two weeks before an early Easter reaches back into March.
    expect(activeSeasons("2027-03-14")).toEqual(["ostern"]);
  });

  it("hold summer and Halloween to their days", () => {
    expect(activeSeasons("2026-06-20")).toEqual([]);
    expect(activeSeasons("2026-06-21")).toEqual(["sommer"]);
    expect(activeSeasons("2026-08-31")).toEqual(["sommer"]);
    expect(activeSeasons("2026-09-01")).toEqual([]);
    expect(activeSeasons("2026-10-14")).toEqual([]);
    expect(activeSeasons("2026-10-22")).toEqual(["halloween"]);
    expect(activeSeasons("2026-11-07")).toEqual(["halloween"]);
    expect(activeSeasons("2026-11-08")).toEqual([]);
  });

  it("carry Christmas over New Year", () => {
    expect(activeSeasons("2026-11-30")).toEqual([]);
    expect(activeSeasons("2026-12-01")).toEqual(["weihnachten"]);
    expect(activeSeasons("2026-12-31")).toEqual(["weihnachten"]);
    expect(activeSeasons("2027-01-06")).toEqual(["weihnachten"]);
    expect(activeSeasons("2027-01-07")).toEqual([]);
  });

  it("are announced once per season, Christmas by the December it began in", () => {
    expect(seasonKey("2026-10-22", "halloween")).toBe("2026-halloween");
    expect(seasonKey("2026-12-24", "weihnachten")).toBe("2026-weihnachten");
    expect(seasonKey("2027-01-02", "weihnachten")).toBe("2026-weihnachten");
  });
});
