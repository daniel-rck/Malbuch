import { describe, expect, it } from "vitest";
import { checkManifest, checkSvg } from "./check.ts";
import { AGE_GROUPS, ageGroup } from "./groups.ts";
import { PAGES, SVG_FILES } from "./manifest.ts";
import { PAGE_META } from "./meta.ts";

describe("the colouring pages", () => {
  it("are all listed, each with its SVG", () => {
    expect(checkManifest(PAGE_META, Object.keys(SVG_FILES), AGE_GROUPS)).toEqual([]);
    expect(PAGES).toHaveLength(PAGE_META.length);
  });

  it.each(PAGES.map((p) => [p.id, p] as const))("%s follows the convention", (_, page) => {
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
