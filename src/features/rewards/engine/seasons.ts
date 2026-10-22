// Season pages (spec §3.4): a few pages belong to a time of the year and are
// in the picture book only while it lasts. Days are local YYYY-MM-DD dates,
// like the painting days.

export type SeasonId = "halloween" | "weihnachten" | "ostern" | "sommer";

/** In calendar order of their start, for a stable order in the picture book. */
export const SEASONS: readonly { id: SeasonId; label: string }[] = [
  { id: "ostern", label: "Ostern" },
  { id: "sommer", label: "Sommer" },
  { id: "halloween", label: "Halloween" },
  { id: "weihnachten", label: "Weihnachten" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const md = (m: number, d: number) => `${pad(m)}-${pad(d)}`;

/** Easter Sunday of a Gregorian year as [month, day] (the anonymous Gregorian algorithm). */
export function easterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

/** MM-DD of a date some days away from a month and day of `year`. */
function shifted(year: number, [month, day]: [number, number], by: number): string {
  const date = new Date(year, month - 1, day + by);
  return md(date.getMonth() + 1, date.getDate());
}

/** First and last MM-DD of each season in `year` (inclusive); Christmas wraps into January. */
function windows(year: number): Record<SeasonId, [string, string]> {
  const easter = easterSunday(year);
  return {
    ostern: [shifted(year, easter, -14), shifted(year, easter, 7)],
    sommer: [md(6, 21), md(8, 31)],
    halloween: [md(10, 15), md(11, 7)],
    weihnachten: [md(12, 1), md(1, 6)],
  };
}

function inWindow(mmdd: string, [first, last]: [string, string]): boolean {
  return first <= last ? mmdd >= first && mmdd <= last : mmdd >= first || mmdd <= last;
}

/** The seasons a day falls in, in `SEASONS` order. */
export function activeSeasons(day: string): SeasonId[] {
  const year = Number(day.slice(0, 4));
  const mmdd = day.slice(5);
  const w = windows(year);
  return SEASONS.filter((s) => inWindow(mmdd, w[s.id])).map((s) => s.id);
}

/**
 * The season of a day as it is announced once: `2026-halloween`. January's
 * Christmas days belong to the season that began the December before.
 */
export function seasonKey(day: string, season: SeasonId): string {
  const year = Number(day.slice(0, 4));
  const january = day.slice(5, 7) === "01";
  return `${season === "weihnachten" && january ? year - 1 : year}-${season}`;
}
