// Plain <canvas> elements throughout: OffscreenCanvas 2D only arrived in
// iOS 16.4, and every canvas the paint path touches must be the same kind,
// so live drawing and replay rasterise identically.

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * The 2D context, or a clear error. Safari returns null without a word once
 * its canvas memory budget is spent, so this is where that shows up.
 */
export function context2d(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", options);
  if (!ctx) throw new Error(`No 2D context for a ${canvas.width}×${canvas.height} canvas`);
  return ctx;
}

/** Give a canvas's memory back now instead of whenever it is collected (Safari's budget). */
export function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}
