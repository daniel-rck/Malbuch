import type { GroupId } from "./groups.ts";

// Every colouring page, in picture-book order. The SVG lives at
// src/pages/<group>/<id>.svg; `bun run check:pages` keeps the two in step.

export type PageMeta = { id: string; name: string; group: GroupId };

export const PAGE_META: readonly PageMeta[] = [
  { id: "fisch", name: "Fisch", group: "klein" },
  { id: "haus", name: "Haus", group: "klein" },
  { id: "schmetterling", name: "Schmetterling", group: "klein" },
  { id: "ente", name: "Ente", group: "klein" },
  { id: "auto", name: "Auto", group: "klein" },
  { id: "eis", name: "Eis", group: "klein" },
  { id: "drache", name: "Drache", group: "mittel" },
  { id: "zug", name: "Zug", group: "mittel" },
  { id: "krake", name: "Krake im Meer", group: "mittel" },
  { id: "schloss", name: "Schloss", group: "mittel" },
  { id: "dino", name: "Dino am Vulkan", group: "mittel" },
  { id: "feuerwehr", name: "Feuerwehrauto", group: "mittel" },
  { id: "bauernhof", name: "Bauernhof", group: "mittel" },
  { id: "roboter", name: "Roboter und Katze", group: "gross" },
  { id: "weltraum", name: "Weltraum", group: "gross" },
  { id: "piratenschiff", name: "Piratenschiff", group: "gross" },
  { id: "baumhaus", name: "Baumhaus", group: "gross" },
  { id: "dschungel", name: "Dschungel", group: "gross" },
  { id: "mandala", name: "Mandala", group: "gross" },
  { id: "zirkus", name: "Zirkus", group: "gross" },
  { id: "picknick", name: "Picknick-Comic", group: "gross" },
];

/** The page a first start opens. */
export const FIRST_PAGE = "drache";
