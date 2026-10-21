import type { GroupId } from "../../../pages/groups.ts";
import type { PageMeta } from "../../../pages/meta.ts";
import { PALETTE } from "../../paint/config.ts";
import { FINISHED, type PageStats, type Progress, touched, weekdayOf } from "./progress.ts";
import { UNLOCK_DAYS, unlockLevel } from "./unlock.ts";

// The sticker catalogue (spec §3.3). A sticker is earned once its count
// reaches its goal, and stays earned whatever happens to the pictures after.

export type StickerKind = "malen" | "werkzeug" | "tage" | "entdecker";

type Pages = readonly PageMeta[];

export type Sticker = {
  id: string;
  kind: StickerKind;
  /** aria-label: the only words a sticker has. */
  label: string;
  /** A number, or one that follows the page list (all pages of a group). */
  goal: number | ((pages: Pages) => number);
  count: (progress: Progress, pages: Pages) => number;
};

const all = (p: Progress): PageStats[] => Object.values(p.pages);
const finished = (p: Progress) => all(p).filter((s) => s.best >= FINISHED).length;
const days = (p: Progress) => p.days.length;
const surprisesPainted = (p: Progress, pages: Pages) =>
  pages.filter((m) => m.unlockDay !== undefined && touched(p.pages[m.id]));

function group(id: GroupId, label: string): Sticker {
  return {
    id: `alle-${id}`,
    kind: "malen",
    label,
    goal: (pages) => pages.filter((m) => m.group === id).length,
    count: (p, pages) =>
      pages.filter((m) => m.group === id && (p.pages[m.id]?.best ?? 0) >= FINISHED).length,
  };
}

export const STICKERS: readonly Sticker[] = [
  // Painting
  { id: "bild-1", kind: "malen", label: "Erstes Bild fertig", goal: 1, count: finished },
  { id: "bild-5", kind: "malen", label: "Fünf Bilder fertig", goal: 5, count: finished },
  { id: "bild-10", kind: "malen", label: "Zehn Bilder fertig", goal: 10, count: finished },
  {
    id: "bild-25",
    kind: "malen",
    label: "Fünfundzwanzig Bilder fertig",
    goal: 25,
    count: finished,
  },
  {
    id: "ganz-bunt",
    kind: "malen",
    label: "Ein Bild ganz ausgemalt",
    goal: 1,
    count: (p) => all(p).filter((s) => s.best >= 1).length,
  },
  group("klein", "Alle Bilder für Kleine fertig"),
  group("mittel", "Alle mittleren Bilder fertig"),
  group("gross", "Alle Bilder für Große fertig"),
  // Tools and colours
  {
    id: "werkzeuge",
    kind: "werkzeug",
    label: "Stift, Farbeimer und Radierer ausprobiert",
    goal: 3,
    count: (p) =>
      (["pen", "fill", "erase"] as const).filter((tool) => all(p).some((s) => s[tool])).length,
  },
  {
    id: "nur-stift",
    kind: "werkzeug",
    label: "Ein Bild nur mit dem Stift gemalt",
    goal: 1,
    count: (p) => all(p).filter((s) => s.penOnly).length,
  },
  {
    id: "regenbogen",
    kind: "werkzeug",
    label: "Acht Farben in einem Bild",
    goal: 8,
    count: (p) => Math.max(0, ...all(p).map((s) => s.colors.length)),
  },
  {
    id: "alle-farben",
    kind: "werkzeug",
    label: "Alle Farben benutzt",
    goal: PALETTE.length,
    count: (p) => {
      const used = new Set(all(p).flatMap((s) => s.colors));
      return PALETTE.filter((c) => used.has(c.color)).length;
    },
  },
  // Days
  { id: "tage-3", kind: "tage", label: "An drei Tagen gemalt", goal: 3, count: days },
  { id: "tage-7", kind: "tage", label: "An sieben Tagen gemalt", goal: 7, count: days },
  { id: "tage-14", kind: "tage", label: "An vierzehn Tagen gemalt", goal: 14, count: days },
  {
    id: "woche",
    kind: "tage",
    label: "An jedem Wochentag gemalt",
    goal: 7,
    count: (p) => new Set(p.days.map(weekdayOf)).size,
  },
  {
    id: "wochenende",
    kind: "tage",
    label: "Am Samstag und am Sonntag gemalt",
    goal: 2,
    count: (p) => new Set(p.days.map(weekdayOf).filter((d) => d === 0 || d === 6)).size,
  },
  // Exploring
  {
    id: "alle-gruppen",
    kind: "entdecker",
    label: "Bilder aus allen drei Altersgruppen gemalt",
    goal: 3,
    count: (p) =>
      new Set(
        all(p)
          .filter(touched)
          .map((s) => s.group),
      ).size,
  },
  {
    id: "ueberraschung",
    kind: "entdecker",
    label: "Ein Überraschungsbild gemalt",
    goal: 1,
    count: (p, pages) => surprisesPainted(p, pages).length,
  },
  {
    id: "alle-ueberraschungen",
    kind: "entdecker",
    label: "Alle Überraschungen ausgepackt",
    goal: UNLOCK_DAYS,
    count: (p) => unlockLevel(p.days),
  },
  {
    id: "alle-themen",
    kind: "entdecker",
    label: "Aus jeder Überraschung ein Bild gemalt",
    goal: UNLOCK_DAYS,
    count: (p, pages) => new Set(surprisesPainted(p, pages).map((m) => m.unlockDay)).size,
  },
];

export function goalOf(sticker: Sticker, pages: Pages): number {
  return typeof sticker.goal === "number" ? sticker.goal : sticker.goal(pages);
}

/** How far along a sticker is, 0…1. */
export function stickerShare(sticker: Sticker, progress: Progress, pages: Pages): number {
  const goal = goalOf(sticker, pages);
  return goal > 0 ? Math.min(1, sticker.count(progress, pages) / goal) : 0;
}

/**
 * Award the stickers whose goal is reached and that weren't earned yet. They
 * join `earned` and `fresh`; nothing is ever taken out.
 */
export function award(
  progress: Progress,
  pages: Pages,
  today: string,
): { progress: Progress; won: Sticker[] } {
  const won = STICKERS.filter((s) => {
    const goal = goalOf(s, pages);
    return !(s.id in progress.earned) && goal > 0 && s.count(progress, pages) >= goal;
  });
  if (won.length === 0) return { progress, won };
  const earned = { ...progress.earned };
  for (const s of won) earned[s.id] = today;
  return {
    progress: { ...progress, earned, fresh: [...progress.fresh, ...won.map((s) => s.id)] },
    won,
  };
}
