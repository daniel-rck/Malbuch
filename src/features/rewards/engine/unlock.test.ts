import { describe, expect, it } from "vitest";
import { isUnlocked, newlyUnlocked, unlockLevel, unseen } from "./unlock.ts";

const pages = [
  { id: "a" },
  { id: "b", unlockDay: 1 as const },
  { id: "c", unlockDay: 2 as const },
  { id: "d", unlockDay: 7 as const },
];

describe("surprise pages", () => {
  it("count distinct painting days, up to seven", () => {
    expect(unlockLevel([])).toBe(0);
    expect(unlockLevel(["2026-10-20", "2026-10-20"])).toBe(1);
    // A clock set back still adds a day: it is a different date.
    expect(unlockLevel(["2026-10-21", "2026-10-19"])).toBe(2);
    const days = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
    expect(unlockLevel(days)).toBe(7);
  });

  it("are always open without an unlock day, else from that day on", () => {
    expect(isUnlocked({}, 0)).toBe(true);
    expect(isUnlocked({ unlockDay: 2 }, 1)).toBe(false);
    expect(isUnlocked({ unlockDay: 2 }, 2)).toBe(true);
  });

  it("tell which pages a new level opens", () => {
    expect(newlyUnlocked(pages, 0, 1).map((p) => p.id)).toEqual(["b"]);
    expect(newlyUnlocked(pages, 1, 7).map((p) => p.id)).toEqual(["c", "d"]);
    expect(newlyUnlocked(pages, 2, 2)).toEqual([]);
  });

  it("sparkle while open and never opened", () => {
    expect(unseen(pages, 2, ["b"]).map((p) => p.id)).toEqual(["c"]);
    expect(unseen(pages, 0, [])).toEqual([]);
  });
});
