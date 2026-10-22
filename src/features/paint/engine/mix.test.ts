import { describe, expect, it } from "vitest";
import { PALETTE } from "../config.ts";
import { addMix, mixColors } from "./mix.ts";

const color = (label: string) => {
  const c = PALETTE.find((p) => p.label === label);
  if (!c) throw new Error(label);
  return c.color;
};
const sum = (c: number[]) => c.reduce((a, b) => a + b, 0);
const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

describe("mixColors", () => {
  it("mixes like paint: blue and yellow make green", () => {
    const [r = 0, g = 0, b = 0] = rgb(mixColors(color("Blau"), color("Gelb")));
    expect(g).toBeGreaterThan(r + 50);
    expect(g).toBeGreaterThan(b + 50);
  });

  it("red and yellow make orange, red and blue purple", () => {
    const [r1 = 0, g1 = 0, b1 = 0] = rgb(mixColors(color("Rot"), color("Gelb")));
    expect(r1).toBeGreaterThan(g1);
    expect(g1).toBeGreaterThan(b1 + 30);
    const [r2 = 0, g2 = 0, b2 = 0] = rgb(mixColors(color("Rot"), color("Blau")));
    expect(Math.min(r2, b2)).toBeGreaterThan(g2 + 30);
  });

  it("white makes lighter, black darker", () => {
    const red = rgb(color("Rot"));
    const pink = rgb(mixColors(color("Rot"), color("Weiß")));
    const dark = rgb(mixColors(color("Rot"), color("Schwarz")));
    expect(sum(pink)).toBeGreaterThan(sum(red) + 100);
    expect(sum(dark)).toBeLessThan(sum(red) - 50);
  });

  it("gives a colour mixed with itself back, either way round the same", () => {
    for (const { color: c } of PALETTE) expect(mixColors(c, c)).toBe(c);
    expect(mixColors("#1E88E5", "#FDD835")).toBe(mixColors("#FDD835", "#1E88E5"));
    expect(mixColors("#1E88E5", "#FDD835")).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("addMix", () => {
  const palette = PALETTE.map((p) => p.color as string);

  it("puts the newest first and drops the oldest past the slots", () => {
    let mixes: string[] = [];
    for (const c of ["#000001", "#000002", "#000003", "#000004", "#000005"]) {
      mixes = addMix(mixes, c, palette);
    }
    expect(mixes).toEqual(["#000005", "#000004", "#000003", "#000002"]);
  });

  it("moves a colour already there to the front, and skips palette colours", () => {
    expect(addMix(["#000001", "#000002"], "#000002", palette)).toEqual(["#000002", "#000001"]);
    expect(addMix(["#000001"], color("Rot"), palette)).toEqual(["#000001"]);
  });
});
