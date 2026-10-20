import { LINE, type Regions } from "./regions.ts";

export type RegionStat = { id: number; area: number; inscribed: number };

/**
 * Per region, its area and the side of the largest axis-aligned square that
 * fits inside (raster px, from a chessboard distance transform) — how much
 * room a child has to colour it. For the page check, not the paint path.
 */
export function regionStats(regions: Regions): RegionStat[] {
  const { width: w, height: h, labels, count, areas } = regions;
  const d = new Int32Array(w * h);
  const at = (x: number, y: number, label: number) =>
    x < 0 || y < 0 || x >= w || y >= h || labels[y * w + x] !== label ? 0 : (d[y * w + x] ?? 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const l = labels[i] ?? LINE;
      if (l === LINE) continue;
      d[i] =
        1 + Math.min(at(x - 1, y, l), at(x, y - 1, l), at(x - 1, y - 1, l), at(x + 1, y - 1, l));
    }
  }
  const best = new Int32Array(count + 1);
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      const l = labels[i] ?? LINE;
      if (l === LINE) continue;
      const v = Math.min(
        d[i] ?? 0,
        1 + Math.min(at(x + 1, y, l), at(x, y + 1, l), at(x + 1, y + 1, l), at(x - 1, y + 1, l)),
      );
      d[i] = v;
      if (v > (best[l] ?? 0)) best[l] = v;
    }
  }
  const stats: RegionStat[] = [];
  for (let id = 1; id <= count; id++) {
    stats.push({ id, area: areas[id] ?? 0, inscribed: Math.max(0, 2 * (best[id] ?? 0) - 1) });
  }
  return stats;
}
