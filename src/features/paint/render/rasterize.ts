import { createCanvas, context2d, releaseCanvas } from "./canvas.ts";

/** The SVG with its root width/height set, so it rasterises crisply at that size. */
export function sizedSvg(svg: string, width: number, height: number): string {
  return svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag
      .replace(/\swidth="[^"]*"/, "")
      .replace(/\sheight="[^"]*"/, "")
      .replace(/^<svg\b/, `<svg width="${width}" height="${height}"`),
  );
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function loadSvg(
  svg: string,
  width: number,
  height: number,
): Promise<HTMLImageElement> {
  const img = new Image(width, height);
  img.src = svgDataUrl(sizedSvg(svg, width, height));
  await img.decode();
  return img;
}

/**
 * Rasterise line art on white and return its darkness, 255 − luminance per
 * pixel (spec §5.2 step 1) — the input of labelRegions.
 */
export async function rasterizeDarkness(
  svg: string,
  width: number,
  height: number,
): Promise<Uint8ClampedArray> {
  const img = await loadSvg(svg, width, height);
  const canvas = createCanvas(width, height);
  try {
    const ctx = context2d(canvas, { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const darkness = new Uint8ClampedArray(width * height);
    for (let i = 0, j = 0; i < darkness.length; i++, j += 4) {
      darkness[i] =
        255 - ((rgba[j] ?? 0) * 0.299 + (rgba[j + 1] ?? 0) * 0.587 + (rgba[j + 2] ?? 0) * 0.114);
    }
    return darkness;
  } finally {
    releaseCanvas(canvas);
  }
}
