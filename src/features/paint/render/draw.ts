import { RASTER_H, RASTER_SCALE, RASTER_W } from "../config.ts";
import { strokeBox } from "../engine/ops.ts";
import type { MaskCanvas } from "./masks.ts";

// The drawing primitives shared by live input and replay. Each sets every
// piece of context state it relies on, so the same call sequence on the same
// canvases gives the same pixels — that is what makes undo exact.

/** A box in raster px: x, y, width, height (whole pixels, inside the canvas). */
export type Box = { x: number; y: number; w: number; h: number };

export function rasterBox(x0: number, y0: number, x1: number, y1: number): Box | null {
  const x = Math.max(0, Math.floor(x0));
  const y = Math.max(0, Math.floor(y0));
  const r = Math.min(RASTER_W, Math.ceil(x1));
  const b = Math.min(RASTER_H, Math.ceil(y1));
  return r > x && b > y ? { x, y, w: r - x, h: b - y } : null;
}

/** The raster box a stroke of `width` doc px through `pts` can touch. */
export function strokeRasterBox(pts: readonly number[], width: number): Box | null {
  const [x0, y0, x1, y1] = strokeBox(pts, width);
  return rasterBox(x0 * RASTER_SCALE, y0 * RASTER_SCALE, x1 * RASTER_SCALE, y1 * RASTER_SCALE);
}

export function maskBox(mask: MaskCanvas): Box {
  return { x: mask.x0, y: mask.y0, w: mask.canvas.width, h: mask.canvas.height };
}

export function intersect(a: Box | null, b: Box | null): Box | null {
  if (!a || !b) return null;
  return rasterBox(
    Math.max(a.x, b.x),
    Math.max(a.y, b.y),
    Math.min(a.x + a.w, b.x + b.w),
    Math.min(a.y + a.h, b.y + b.h),
  );
}

export function union(a: Box | null, b: Box | null): Box | null {
  if (!a) return b;
  if (!b) return a;
  return rasterBox(
    Math.min(a.x, b.x),
    Math.min(a.y, b.y),
    Math.max(a.x + a.w, b.x + b.w),
    Math.max(a.y + a.h, b.y + b.h),
  );
}

/**
 * Stroke the segments ending at points `from`… of a flat doc-px point list,
 * one path per segment (the first point is a dot). Drawing a list in pieces
 * issues the same calls as drawing it at once.
 */
export function drawSegments(
  ctx: CanvasRenderingContext2D,
  pts: readonly number[],
  from: number,
  width: number,
  color: string,
  mode: GlobalCompositeOperation,
): void {
  ctx.setTransform(RASTER_SCALE, 0, 0, RASTER_SCALE, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = mode;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  const n = Math.floor(pts.length / 2);
  for (let k = Math.max(0, from); k < n; k++) {
    const a = k === 0 ? 0 : 2 * (k - 1);
    ctx.beginPath();
    ctx.moveTo(pts[a] ?? 0, pts[a + 1] ?? 0);
    // The nudge gives a zero-length segment (a dot) its round caps.
    ctx.lineTo((pts[2 * k] ?? 0) + 0.01, pts[2 * k + 1] ?? 0);
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

/** Fill `box` of the stroke canvas with a colour (a fill op's "stroke"). */
export function fillBox(ctx: CanvasRenderingContext2D, box: Box, color: string): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

/**
 * live := stroke ∩ mask, within `box` only (spec §5.2 step 6). The clip keeps
 * `copy` and `destination-in` from clearing the rest of the canvas.
 */
export function composeMasked(
  live: CanvasRenderingContext2D,
  stroke: HTMLCanvasElement,
  mask: MaskCanvas | null,
  box: Box,
): void {
  live.save();
  live.setTransform(1, 0, 0, 1, 0, 0);
  live.globalAlpha = 1;
  live.imageSmoothingEnabled = false;
  live.beginPath();
  live.rect(box.x, box.y, box.w, box.h);
  live.clip();
  live.globalCompositeOperation = "copy";
  live.drawImage(stroke, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
  if (mask) {
    live.globalCompositeOperation = "destination-in";
    live.drawImage(mask.canvas, mask.x0, mask.y0);
  }
  live.restore();
}

/** Put `box` of the live canvas onto paint, then wipe it from live and stroke. */
export function commitBox(
  paint: CanvasRenderingContext2D,
  live: CanvasRenderingContext2D,
  stroke: CanvasRenderingContext2D,
  box: Box,
): void {
  paint.save();
  paint.setTransform(1, 0, 0, 1, 0, 0);
  paint.globalAlpha = 1;
  paint.globalCompositeOperation = "source-over";
  paint.imageSmoothingEnabled = false;
  paint.drawImage(live.canvas, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
  paint.restore();
  live.clearRect(box.x, box.y, box.w, box.h);
  stroke.clearRect(box.x, box.y, box.w, box.h);
}

/** Replace all of `target` with `source` (restoring a checkpoint, taking one). */
export function copyCanvas(target: CanvasRenderingContext2D, source: CanvasImageSource): void {
  target.save();
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.globalAlpha = 1;
  target.imageSmoothingEnabled = false;
  target.globalCompositeOperation = "copy";
  target.drawImage(source, 0, 0, RASTER_W, RASTER_H);
  target.restore();
}
