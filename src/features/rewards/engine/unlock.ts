import type { PageMeta } from "../../../pages/meta.ts";

// Surprise pages (spec §3.2): every day the child paints on opens the pages of
// the next unlock day, one per age group, until all seven are open. Counting
// painting days rather than calendar days means a week away loses nothing.

export const UNLOCK_DAYS = 7;

/** How many unlock days are open after these painting days (YYYY-MM-DD). */
export function unlockLevel(days: readonly string[]): number {
  return Math.min(UNLOCK_DAYS, new Set(days).size);
}

export function isUnlocked(page: Pick<PageMeta, "unlockDay">, level: number): boolean {
  return page.unlockDay === undefined || page.unlockDay <= level;
}

/** The pages that open when the level goes from `from` to `to`. */
export function newlyUnlocked<P extends Pick<PageMeta, "unlockDay">>(
  pages: readonly P[],
  from: number,
  to: number,
): P[] {
  return pages.filter((p) => p.unlockDay !== undefined && p.unlockDay > from && p.unlockDay <= to);
}

/** Surprise pages that are open but were never opened: they sparkle in the picture book. */
export function unseen<P extends Pick<PageMeta, "id" | "unlockDay">>(
  pages: readonly P[],
  level: number,
  seen: readonly string[],
): P[] {
  return pages.filter(
    (p) => p.unlockDay !== undefined && isUnlocked(p, level) && !seen.includes(p.id),
  );
}
