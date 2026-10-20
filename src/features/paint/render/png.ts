import { RASTER_H, RASTER_W } from "../config.ts";
import { context2d, createCanvas, releaseCanvas } from "./canvas.ts";
import { loadSvg } from "./rasterize.ts";

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}

/** PNG bytes back into something drawImage takes, without colour conversion. */
export function pngToImage(png: ArrayBuffer): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([png], { type: "image/png" }), {
    colorSpaceConversion: "none",
    premultiplyAlpha: "default",
  });
}

/** The paint layer, scaled down for the picture book. */
export async function thumbnailPng(paint: HTMLCanvasElement, width = 240): Promise<Blob> {
  const height = Math.round((width * RASTER_H) / RASTER_W);
  const canvas = createCanvas(width, height);
  try {
    const ctx = context2d(canvas);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(paint, 0, 0, width, height);
    return await canvasToPng(canvas);
  } finally {
    releaseCanvas(canvas);
  }
}

/**
 * The finished picture for "Bild speichern": paint on white paper, the line
 * art multiplied on top — the same look as on screen.
 */
export async function picturePng(paint: HTMLCanvasElement, svg: string): Promise<Blob> {
  const art = await loadSvg(svg, RASTER_W, RASTER_H);
  const canvas = createCanvas(RASTER_W, RASTER_H);
  try {
    const ctx = context2d(canvas);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, RASTER_W, RASTER_H);
    ctx.drawImage(paint, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(art, 0, 0, RASTER_W, RASTER_H);
    return await canvasToPng(canvas);
  } finally {
    releaseCanvas(canvas);
  }
}
