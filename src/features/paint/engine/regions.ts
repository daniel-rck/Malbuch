// Region labelling (spec §5.2 steps 3–4): every non-line pixel belongs to one
// numbered region, found by a 4-neighbour flood fill.

export const LINE = -1;

export type Regions = {
  width: number;
  height: number;
  /** Per pixel: LINE, or the region id 1…count. */
  labels: Int32Array;
  count: number;
  /** Per region id (index 0 unused): x0, y0, x1, y1, inclusive. */
  boxes: Int32Array;
  /** Per region id (index 0 unused): pixel count. */
  areas: Int32Array;
};

/**
 * Label the regions of a darkness buffer (255 − luminance per pixel). Pixels
 * darker than `threshold` are line; regions smaller than `minArea` px become
 * line too. Ids follow the scan order, so the same buffer always gets the same
 * ids — ops store them and rely on that.
 */
export function labelRegions(
  darkness: ArrayLike<number>,
  width: number,
  height: number,
  threshold: number,
  minArea = 0,
): Regions {
  const n = width * height;
  const labels = new Int32Array(n);
  for (let i = 0; i < n; i++) if ((darkness[i] ?? 0) > threshold) labels[i] = LINE;

  // Each pixel is pushed at most once (it is labelled when pushed), so a stack
  // of n entries never overflows.
  const stack = new Int32Array(n);
  const boxes: number[] = [0, 0, 0, 0];
  const areas: number[] = [0];
  let id = 0;
  for (let s = 0; s < n; s++) {
    if (labels[s] !== 0) continue;
    id++;
    let sp = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let area = 0;
    stack[sp++] = s;
    labels[s] = id;
    while (sp > 0) {
      const p = stack[--sp] ?? 0;
      const x = p % width;
      const y = (p - x) / width;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && labels[p - 1] === 0) {
        labels[p - 1] = id;
        stack[sp++] = p - 1;
      }
      if (x < width - 1 && labels[p + 1] === 0) {
        labels[p + 1] = id;
        stack[sp++] = p + 1;
      }
      if (p >= width && labels[p - width] === 0) {
        labels[p - width] = id;
        stack[sp++] = p - width;
      }
      if (p + width < n && labels[p + width] === 0) {
        labels[p + width] = id;
        stack[sp++] = p + width;
      }
    }
    boxes.push(minX, minY, maxX, maxY);
    areas.push(area);
  }

  if (minArea <= 0 || areas.every((a, i) => i === 0 || a >= minArea)) {
    return {
      width,
      height,
      labels,
      count: id,
      boxes: Int32Array.from(boxes),
      areas: Int32Array.from(areas),
    };
  }
  return dropSpecks(labels, width, height, id, boxes, areas, minArea);
}

/** Turn regions under `minArea` into line and renumber the rest, keeping their order. */
function dropSpecks(
  labels: Int32Array,
  width: number,
  height: number,
  count: number,
  boxes: number[],
  areas: number[],
  minArea: number,
): Regions {
  const remap = new Int32Array(count + 1);
  const keptBoxes: number[] = [0, 0, 0, 0];
  const keptAreas: number[] = [0];
  let next = 0;
  for (let id = 1; id <= count; id++) {
    const area = areas[id] ?? 0;
    if (area < minArea) {
      remap[id] = LINE;
      continue;
    }
    remap[id] = ++next;
    keptBoxes.push(...boxes.slice(id * 4, id * 4 + 4));
    keptAreas.push(area);
  }
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i] ?? LINE;
    if (l > 0) labels[i] = remap[l] ?? LINE;
  }
  return {
    width,
    height,
    labels,
    count: next,
    boxes: Int32Array.from(keptBoxes),
    areas: Int32Array.from(keptAreas),
  };
}

/**
 * The region at (x, y) in raster px. A point on a line takes the nearest
 * region within `radius` (searched in growing square rings, like the
 * prototype); none within reach gives null — the stroke then goes unclipped.
 */
export function regionAt(regions: Regions, x: number, y: number, radius: number): number | null {
  const { width, height, labels } = regions;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (let r = 0; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      const yy = cy + dy;
      if (yy < 0 || yy >= height) continue;
      // On the ring's top and bottom rows every x; in between only both ends.
      const step = dy === -r || dy === r ? 1 : 2 * r;
      for (let dx = -r; dx <= r; dx += step || 1) {
        const xx = cx + dx;
        if (xx < 0 || xx >= width) continue;
        const l = labels[yy * width + xx] ?? LINE;
        if (l > 0) return l;
      }
    }
  }
  return null;
}
