// Mixing two colours like paint (spec §3.5): blue and yellow make green, red
// and blue purple, white makes lighter. RGB averaging would give grey mud, so
// the mix happens on the painter's red–yellow–blue wheel (Sugita & Takahashi,
// "Computational RYB Color Model"): RGB → RYB, average, RYB → RGB. Each step
// keeps the whiteness of a colour aside, so white and black mix as expected.

type Triple = [number, number, number];

/** How many mixed colours the tray keeps. */
export const MIX_SLOTS = 4;

function rgbToRyb([r0, g0, b0]: Triple): Triple {
  const w = Math.min(r0, g0, b0);
  let r = r0 - w;
  let g = g0 - w;
  let b = b0 - w;
  const maxG = Math.max(r, g, b);
  let y = Math.min(r, g);
  r -= y;
  g -= y;
  if (b > 0 && g > 0) {
    b /= 2;
    g /= 2;
  }
  y += g;
  b += g;
  const maxY = Math.max(r, y, b);
  const n = maxY > 0 ? maxG / maxY : 0;
  return [r * n + w, y * n + w, b * n + w];
}

function rybToRgb([r0, y0, b0]: Triple): Triple {
  const w = Math.min(r0, y0, b0);
  let r = r0 - w;
  let y = y0 - w;
  let b = b0 - w;
  const maxY = Math.max(r, y, b);
  let g = Math.min(y, b);
  y -= g;
  b -= g;
  if (b > 0 && g > 0) {
    b *= 2;
    g *= 2;
  }
  r += y;
  g += y;
  const maxG = Math.max(r, g, b);
  const n = maxG > 0 ? maxY / maxG : 0;
  return [r * n + w, g * n + w, b * n + w];
}

function parse(hex: string): Triple {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const byte = (c: number) => Math.round(Math.min(255, Math.max(0, c)));

function format(rgb: Triple): string {
  return `#${rgb.map((c) => byte(c).toString(16).padStart(2, "0").toUpperCase()).join("")}`;
}

/** Half of each colour (`#RRGGBB`), as `#RRGGBB`. The same either way round. */
export function mixColors(a: string, b: string): string {
  const ca = parse(a);
  const cb = parse(b);
  const ra = rgbToRyb(ca);
  const rb = rgbToRyb(cb);
  let mixed = rybToRgb([(ra[0] + rb[0]) / 2, (ra[1] + rb[1]) / 2, (ra[2] + rb[2]) / 2]);
  // The wheel darkens what it mixes (red and yellow come out brown): lift the
  // brightest channel halfway back towards the parents' brightness.
  const target = (Math.max(...ca) + Math.max(...cb)) / 2;
  const peak = Math.max(...mixed);
  if (peak > 0 && target > peak) {
    const lift = Math.sqrt(target / peak);
    mixed = [mixed[0] * lift, mixed[1] * lift, mixed[2] * lift];
  }
  return format(mixed);
}

/**
 * The tray's mixed colours after mixing `color`: newest first, at most
 * `slots`, the oldest dropping out. A colour already there moves to the
 * front; one of the fixed `palette` colours needs no slot.
 */
export function addMix(
  mixes: readonly string[],
  color: string,
  palette: readonly string[],
  slots = MIX_SLOTS,
): string[] {
  if (palette.includes(color)) return [...mixes];
  return [color, ...mixes.filter((c) => c !== color)].slice(0, slots);
}
