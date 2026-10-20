import type { GroupId } from "./groups.ts";
import { PAGE_META, type PageMeta } from "./meta.ts";

// The pages with their line art. SVGs are imported as text: they ship inside
// the JS bundle, so they are precached and work offline without a fetch.
const files = import.meta.glob<string>("./*/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type Page = PageMeta & { svg: string };

export const PAGES: readonly Page[] = PAGE_META.flatMap((meta) => {
  const svg = files[svgPath(meta)];
  return svg ? [{ ...meta, svg }] : [];
});

export function svgPath(meta: Pick<PageMeta, "id" | "group">): string {
  return `./${meta.group}/${meta.id}.svg`;
}

export function pageById(id: string): Page | undefined {
  return PAGES.find((p) => p.id === id);
}

export function pagesOf(group: GroupId): Page[] {
  return PAGES.filter((p) => p.group === group);
}

/** The SVG files present, by path relative to src/pages (for the page check). */
export const SVG_FILES: Readonly<Record<string, string>> = files;
