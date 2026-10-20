import { DILATE } from "../config.ts";
import { buildMask } from "../engine/mask.ts";
import type { Regions } from "../engine/regions.ts";
import { context2d, createCanvas, releaseCanvas } from "./canvas.ts";

export type MaskCanvas = { region: number; x0: number; y0: number; canvas: HTMLCanvasElement };

/**
 * Region masks as box-sized canvases, kept by total pixel area rather than
 * count: a replay that touches many small regions keeps them all, a full-page
 * background mask still fits, and Safari's canvas budget stays small.
 */
export class MaskCache {
  readonly #regions: Regions;
  readonly #maxArea: number;
  readonly #entries = new Map<number, MaskCanvas>();
  #area = 0;

  constructor(regions: Regions, maxArea = 6_000_000) {
    this.#regions = regions;
    this.#maxArea = maxArea;
  }

  get(region: number): MaskCanvas {
    const hit = this.#entries.get(region);
    if (hit) {
      // Most recently used last.
      this.#entries.delete(region);
      this.#entries.set(region, hit);
      return hit;
    }
    const mask = buildMask(this.#regions, region, DILATE);
    const canvas = createCanvas(mask.width, mask.height);
    const ctx = context2d(canvas);
    const img = ctx.createImageData(mask.width, mask.height);
    const px = new Uint32Array(img.data.buffer);
    for (let i = 0; i < mask.alpha.length; i++) if (mask.alpha[i]) px[i] = 0xff000000;
    ctx.putImageData(img, 0, 0);
    const entry = { region, x0: mask.x0, y0: mask.y0, canvas };
    this.#entries.set(region, entry);
    this.#area += canvas.width * canvas.height;
    for (const [key, old] of this.#entries) {
      if (this.#area <= this.#maxArea || key === region) break;
      this.#entries.delete(key);
      this.#area -= old.canvas.width * old.canvas.height;
      releaseCanvas(old.canvas);
    }
    return entry;
  }

  dispose(): void {
    for (const { canvas } of this.#entries.values()) releaseCanvas(canvas);
    this.#entries.clear();
    this.#area = 0;
  }
}
