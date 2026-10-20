import { describe, expect, it } from "vitest";
import { addPoint, isBlank, type Op, opsDigest, roundCoord, strokeBox } from "./ops.ts";

const stroke = (region: number | null): Op => ({
  t: "stroke",
  color: "#E53935",
  size: 16,
  region,
  pts: [1, 2],
});

describe("points", () => {
  it("round to 0.5 doc px", () => {
    expect(roundCoord(10.24)).toBe(10);
    expect(roundCoord(10.26)).toBe(10.5);
    expect(roundCoord(-0.74)).toBe(-0.5);
  });

  it("skip a point that repeats the last one after rounding", () => {
    const pts: number[] = [];
    expect(addPoint(pts, 1.1, 2.2)).toBe(true);
    expect(addPoint(pts, 0.9, 2.1)).toBe(false);
    expect(addPoint(pts, 1.4, 2.2)).toBe(true);
    expect(pts).toEqual([1, 2, 1.5, 2]);
  });

  it("give a box widened by half the pen", () => {
    expect(strokeBox([10, 20, 30, 5], 8)).toEqual([5, 0, 35, 25]);
  });
});

describe("opsDigest", () => {
  it("differs when an op changes but the length does not (undo, then a new stroke)", () => {
    const a = [stroke(1), stroke(2)];
    const b = [stroke(1), stroke(3)];
    expect(opsDigest(a)).not.toBe(opsDigest(b));
    expect(opsDigest(a, 1)).toBe(opsDigest(b, 1));
  });
});

describe("isBlank", () => {
  it("is true for no ops, erasing only, or nothing painted since the last clear", () => {
    expect(isBlank([], false)).toBe(true);
    expect(isBlank([{ t: "erase", size: 8, pts: [1, 1] }], false)).toBe(true);
    expect(isBlank([stroke(1), { t: "clear" }], false)).toBe(true);
  });

  it("is false with paint, or with a base image never cleared", () => {
    expect(isBlank([stroke(1)], false)).toBe(false);
    expect(isBlank([{ t: "fill", color: "#000", region: 2 }], false)).toBe(false);
    expect(isBlank([], true)).toBe(false);
    expect(isBlank([{ t: "clear" }], true)).toBe(true);
  });
});
