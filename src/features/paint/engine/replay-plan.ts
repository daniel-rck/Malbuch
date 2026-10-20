import type { Op } from "./ops.ts";

/** A paint state a replay can start from: the state after the first `at` ops. */
export type ReplayStart = { at: number; key: string };

export type ReplayPlan = { start: ReplayStart; steps: number[] };

/** The page's start image (blank, or the base image) before any op. */
export const BASE_START: ReplayStart = { at: 0, key: "base" };

/**
 * Where to start and which ops to apply to reach the state after `target`
 * ops. Candidates: the base at 0, a blank page after every `clear` (the base
 * never comes back after one), and whatever states the caller still holds
 * (checkpoints, the copy pinned before the last clear). The latest candidate
 * at or before `target` wins.
 *
 * Steps leave out ops a later fill of the same region paints over completely:
 * masks are binary and colours opaque, so a clipped stroke or fill in region R
 * changes no pixel outside R's mask, and the fill rewrites every pixel inside.
 */
export function planReplay(
  ops: readonly Op[],
  target: number,
  held: readonly ReplayStart[] = [],
): ReplayPlan {
  let start = BASE_START;
  for (let i = 0; i < target; i++) {
    if (ops[i]?.t === "clear") start = { at: i + 1, key: "blank" };
  }
  for (const s of held) if (s.at <= target && s.at > start.at) start = s;

  const steps: number[] = [];
  const filledLater = new Set<number>();
  for (let i = target - 1; i >= start.at; i--) {
    const op = ops[i];
    if (!op) continue;
    if (op.t === "fill") {
      if (!filledLater.has(op.region)) steps.push(i);
      filledLater.add(op.region);
    } else if (op.t === "stroke" && op.region !== null && filledLater.has(op.region)) {
      continue;
    } else {
      steps.push(i);
    }
  }
  steps.reverse();
  return { start, steps };
}
