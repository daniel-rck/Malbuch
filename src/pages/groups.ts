import type { PenSize } from "../features/paint/config.ts";

// The three age groups (spec §3, §6). A group decides which pictures sit
// together in the picture book, what the tray offers while one of its
// pictures is open, and the drawing rules its pictures follow.

export type GroupId = "klein" | "mittel" | "gross";

export type AgeGroup = {
  id: GroupId;
  /** aria-label of the group's tab. */
  label: string;
  /** Indexes into PALETTE. */
  colors: readonly number[];
  sizes: readonly PenSize[];
  defaultSize: PenSize;
  /** Allowed stroke-width range of the group's SVGs. */
  stroke: readonly [number, number];
  /**
   * Smallest region: side of the largest square that fits inside, in doc px
   * (checked on /dev/seiten). Letter counters in speech bubbles are exempt.
   * Every region also needs SPECK_AREA (150 doc px²), or it becomes line.
   */
  minRegion: number;
};

export const AGE_GROUPS: readonly AgeGroup[] = [
  {
    id: "klein",
    label: "3 bis 4 Jahre",
    // Red, orange, yellow, green, blue, purple, pink, both skin tones, brown.
    colors: [0, 1, 2, 4, 6, 8, 9, 10, 11, 12],
    sizes: [30, 52],
    defaultSize: 52,
    stroke: [8, 8],
    minRegion: 30,
  },
  {
    id: "mittel",
    label: "5 bis 6 Jahre",
    colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    sizes: [16, 30, 52],
    defaultSize: 30,
    stroke: [7, 8],
    minRegion: 14,
  },
  {
    id: "gross",
    label: "7 bis 8 Jahre",
    colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    sizes: [8, 16, 30, 52],
    defaultSize: 16,
    stroke: [6, 8],
    minRegion: 9,
  },
];

export function ageGroup(id: GroupId): AgeGroup {
  const group = AGE_GROUPS.find((g) => g.id === id);
  if (!group) throw new Error(`Unknown age group ${id}`);
  return group;
}
