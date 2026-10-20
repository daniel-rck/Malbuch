import { fnv1a } from "./hash.ts";

/**
 * One undoable step (spec §5.4). Coordinates and sizes are document px;
 * `region` is the label id the op was clipped to, stored so a replay never
 * has to look it up again.
 */
export type Op =
  | { t: "stroke"; color: string; size: number; region: number | null; pts: number[] }
  | { t: "erase"; size: number; pts: number[] }
  | { t: "fill"; color: string; region: number }
  | { t: "clear" };

/** Points are stored rounded to 0.5 doc px. */
export const roundCoord = (v: number): number => Math.round(v * 2) / 2;

/**
 * Append a rounded point to a flat `[x0, y0, x1, y1, …]` list unless it
 * repeats the last one. Live drawing and replay both draw from this list, so
 * they draw the same segments.
 */
export function addPoint(pts: number[], x: number, y: number): boolean {
  const rx = roundCoord(x);
  const ry = roundCoord(y);
  const n = pts.length;
  if (n >= 2 && pts[n - 2] === rx && pts[n - 1] === ry) return false;
  pts.push(rx, ry);
  return true;
}

/** Digest of the first `count` ops: tells a stored snapshot whether it still matches the log. */
export function opsDigest(ops: readonly Op[], count = ops.length): string {
  return fnv1a(JSON.stringify(ops.slice(0, count)));
}

/** Index of the last `clear`, or -1. */
export function lastClear(ops: readonly Op[], end = ops.length): number {
  for (let i = end - 1; i >= 0; i--) if (ops[i]?.t === "clear") return i;
  return -1;
}

/**
 * Whether nothing is painted after `ops` on a page whose start image is
 * `hasBase`: a "clear" there would be a no-op the child then has to undo.
 */
export function isBlank(ops: readonly Op[], hasBase: boolean): boolean {
  const from = lastClear(ops);
  if (from < 0 && hasBase) return false;
  for (let i = from + 1; i < ops.length; i++) {
    const t = ops[i]?.t;
    if (t === "stroke" || t === "fill") return false;
  }
  return true;
}

/** Box of a stroke in doc px, widened by half the pen: [x0, y0, x1, y1]. */
export function strokeBox(pts: readonly number[], width: number): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const x = pts[i] ?? 0;
    const y = pts[i + 1] ?? 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const r = width / 2 + 1;
  return [x0 - r, y0 - r, x1 + r, y1 + r];
}
