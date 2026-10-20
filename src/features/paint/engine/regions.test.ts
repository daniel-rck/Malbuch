import { describe, expect, it } from "vitest";
import { LINE, labelRegions, regionAt } from "./regions.ts";
import { grid } from "./test/grid.ts";

const art = grid([
  "..........",
  ".####.....",
  ".#..#.....",
  ".#..#.....",
  ".####.....",
  "..........",
  "......###.",
  "......#.#.",
  "......###.",
]);

describe("labelRegions", () => {
  const r = labelRegions(art.darkness, art.width, art.height, 110);

  it("marks dark pixels as line and numbers the rest in scan order", () => {
    expect(r.count).toBe(3);
    expect(r.labels[0]).toBe(1); // the outside
    expect(r.labels[1 * 10 + 1]).toBe(LINE);
    expect(r.labels[2 * 10 + 2]).toBe(2); // inside the square
    expect(r.labels[7 * 10 + 7]).toBe(3); // inside the small box
  });

  it("records each region's box and area", () => {
    expect(Array.from(r.boxes.slice(8, 12))).toEqual([2, 2, 3, 3]);
    expect(r.areas[2]).toBe(4);
    expect(r.areas[3]).toBe(1);
    expect(Array.from(r.boxes.slice(4, 8))).toEqual([0, 0, 9, 8]);
  });

  it("does not connect regions diagonally", () => {
    const diag = grid([".#", "#."]);
    expect(labelRegions(diag.darkness, 2, 2, 110).count).toBe(2);
  });

  it("turns regions under minArea into line and renumbers the rest", () => {
    const s = labelRegions(art.darkness, art.width, art.height, 110, 2);
    expect(s.count).toBe(2);
    expect(s.labels[7 * 10 + 7]).toBe(LINE);
    expect(s.labels[2 * 10 + 2]).toBe(2);
    expect([...s.areas]).toEqual([0, r.areas[1], 4]);
  });

  it("is deterministic", () => {
    const again = labelRegions(art.darkness, art.width, art.height, 110);
    expect(again.labels).toEqual(r.labels);
  });
});

describe("regionAt", () => {
  const r = labelRegions(art.darkness, art.width, art.height, 110);

  it("returns the region under the point", () => {
    expect(regionAt(r, 2.7, 3.2, 3)).toBe(2);
  });

  it("finds the nearest region from a line, ring by ring", () => {
    // (1,1) is a line corner; the outside (0,0) is in the first ring before
    // the square's inside at (2,2).
    expect(regionAt(r, 1, 1, 3)).toBe(1);
    // The small box's line at (6,7): its inside (7,7) and the outside (5,7)
    // are both one step away; the ring scan meets (5,…) first.
    expect(regionAt(r, 6, 7, 3)).toBe(1);
  });

  it("gives null when no region is within reach", () => {
    const solid = grid(["#####", "#####", "#####"]);
    const s = labelRegions(solid.darkness, 5, 3, 110);
    expect(regionAt(s, 2, 1, 5)).toBeNull();
  });
});
