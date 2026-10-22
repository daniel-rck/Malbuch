import type { GroupId } from "../../../pages/groups.ts";
import { lastClear, type Op } from "../../paint/engine/ops.ts";

// What the child has done so far (spec §3.3): the facts stickers and surprise
// pages are counted from. One plain record, stored as a single row.

/** Share of a page's regions coloured for it to count as finished. */
export const FINISHED = 0.75;

export type PageStats = {
  group: GroupId;
  /** Highest share of regions ever coloured at once: undo never takes it back. */
  best: number;
  /** Colours ever used on the page. */
  colors: string[];
  pen: boolean;
  fill: boolean;
  erase: boolean;
  /** Finished once with no bucket fill in the picture. */
  penOnly: boolean;
};

export type Progress = {
  /** Local dates (YYYY-MM-DD) on which something was painted, oldest first. */
  days: string[];
  pages: Record<string, PageStats>;
  /** Sticker id → the date it was earned. Never taken away. */
  earned: Record<string, string>;
  /** Earned stickers not yet looked at in the sticker book. */
  fresh: string[];
  /** Surprise and season pages already opened once. */
  seen: string[];
  /** Seasons already announced, as `seasonKey`s like `2026-halloween`. */
  seasons: string[];
};

export function emptyProgress(): Progress {
  return { days: [], pages: {}, earned: {}, fresh: [], seen: [], seasons: [] };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A local date as YYYY-MM-DD. */
export function dayOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD date. */
export function weekdayOf(day: string): number {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * The share of regions coloured since the last clear. A region counts once a
 * fill or a stroke clipped to it is in the log; the eraser is ignored, it is
 * not clipped to a region.
 */
export function pageProgress(ops: readonly Op[], regionCount: number): number {
  if (regionCount <= 0) return 0;
  const coloured = new Set<number>();
  for (let i = lastClear(ops) + 1; i < ops.length; i++) {
    const op = ops[i];
    if (op?.t === "fill") coloured.add(op.region);
    else if (op?.t === "stroke" && op.region !== null) coloured.add(op.region);
  }
  return coloured.size / regionCount;
}

function hasFill(ops: readonly Op[]): boolean {
  for (let i = lastClear(ops) + 1; i < ops.length; i++) if (ops[i]?.t === "fill") return true;
  return false;
}

/** Whether a page was painted on at all (counts for the explorer stickers). */
export const touched = (s: PageStats | undefined): boolean => !!s && (s.pen || s.fill);

/**
 * Progress after a page's op log changed. `painted` says the change was the
 * child putting colour down just now (not opening the page, not an undo): only
 * that makes today a painting day. Returns the same object when nothing
 * changed, so a stroke inside an already coloured region costs no render.
 */
export function record(
  progress: Progress,
  page: { id: string; group: GroupId },
  ops: readonly Op[],
  regionCount: number,
  painted: boolean,
  today: string,
): Progress {
  const old = progress.pages[page.id];
  const colors = new Set(old?.colors);
  let pen = old?.pen ?? false;
  let fill = old?.fill ?? false;
  let erase = old?.erase ?? false;
  for (const op of ops) {
    if (op.t === "stroke") {
      pen = true;
      colors.add(op.color);
    } else if (op.t === "fill") {
      fill = true;
      colors.add(op.color);
    } else if (op.t === "erase") erase = true;
  }
  const share = pageProgress(ops, regionCount);
  const best = Math.max(old?.best ?? 0, share);
  const penOnly = (old?.penOnly ?? false) || (share >= FINISHED && !hasFill(ops));
  const stats: PageStats = {
    group: page.group,
    best,
    colors: [...colors],
    pen,
    fill,
    erase,
    penOnly,
  };
  const newDay = painted && !progress.days.includes(today);
  const same =
    old &&
    old.group === stats.group &&
    old.best === best &&
    old.colors.length === stats.colors.length &&
    old.pen === pen &&
    old.fill === fill &&
    old.erase === erase &&
    old.penOnly === penOnly;
  if (same && !newDay) return progress;
  return {
    ...progress,
    days: newDay ? [...progress.days, today] : progress.days,
    pages: same ? progress.pages : { ...progress.pages, [page.id]: stats },
  };
}

/** Mark a surprise page as opened. */
export function markSeen(progress: Progress, pageId: string): Progress {
  return progress.seen.includes(pageId)
    ? progress
    : { ...progress, seen: [...progress.seen, pageId] };
}
