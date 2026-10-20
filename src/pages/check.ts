import type { AgeGroup } from "./groups.ts";
import type { PageMeta } from "./meta.ts";

// The page convention (spec §6) as checks on the SVG text. Used by
// `bun run check:pages` and by the page test, so CI enforces it too.

export const LINE_COLOR = "#1E2238";

const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "line",
  "text",
  "tspan",
]);
const ALLOWED_FILLS = new Set(["#fff", "none", LINE_COLOR]);
const ALLOWED_STROKES = new Set([LINE_COLOR, "none"]);

/** Problems with one page's SVG; empty when it follows the convention. */
export function checkSvg(svg: string, group: AgeGroup): string[] {
  const problems: string[] = [];
  const root = /<svg\b([^>]*)>/.exec(svg)?.[1];
  if (root === undefined) return ["no <svg> root element"];
  for (const [name, value] of [
    ["xmlns", "http://www.w3.org/2000/svg"],
    ["viewBox", "0 0 800 1000"],
    ["width", "800"],
    ["height", "1000"],
  ]) {
    if (attr(root, name ?? "") !== value) problems.push(`<svg> needs ${name}="${value}"`);
  }
  if (/<!(DOCTYPE|ENTITY)/i.test(svg)) problems.push("no DOCTYPE or entities");
  if (/\burl\s*\(/i.test(svg)) problems.push("no url() references");
  if (/\b(xlink:)?href\s*=/i.test(svg)) problems.push("no href references");
  if (/\son[a-z]+\s*=/i.test(svg)) problems.push("no event handler attributes");

  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name = "", attrs = "", selfClosing] = m;
    if (!ALLOWED_ELEMENTS.has(name)) {
      problems.push(`element <${name}> is not allowed`);
      continue;
    }
    if (closing) {
      if (stack.pop() !== name) problems.push(`unbalanced </${name}>`);
      continue;
    }
    if (!selfClosing) stack.push(name);

    const width = attr(attrs, "stroke-width");
    if (width !== undefined) {
      const w = Number(width);
      const [min, max] = group.stroke;
      if (!(w >= min && w <= max)) {
        problems.push(`stroke-width ${width} outside ${min}–${max} for group ${group.id}`);
      }
    }
    const fill = attr(attrs, "fill");
    if (fill !== undefined && !ALLOWED_FILLS.has(fill) && name !== "text" && name !== "tspan") {
      problems.push(`fill="${fill}" (allowed: ${[...ALLOWED_FILLS].join(", ")})`);
    }
    const stroke = attr(attrs, "stroke");
    if (stroke !== undefined && !ALLOWED_STROKES.has(stroke)) {
      problems.push(`stroke="${stroke}" (allowed: ${[...ALLOWED_STROKES].join(", ")})`);
    }
    if (name === "text" && stroke !== "none") problems.push('<text> needs stroke="none"');
    if (name === "text" && fill !== LINE_COLOR) problems.push(`<text> needs fill="${LINE_COLOR}"`);
  }
  if (stack.length > 0) problems.push(`unclosed <${stack.join(">, <")}>`);

  const top = /<svg\b[^>]*>(?:\s|<!--[\s\S]*?-->)*<g\b([^>]*)>/.exec(svg)?.[1] ?? "";
  if (attr(top, "stroke-width") === undefined || attr(top, "stroke") !== LINE_COLOR) {
    problems.push(`the first <g> sets stroke="${LINE_COLOR}" and a stroke-width for the page`);
  }
  return problems;
}

/** Problems between the page list and the SVG files present (paths like `./klein/fisch.svg`). */
export function checkManifest(
  meta: readonly PageMeta[],
  files: readonly string[],
  groups: readonly AgeGroup[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const expected = new Set<string>();
  for (const page of meta) {
    if (ids.has(page.id)) problems.push(`page id ${page.id} is listed twice`);
    ids.add(page.id);
    if (!/^[a-z][a-z0-9-]*$/.test(page.id)) problems.push(`page id ${page.id}: use a-z, 0-9, -`);
    if (!groups.some((g) => g.id === page.group)) {
      problems.push(`page ${page.id}: unknown group ${page.group}`);
    }
    const path = `./${page.group}/${page.id}.svg`;
    expected.add(path);
    if (!files.includes(path)) problems.push(`page ${page.id}: ${path} is missing`);
  }
  for (const file of files) {
    if (!expected.has(file)) problems.push(`${file} is not listed in src/pages/meta.ts`);
  }
  return problems;
}

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`).exec(attrs);
  return m?.[1];
}
