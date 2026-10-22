import { SEASONS, type SeasonId } from "../features/rewards/engine/seasons.ts";
import type { GroupId } from "./groups.ts";
import { PAGE_META, type PageMeta, svgPath } from "./meta.ts";

// The pages with their line art. SVGs are imported as text: they ship inside
// the JS bundle, so they are precached and work offline without a fetch.
const files = import.meta.glob<string>("./{klein,mittel,gross}/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Season pages (spec §3.4) are chunks of their own, loaded when their season
// is on. The service worker precaches every chunk, so they work offline too.
const seasonFiles = import.meta.glob<string>("./saison/*/*.svg", {
  query: "?raw",
  import: "default",
});

export type Page = PageMeta & { svg: string };

/** The pages always there: every page but the season pages. */
export const PAGES: readonly Page[] = PAGE_META.flatMap((meta) => {
  const svg = meta.season ? undefined : files[svgPath(meta)];
  return svg ? [{ ...meta, svg }] : [];
});

/** Season pages loaded so far, by id. */
const loaded = new Map<string, Page>();

/** Load the pages of these seasons; they are then found by `pageById`. */
export async function loadSeasons(seasons: readonly SeasonId[]): Promise<Page[]> {
  const metas = PAGE_META.filter((m) => m.season && seasons.includes(m.season));
  return (
    await Promise.all(
      metas.map(async (meta) => {
        const known = loaded.get(meta.id);
        if (known) return known;
        const load = seasonFiles[svgPath(meta)];
        if (!load) return undefined;
        const page = { ...meta, svg: await load() };
        loaded.set(meta.id, page);
        return page;
      }),
    )
  ).filter((p) => p !== undefined);
}

/** Load every season page (the page check and /dev/seiten). */
export function loadAllSeasons(): Promise<Page[]> {
  return loadSeasons(SEASONS.map((s) => s.id));
}

export function pageById(id: string): Page | undefined {
  return PAGES.find((p) => p.id === id) ?? loaded.get(id);
}

/** A group's pages in picture-book order: the pages of the seasons on first. */
export function pagesOf(group: GroupId, seasons: readonly SeasonId[] = []): Page[] {
  return shownPages(seasons).filter((p) => p.group === group);
}

/** Every page in the picture book while these seasons are on. */
export function shownPages(seasons: readonly SeasonId[]): Page[] {
  const season = [...loaded.values()].filter((p) => p.season && seasons.includes(p.season));
  return [...season, ...PAGES];
}

/** The SVG files present, by path relative to src/pages (for the page check). */
export const SVG_FILES: readonly string[] = [...Object.keys(files), ...Object.keys(seasonFiles)];
