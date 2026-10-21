import { describe, expect, it } from "vitest";
import { buildMask } from "./mask.ts";
import { LINE, labelRegions, type Regions } from "./regions.ts";
import { grid } from "./test/grid.ts";

/**
 * The prototype's buildMask (docs/reference/prototype.html), pass by pass,
 * as the reference the breadth-first version must match bit for bit.
 */
function prototypeMask(r: Regions, id: number, P: number): Uint8Array {
  const { width: W, height: H, labels: lab, boxes } = r;
  const mbuf = new Uint8Array(W * H);
  const x0 = Math.max(0, (boxes[id * 4] ?? 0) - P);
  const y0 = Math.max(0, (boxes[id * 4 + 1] ?? 0) - P);
  const x1 = Math.min(W - 1, (boxes[id * 4 + 2] ?? 0) + P);
  const y1 = Math.min(H - 1, (boxes[id * 4 + 3] ?? 0) + P);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) mbuf[y * W + x] = lab[y * W + x] === id ? 1 : 0;
  const at = (i: number) => mbuf[i] ?? 0;
  for (let k = 1; k <= P; k++) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (mbuf[i] || lab[i] !== LINE) continue;
        let v: number;
        if (
          (x > 0 && (v = at(i - 1)) && v <= k) ||
          (x < W - 1 && (v = at(i + 1)) && v <= k) ||
          (y > 0 && (v = at(i - W)) && v <= k) ||
          (y < H - 1 && (v = at(i + W)) && v <= k)
        )
          mbuf[i] = k + 1;
      }
  }
  return mbuf;
}

/** The mask spread back over the full image, 0/1 per pixel. */
function full(r: Regions, region: number, dilate: number): Uint8Array {
  const m = buildMask(r, region, dilate);
  const out = new Uint8Array(r.width * r.height);
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++)
      if (m.alpha[y * m.width + x]) out[(y + m.y0) * r.width + (x + m.x0)] = 1;
  return out;
}

/** Random blobs of line on white, seeded: an irregular picture with many regions. */
function noise(width: number, height: number, seed: number): Uint8Array {
  let s = seed;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const d = new Uint8Array(width * height);
  for (let i = 0; i < d.length; i++) d[i] = rand() < 0.42 ? 255 : 0;
  return d;
}

describe("buildMask", () => {
  it("covers the region and the line pixels up to `dilate` steps into the lines", () => {
    const art = grid(["#######", "#.....#", "#######", "#######", "#.....#", "#######"]);
    const r = labelRegions(art.darkness, art.width, art.height, 110);
    const m = full(r, 1, 2);
    // Row 0 is one step away (its corners two), row 3 two steps (its ends
    // three); region 2 in row 4 is never painted, and its end walls are four
    // steps away.
    expect(Array.from(m.slice(0, 7))).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(Array.from(m.slice(21, 28))).toEqual([0, 1, 1, 1, 1, 1, 0]);
    expect(Array.from(m.slice(28, 35))).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("matches the prototype's pass-by-pass dilation bit for bit", () => {
    // toEqual on typed arrays is slow: compare by hand, report the cases that differ.
    const differ: string[] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      const w = 40;
      const h = 30;
      const r = labelRegions(noise(w, h, seed), w, h, 110);
      for (let id = 1; id <= r.count; id++) {
        for (const dilate of [0, 1, 3, 9]) {
          const ref = Uint8Array.from(prototypeMask(r, id, dilate), (v) => (v ? 1 : 0));
          const ours = full(r, id, dilate);
          if (ours.some((v, i) => v !== ref[i]))
            differ.push(`seed ${seed} region ${id} dilate ${dilate}`);
        }
      }
    }
    expect(differ).toEqual([]);
  });

  it("never wraps across a row edge", () => {
    // Region 2 hugs the right edge; the line at the next row's left edge must
    // not be reached through index arithmetic.
    const art = grid(["##..", "###.", "####"]);
    const r = labelRegions(art.darkness, art.width, art.height, 110);
    const m = full(r, 1, 2);
    expect(m[4]).toBe(0); // (0,1): three steps, but index 3 + 1
    expect(m[0]).toBe(1); // (0,0): two steps
    expect(m[1]).toBe(1);
  });

  it("is cut to the region's box plus the dilation", () => {
    const art = grid(["..........", ".###......", ".#.#......", ".###......", ".........."]);
    const r = labelRegions(art.darkness, art.width, art.height, 110);
    const inner = r.labels[2 * 10 + 2] ?? 0;
    const m = buildMask(r, inner, 1);
    expect([m.x0, m.y0, m.width, m.height]).toEqual([1, 1, 3, 3]);
  });
});
