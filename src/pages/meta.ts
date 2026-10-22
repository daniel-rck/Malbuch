import type { SeasonId } from "../features/rewards/engine/seasons.ts";
import type { GroupId } from "./groups.ts";

// Every colouring page, in picture-book order. The SVG lives at
// src/pages/<group>/<id>.svg; `bun run check:pages` keeps the two in step.
// Surprise pages carry `unlockDay`: they open on the child's n-th painting day
// (spec §3.2), one per group and day, and follow their group's other pages.
// Season pages carry `season` and live at src/pages/saison/<season>/<id>.svg:
// one per group and season, in the picture book only while it lasts (§3.4).

export type UnlockDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PageMeta = {
  id: string;
  name: string;
  group: GroupId;
  unlockDay?: UnlockDay;
  season?: SeasonId;
};

export const PAGE_META: readonly PageMeta[] = [
  { id: "fisch", name: "Fisch", group: "klein" },
  { id: "haus", name: "Haus", group: "klein" },
  { id: "schmetterling", name: "Schmetterling", group: "klein" },
  { id: "ente", name: "Ente", group: "klein" },
  { id: "auto", name: "Auto", group: "klein" },
  { id: "eis", name: "Eis", group: "klein" },
  { id: "katze", name: "Katze", group: "klein", unlockDay: 1 },
  { id: "boot", name: "Boot", group: "klein", unlockDay: 2 },
  { id: "schildkroete", name: "Schildkröte", group: "klein", unlockDay: 3 },
  { id: "blume", name: "Blume", group: "klein", unlockDay: 4 },
  { id: "einhorn", name: "Einhorn", group: "klein", unlockDay: 5 },
  { id: "sonne", name: "Sonne und Regenbogen", group: "klein", unlockDay: 6 },
  { id: "kuchen", name: "Kuchen", group: "klein", unlockDay: 7 },
  { id: "drache", name: "Drache", group: "mittel" },
  { id: "zug", name: "Zug", group: "mittel" },
  { id: "krake", name: "Krake im Meer", group: "mittel" },
  { id: "schloss", name: "Schloss", group: "mittel" },
  { id: "dino", name: "Dino am Vulkan", group: "mittel" },
  { id: "feuerwehr", name: "Feuerwehrauto", group: "mittel" },
  { id: "bauernhof", name: "Bauernhof", group: "mittel" },
  { id: "igel", name: "Igel im Laub", group: "mittel", unlockDay: 1 },
  { id: "bagger", name: "Bagger", group: "mittel", unlockDay: 2 },
  { id: "leuchtturm", name: "Leuchtturm", group: "mittel", unlockDay: 3 },
  { id: "marienkaefer", name: "Marienkäfer", group: "mittel", unlockDay: 4 },
  { id: "zauberer", name: "Zauberer", group: "mittel", unlockDay: 5 },
  { id: "schneemann", name: "Schneemann", group: "mittel", unlockDay: 6 },
  { id: "geschenke", name: "Geschenke", group: "mittel", unlockDay: 7 },
  { id: "roboter", name: "Roboter und Katze", group: "gross" },
  { id: "weltraum", name: "Weltraum", group: "gross" },
  { id: "piratenschiff", name: "Piratenschiff", group: "gross" },
  { id: "baumhaus", name: "Baumhaus", group: "gross" },
  { id: "dschungel", name: "Dschungel", group: "gross" },
  { id: "mandala", name: "Mandala", group: "gross" },
  { id: "zirkus", name: "Zirkus", group: "gross" },
  { id: "picknick", name: "Picknick-Comic", group: "gross" },
  { id: "zoo", name: "Zoo", group: "gross", unlockDay: 1 },
  { id: "bahnhof", name: "Bahnhof", group: "gross", unlockDay: 2 },
  { id: "korallenriff", name: "Korallenriff", group: "gross", unlockDay: 3 },
  { id: "gemuesegarten", name: "Gemüsegarten", group: "gross", unlockDay: 4 },
  { id: "zauberwald", name: "Zauberwald", group: "gross", unlockDay: 5 },
  { id: "jahreszeiten", name: "Vier Jahreszeiten", group: "gross", unlockDay: 6 },
  { id: "geburtstag", name: "Geburtstag", group: "gross", unlockDay: 7 },
  { id: "osterhase", name: "Osterhase", group: "klein", season: "ostern" },
  { id: "osterkorb", name: "Osterkorb", group: "mittel", season: "ostern" },
  { id: "eiersuche", name: "Eiersuche", group: "gross", season: "ostern" },
  { id: "krabbe", name: "Krabbe am Strand", group: "klein", season: "sommer" },
  { id: "sandburg", name: "Sandburg", group: "mittel", season: "sommer" },
  { id: "freibad", name: "Freibad", group: "gross", season: "sommer" },
  { id: "kuerbis", name: "Kürbis", group: "klein", season: "halloween" },
  { id: "gespenst", name: "Gespenst und Kürbisse", group: "mittel", season: "halloween" },
  { id: "kuerbisfest", name: "Kürbisfest-Comic", group: "gross", season: "halloween" },
  { id: "tannenbaum", name: "Tannenbaum", group: "klein", season: "weihnachten" },
  { id: "rentier", name: "Rentier mit Schlitten", group: "mittel", season: "weihnachten" },
  { id: "weihnachtsmarkt", name: "Weihnachtsmarkt", group: "gross", season: "weihnachten" },
];

/** Where a page's SVG lives, relative to src/pages. */
export function svgPath(meta: Pick<PageMeta, "id" | "group" | "season">): string {
  return meta.season ? `./saison/${meta.season}/${meta.id}.svg` : `./${meta.group}/${meta.id}.svg`;
}

/** The page a first start opens. */
export const FIRST_PAGE = "drache";
