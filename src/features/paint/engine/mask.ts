import { LINE, type Regions } from "./regions.ts";

/** A region's paint mask, cut to its box: 255 where paint may go, 0 elsewhere. */
export type Mask = {
  region: number;
  x0: number;
  y0: number;
  width: number;
  height: number;
  alpha: Uint8Array;
};

/**
 * The region plus every line pixel reachable from it through line pixels in
 * at most `dilate` 4-neighbour steps (spec §5.2 step 5) — so paint reaches
 * under the lines and leaves no white seam. The same set as the prototype's
 * pass-by-pass dilation, found breadth-first: one scan of the box, then only
 * the line pixels near the region.
 */
export function buildMask(regions: Regions, region: number, dilate: number): Mask {
  const { width: w, height: h, labels, boxes } = regions;
  const b = region * 4;
  // Every pixel ≤ dilate steps from the region lies within its box + dilate.
  const x0 = Math.max(0, (boxes[b] ?? 0) - dilate);
  const y0 = Math.max(0, (boxes[b + 1] ?? 0) - dilate);
  const x1 = Math.min(w - 1, (boxes[b + 2] ?? 0) + dilate);
  const y1 = Math.min(h - 1, (boxes[b + 3] ?? 0) + dilate);
  const mw = x1 - x0 + 1;
  const mh = y1 - y0 + 1;
  const alpha = new Uint8Array(mw * mh);

  let frontier: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (labels[y * w + x] === region) alpha[(y - y0) * mw + (x - x0)] = 255;
    }
  }
  // Distance 1: line pixels with a region neighbour.
  const reach = dilate > 0 ? y1 : y0 - 1;
  for (let y = y0; y <= reach; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (labels[i] !== LINE) continue;
      if (
        (x > 0 && labels[i - 1] === region) ||
        (x < w - 1 && labels[i + 1] === region) ||
        (y > 0 && labels[i - w] === region) ||
        (y < h - 1 && labels[i + w] === region)
      ) {
        const m = (y - y0) * mw + (x - x0);
        alpha[m] = 255;
        frontier.push(m);
      }
    }
  }
  // Distances 2…dilate: unvisited line neighbours of the previous layer.
  for (let d = 2; d <= dilate && frontier.length > 0; d++) {
    const next: number[] = [];
    for (const m of frontier) {
      const mx = m % mw;
      const my = (m - mx) / mw;
      const i = (my + y0) * w + (mx + x0);
      if (mx > 0 && alpha[m - 1] === 0 && labels[i - 1] === LINE) {
        alpha[m - 1] = 255;
        next.push(m - 1);
      }
      if (mx < mw - 1 && alpha[m + 1] === 0 && labels[i + 1] === LINE) {
        alpha[m + 1] = 255;
        next.push(m + 1);
      }
      if (my > 0 && alpha[m - mw] === 0 && labels[i - w] === LINE) {
        alpha[m - mw] = 255;
        next.push(m - mw);
      }
      if (my < mh - 1 && alpha[m + mw] === 0 && labels[i + w] === LINE) {
        alpha[m + mw] = 255;
        next.push(m + mw);
      }
    }
    frontier = next;
  }
  return { region, x0, y0, width: mw, height: mh, alpha };
}
