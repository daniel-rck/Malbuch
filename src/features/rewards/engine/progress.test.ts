import { describe, expect, it } from "vitest";
import type { Op } from "../../paint/engine/ops.ts";
import { dayOf, emptyProgress, markSeen, pageProgress, record, weekdayOf } from "./progress.ts";

const fill = (region: number, color = "#E53935"): Op => ({ t: "fill", color, region });
const stroke = (region: number | null, color = "#1E88E5"): Op => ({
  t: "stroke",
  color,
  size: 16,
  region,
  pts: [1, 1, 2, 2],
});
const erase: Op = { t: "erase", size: 16, pts: [1, 1] };
const page = { id: "fisch", group: "klein" as const };

describe("pageProgress", () => {
  it("counts each coloured region once, by fill or stroke", () => {
    expect(pageProgress([fill(1), stroke(2), stroke(2), fill(1)], 4)).toBe(0.5);
  });

  it("starts over after a clear and ignores the eraser and unclipped strokes", () => {
    expect(pageProgress([fill(1), fill(2), { t: "clear" }, fill(3), erase, stroke(null)], 4)).toBe(
      0.25,
    );
  });

  it("is 0 without regions", () => {
    expect(pageProgress([fill(1)], 0)).toBe(0);
  });
});

describe("record", () => {
  it("keeps the best share, colours and tools of a page", () => {
    let p = record(
      emptyProgress(),
      page,
      [fill(1), fill(2, "#FDD835"), stroke(3)],
      4,
      true,
      "2026-10-21",
    );
    expect(p.pages.fisch).toEqual({
      group: "klein",
      best: 0.75,
      colors: ["#E53935", "#FDD835", "#1E88E5"],
      pen: true,
      fill: true,
      erase: false,
      penOnly: false,
    });
    // Undo down to one op: the best stays.
    p = record(p, page, [fill(1)], 4, false, "2026-10-21");
    expect(p.pages.fisch?.best).toBe(0.75);
  });

  it("makes today a painting day only for fresh paint", () => {
    const opened = record(emptyProgress(), page, [fill(1)], 4, false, "2026-10-21");
    expect(opened.days).toEqual([]);
    const painted = record(opened, page, [fill(1), fill(2)], 4, true, "2026-10-21");
    expect(painted.days).toEqual(["2026-10-21"]);
    expect(record(painted, page, [fill(1), fill(2), fill(3)], 4, true, "2026-10-21").days).toEqual([
      "2026-10-21",
    ]);
  });

  it("hands back the same object when nothing changed", () => {
    const p = record(emptyProgress(), page, [fill(1)], 4, true, "2026-10-21");
    expect(record(p, page, [fill(1), fill(1)], 4, true, "2026-10-21")).toBe(p);
  });

  it("notes a picture finished with the pen alone", () => {
    const p = record(emptyProgress(), page, [stroke(1), stroke(2), stroke(3)], 4, true, "d");
    expect(p.pages.fisch?.penOnly).toBe(true);
    expect(
      record(emptyProgress(), page, [fill(1), stroke(2), stroke(3)], 4, true, "d").pages.fisch
        ?.penOnly,
    ).toBe(false);
  });
});

describe("dates", () => {
  it("are local YYYY-MM-DD with their weekday", () => {
    expect(dayOf(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(weekdayOf("2026-10-21")).toBe(3); // a Wednesday
    expect(weekdayOf("2026-10-25")).toBe(0); // a Sunday
  });
});

describe("markSeen", () => {
  it("adds a page once", () => {
    const p = markSeen(emptyProgress(), "katze");
    expect(p.seen).toEqual(["katze"]);
    expect(markSeen(p, "katze")).toBe(p);
  });
});
