import { describe, expect, it } from "vitest";
import { buildMask } from "./mask.ts";
import type { Op } from "./ops.ts";
import { labelRegions } from "./regions.ts";
import { BASE_START, planReplay, type ReplayStart } from "./replay-plan.ts";
import { grid } from "./test/grid.ts";

// A CPU stand-in for the paint canvas: one colour (or "") per cell, binary
// masks, discs for pens. Enough to check that a plan reproduces exactly the
// state a full replay from the start produces.

const art = grid([
  "................",
  ".######..######.",
  ".#....#..#....#.",
  ".#....#..#....#.",
  ".######..######.",
  "................",
  "....########....",
  "....#......#....",
  "....########....",
  "................",
]);
const regions = labelRegions(art.darkness, art.width, art.height, 110);
const W = art.width;
const H = art.height;
const BASE = Array.from({ length: W * H }, (_, i) => (i % 7 === 0 ? "base" : ""));

function maskCells(region: number): Set<number> {
  const m = buildMask(regions, region, 1);
  const cells = new Set<number>();
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++)
      if (m.alpha[y * m.width + x]) cells.add((y + m.y0) * W + (x + m.x0));
  return cells;
}

function disc(pts: number[], size: number): Set<number> {
  const cells = new Set<number>();
  const r = size / 2;
  for (let p = 0; p + 1 < pts.length; p += 2)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (Math.hypot(x - (pts[p] ?? 0), y - (pts[p + 1] ?? 0)) <= r) cells.add(y * W + x);
  return cells;
}

function apply(state: string[], op: Op): void {
  switch (op.t) {
    case "clear":
      state.fill("");
      return;
    case "fill":
      for (const c of maskCells(op.region)) state[c] = op.color;
      return;
    case "erase":
      for (const c of disc(op.pts, op.size)) state[c] = "";
      return;
    case "stroke": {
      const allowed = op.region === null ? null : maskCells(op.region);
      for (const c of disc(op.pts, op.size)) if (!allowed || allowed.has(c)) state[c] = op.color;
    }
  }
}

/** The truth: every op from the base image, in order. */
function fullReplay(ops: Op[], target: number): string[] {
  const state = [...BASE];
  for (const op of ops.slice(0, target)) apply(state, op);
  return state;
}

/** What the executor does: restore the plan's start, apply its steps. */
function runPlan(ops: Op[], target: number, held: Map<string, string[]>, starts: ReplayStart[]) {
  const plan = planReplay(ops, target, starts);
  const state =
    plan.start.key === "base"
      ? [...BASE]
      : plan.start.key === "blank"
        ? Array.from({ length: W * H }, () => "")
        : [...(held.get(plan.start.key) ?? [])];
  for (const i of plan.steps) {
    const op = ops[i];
    if (op) apply(state, op);
  }
  return { state, plan };
}

function randomOps(seed: number, count: number): Op[] {
  let s = seed;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const colors = ["red", "blue", "green"];
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
  const ops: Op[] = [];
  for (let i = 0; i < count; i++) {
    const kind = rand();
    const pts = [Math.floor(rand() * W), Math.floor(rand() * H), Math.floor(rand() * W), 5];
    if (kind < 0.35) {
      const region = rand() < 0.15 ? null : 1 + Math.floor(rand() * regions.count);
      ops.push({ t: "stroke", color: pick(colors), size: 3, region, pts });
    } else if (kind < 0.7) {
      ops.push({ t: "fill", color: pick(colors), region: 1 + Math.floor(rand() * regions.count) });
    } else if (kind < 0.9) {
      ops.push({ t: "erase", size: 2, pts });
    } else {
      ops.push({ t: "clear" });
    }
  }
  return ops;
}

describe("planReplay", () => {
  it("starts from the base, or a blank page after the last clear", () => {
    const ops: Op[] = [
      { t: "fill", color: "red", region: 1 },
      { t: "clear" },
      { t: "fill", color: "blue", region: 2 },
    ];
    expect(planReplay(ops, 1).start).toBe(BASE_START);
    expect(planReplay(ops, 3).start).toEqual({ at: 2, key: "blank" });
    expect(planReplay(ops, 3).steps).toEqual([2]);
  });

  it("starts from the latest held state at or before the target", () => {
    const ops = randomOps(7, 30).filter((op) => op.t !== "clear");
    const held = [
      { at: 10, key: "c10" },
      { at: 20, key: "c20" },
      { at: 25, key: "c25" },
    ];
    expect(planReplay(ops, 24, held).start.key).toBe("c20");
    expect(planReplay(ops, 25, held).start.key).toBe("c25");
    expect(planReplay(ops, 9, held).start.key).toBe("base");
  });

  it("skips ops a later fill of the same region paints over", () => {
    const ops: Op[] = [
      { t: "stroke", color: "red", size: 3, region: 1, pts: [1, 1] },
      { t: "stroke", color: "red", size: 3, region: null, pts: [1, 1] },
      { t: "fill", color: "green", region: 1 },
      { t: "erase", size: 2, pts: [1, 1] },
      { t: "fill", color: "blue", region: 1 },
    ];
    expect(planReplay(ops, 5).steps).toEqual([1, 3, 4]);
  });

  it("reproduces a full replay from any held state, with or without clears", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const ops = randomOps(seed, 40);
      // Checkpoints every 5 ops and the state before the last clear, as the
      // render layer would hold them.
      const held = new Map<string, string[]>();
      const starts: ReplayStart[] = [];
      for (let at = 5; at <= ops.length; at += 5) {
        held.set(`c${at}`, fullReplay(ops, at));
        starts.push({ at, key: `c${at}` });
      }
      for (let target = 0; target <= ops.length; target++) {
        for (const subset of [[], starts, starts.filter((_, i) => i % 3 === 1)]) {
          const { state } = runPlan(ops, target, held, subset);
          expect(state).toEqual(fullReplay(ops, target));
        }
      }
    }
  });

  it("undoing a clear restores the state before it", () => {
    const ops: Op[] = [
      { t: "fill", color: "red", region: 2 },
      { t: "stroke", color: "blue", size: 3, region: 3, pts: [6, 7, 9, 7] },
      { t: "clear" },
    ];
    const before = fullReplay(ops, 2);
    expect(runPlan(ops, 2, new Map(), []).state).toEqual(before);
    expect(runPlan(ops, 3, new Map(), []).state.every((c) => c === "")).toBe(true);
  });
});
