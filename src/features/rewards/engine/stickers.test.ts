import { describe, expect, it } from "vitest";
import type { PageMeta } from "../../../pages/meta.ts";
import { PALETTE } from "../../paint/config.ts";
import { emptyProgress, type PageStats, type Progress } from "./progress.ts";
import { award, goalOf, STICKERS, stickerShare } from "./stickers.ts";

const pages: PageMeta[] = [
  { id: "a", name: "A", group: "klein" },
  { id: "b", name: "B", group: "klein" },
  { id: "c", name: "C", group: "mittel" },
  { id: "d", name: "D", group: "gross" },
  { id: "s1", name: "S1", group: "klein", unlockDay: 1 },
  { id: "s2", name: "S2", group: "mittel", unlockDay: 2 },
  { id: "k", name: "K", group: "klein", season: "halloween" },
];

const stats = (over: Partial<PageStats> = {}): PageStats => ({
  group: "klein",
  best: 0,
  colors: [],
  pen: false,
  fill: false,
  erase: false,
  penOnly: false,
  ...over,
});

const progress = (over: Partial<Progress>): Progress => ({ ...emptyProgress(), ...over });
const count = (id: string, p: Progress) => {
  const s = STICKERS.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s.count(p, pages);
};

describe("the sticker catalogue", () => {
  it("has unique ids, a label and a goal for each", () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    for (const s of STICKERS) {
      expect(s.label).not.toBe("");
      expect(goalOf(s, pages)).toBeGreaterThan(0);
    }
  });

  it("counts finished pictures and whole groups", () => {
    const p = progress({
      pages: {
        a: stats({ best: 0.8 }),
        b: stats({ best: 1 }),
        c: stats({ group: "mittel", best: 0.5 }),
        k: stats({ best: 1 }),
      },
    });
    expect(count("bild-1", p)).toBe(3);
    expect(count("ganz-bunt", p)).toBe(2);
    // Season pages count as pictures, not towards a whole group.
    expect(count("alle-klein", p)).toBe(2);
    expect(
      goalOf(
        STICKERS.find((s) => s.id === "alle-klein")!,
        pages,
      ),
    ).toBe(3);
  });

  it("counts tools and colours", () => {
    const p = progress({
      pages: {
        a: stats({ pen: true, colors: PALETTE.slice(0, 8).map((c) => c.color) }),
        b: stats({ fill: true, erase: true, penOnly: true, colors: [PALETTE[15].color] }),
      },
    });
    expect(count("werkzeuge", p)).toBe(3);
    expect(count("nur-stift", p)).toBe(1);
    expect(count("regenbogen", p)).toBe(8);
    expect(count("alle-farben", p)).toBe(9);
  });

  it("counts mixed colours and pictures painted in them alone", () => {
    const p = progress({
      mixed: ["#000001", "#000002", "#000003", "#000004", "#000005"],
      pages: { a: stats({ mixedOnly: true, colors: ["#000001"] }) },
    });
    expect(count("farbforscher-1", p)).toBe(5);
    expect(award(p, pages, "d").won.map((s) => s.id)).toEqual([
      "farbforscher-1",
      "farbforscher-5",
      "eigene-farben",
    ]);
    // Mixed colours count for a colourful picture, not for all sixteen.
    expect(count("alle-farben", p)).toBe(0);
  });

  it("counts days, weekdays and weekends", () => {
    // Fri 23, Sat 24, Sun 25 Oct 2026, and Sat 31.
    const p = progress({ days: ["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-31"] });
    expect(count("tage-3", p)).toBe(4);
    expect(count("woche", p)).toBe(3);
    expect(count("wochenende", p)).toBe(2);
  });

  it("counts explored groups and surprises", () => {
    const p = progress({
      days: ["2026-10-20", "2026-10-21"],
      pages: {
        a: stats({ pen: true }),
        s2: stats({ group: "mittel", fill: true }),
        d: stats({ group: "gross" }), // opened, never painted
      },
    });
    expect(count("alle-gruppen", p)).toBe(2);
    expect(count("ueberraschung", p)).toBe(1);
    expect(count("alle-ueberraschungen", p)).toBe(2);
    expect(count("alle-themen", p)).toBe(1);
  });

  it("shows how far a sticker is along", () => {
    const tage = STICKERS.find((s) => s.id === "tage-7")!;
    expect(stickerShare(tage, progress({ days: ["x", "y"] }), pages)).toBeCloseTo(2 / 7);
  });
});

describe("award", () => {
  it("adds newly reached stickers to earned and fresh, once", () => {
    const p = progress({ pages: { a: stats({ best: 0.9, pen: true }) } });
    const first = award(p, pages, "2026-10-21");
    expect(first.won.map((s) => s.id)).toEqual(["bild-1"]);
    expect(first.progress.earned).toEqual({ "bild-1": "2026-10-21" });
    expect(first.progress.fresh).toEqual(["bild-1"]);
    const again = award(first.progress, pages, "2026-10-22");
    expect(again.won).toEqual([]);
    expect(again.progress).toBe(first.progress);
  });

  it("never takes a sticker away", () => {
    const p = progress({ earned: { "bild-25": "2026-01-01" } });
    expect(award(p, pages, "2026-10-21").progress.earned).toEqual({ "bild-25": "2026-01-01" });
  });
});
