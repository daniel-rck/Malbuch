import { saveOps, savePreview } from "./db.ts";
import { opsDigest } from "./engine/ops.ts";
import type { PageCanvas } from "./render/page-canvas.ts";
import { canvasToPng, thumbnailPng } from "./render/png.ts";

const OPS_DELAY = 400;
const PREVIEW_DELAY = 3000;

/**
 * Saves one page (spec §3 "Autosave", §5.5): the op log shortly after every
 * op, the preview PNGs — slow to encode at full size — only after a pause,
 * on page switch and when the app goes to the background (`flush`).
 */
export class Autosave {
  readonly #pageId: string;
  readonly #labelsKey: string;
  readonly #base: ArrayBuffer | undefined;
  readonly #canvas: PageCanvas;
  readonly #paint: HTMLCanvasElement;
  #previewDigest: string | null;
  #opsTimer: ReturnType<typeof setTimeout> | undefined;
  #previewTimer: ReturnType<typeof setTimeout> | undefined;
  #opsDirty = false;

  constructor(options: {
    pageId: string;
    labelsKey: string;
    base: ArrayBuffer | undefined;
    canvas: PageCanvas;
    paint: HTMLCanvasElement;
    /** Digest of the stored preview, if it matches the whole log already. */
    previewDigest: string | null;
  }) {
    this.#pageId = options.pageId;
    this.#labelsKey = options.labelsKey;
    this.#base = options.base;
    this.#canvas = options.canvas;
    this.#paint = options.paint;
    this.#previewDigest = options.previewDigest;
  }

  /** After every change of the op log. */
  changed(): void {
    this.#opsDirty = true;
    clearTimeout(this.#opsTimer);
    this.#opsTimer = setTimeout(() => void this.#saveOps(), OPS_DELAY);
    clearTimeout(this.#previewTimer);
    this.#previewTimer = setTimeout(() => void this.#savePreview(), PREVIEW_DELAY);
  }

  /** Save whatever is pending now: page switch, picture book, app in the background. */
  async flush(): Promise<void> {
    clearTimeout(this.#opsTimer);
    clearTimeout(this.#previewTimer);
    await this.#saveOps();
    await this.#savePreview();
  }

  dispose(): void {
    clearTimeout(this.#opsTimer);
    clearTimeout(this.#previewTimer);
  }

  async #saveOps(): Promise<void> {
    if (!this.#opsDirty) return;
    this.#opsDirty = false;
    await saveOps({
      id: this.#pageId,
      labelsKey: this.#labelsKey,
      ops: [...this.#canvas.ops],
      ...(this.#base ? { base: this.#base } : {}),
      updatedAt: Date.now(),
    });
  }

  async #savePreview(): Promise<void> {
    if (this.#canvas.isDrawing) {
      this.#previewTimer = setTimeout(() => void this.#savePreview(), PREVIEW_DELAY);
      return;
    }
    const ops = this.#canvas.ops;
    const digest = opsDigest(ops);
    if (digest === this.#previewDigest) return;
    // Both encoders read the canvas before their first await, so the images
    // match `ops` as they are now even if the child keeps painting.
    const opCount = ops.length;
    const pngPromise = canvasToPng(this.#paint);
    const thumbPromise = thumbnailPng(this.#paint);
    try {
      const [png, thumb] = await Promise.all([pngPromise, thumbPromise]);
      const ok = await savePreview({
        id: this.#pageId,
        png: await png.arrayBuffer(),
        opCount,
        digest,
        thumb: await thumb.arrayBuffer(),
        updatedAt: Date.now(),
      });
      if (ok) this.#previewDigest = digest;
    } catch (error) {
      console.warn("Malbuch: could not render the preview", error);
    }
  }
}
