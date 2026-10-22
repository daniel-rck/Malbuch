import { describe, expect, it } from "vitest";
import { checkManifest, checkSvg } from "./check.ts";
import { AGE_GROUPS, ageGroup } from "./groups.ts";
import { loadAllSeasons, PAGES, SVG_FILES } from "./manifest.ts";
import { PAGE_META } from "./meta.ts";

const seasonPages = await loadAllSeasons();
const all = [...PAGES, ...seasonPages];

describe("the colouring pages", () => {
  it("are all listed, each with its SVG", () => {
    expect(checkManifest(PAGE_META, SVG_FILES, AGE_GROUPS)).toEqual([]);
    expect(all).toHaveLength(PAGE_META.length);
    expect(seasonPages.every((p) => p.season !== undefined)).toBe(true);
  });

  it.each(all.map((p) => [p.id, p] as const))("%s follows the convention", (_, page) => {
    expect(checkSvg(page.svg, ageGroup(page.group))).toEqual([]);
  });

  it("fill every group", () => {
    for (const group of AGE_GROUPS) {
      expect(PAGES.filter((p) => p.group === group.id).length).toBeGreaterThanOrEqual(6);
    }
  });
});

const page = (body: string, g = '<g fill="#fff" stroke="#1E2238" stroke-width="7">') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">${g}${body}</g></svg>`;

describe("checkManifest", () => {
  const files = ["./klein/a.svg", "./saison/ostern/b.svg"];

  it("finds season pages in their season's folder", () => {
    const meta = [
      { id: "a", name: "A", group: "klein" as const },
      { id: "b", name: "B", group: "klein" as const, season: "ostern" as const },
    ];
    expect(checkManifest(meta, files, [ageGroup("klein")])).toEqual([
      "group klein has 0 pages for season sommer, wants 1",
      "group klein has 0 pages for season halloween, wants 1",
      "group klein has 0 pages for season weihnachten, wants 1",
    ]);
  });

  it("keeps season pages apart from surprise pages", () => {
    const meta = [
      { id: "a", name: "A", group: "klein" as const },
      {
        id: "b",
        name: "B",
        group: "klein" as const,
        season: "ostern" as const,
        unlockDay: 1 as const,
      },
    ];
    expect(checkManifest(meta, files, [ageGroup("klein")])).toContain(
      "page b: a season page has no unlockDay",
    );
  });
});

describe("checkSvg", () => {
  const group = ageGroup("gross");

  it("accepts a page by the convention", () => {
    expect(checkSvg(page('<circle cx="1" cy="1" r="40"/>'), group)).toEqual([]);
  });

  it("rejects images, scripts, external references and stray colours", () => {
    expect(checkSvg(page('<image href="x.png"/>'), group)).toEqual([
      "no href references",
      "element <image> is not allowed",
    ]);
    expect(checkSvg(page("<script>alert(1)</script>"), group).join()).toMatch(/<script>/);
    expect(checkSvg(page('<rect fill="url(#a)"/>'), group).join()).toMatch(/url\(\)/);
    expect(checkSvg(page('<rect fill="#f00"/>'), group).join()).toMatch(/fill="#f00"/);
  });

  it("holds the stroke width to the group's range", () => {
    expect(checkSvg(page('<path stroke-width="4" d="M0 0"/>'), group).join()).toMatch(/4 outside/);
    expect(checkSvg(page("", '<g stroke="#1E2238" stroke-width="7">'), ageGroup("klein"))).toEqual([
      "stroke-width 7 outside 8–8 for group klein",
    ]);
  });

  it("wants text unstroked, in the line colour", () => {
    const text = '<text x="1" y="1" fill="#222" stroke="none">Hallo</text>';
    expect(checkSvg(page(text), group)).toEqual(['<text> needs fill="#1E2238"']);
  });
});
