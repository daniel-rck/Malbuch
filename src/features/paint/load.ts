import type { OpsRecord } from "../../lib/db/db.ts";
import type { Page } from "../../pages/manifest.ts";
import {
  LABEL_SCHEMA,
  LINE_THRESHOLD,
  RASTER_H,
  RASTER_SCALE,
  RASTER_W,
  SPECK_AREA,
} from "./config.ts";
import {
  deletePreview,
  loadLabels,
  loadOps,
  loadPreview,
  pruneLabels,
  saveLabels,
  saveOps,
} from "./db.ts";
import { fnv1a } from "./engine/hash.ts";
import { type Op, opsDigest } from "./engine/ops.ts";
import { labelRegions, type Regions } from "./engine/regions.ts";
import { createCanvas, releaseCanvas } from "./render/canvas.ts";
import { MaskCache } from "./render/masks.ts";
import { PageCanvas } from "./render/page-canvas.ts";
import { canvasToPng, pngToImage } from "./render/png.ts";
import { rasterizeDarkness } from "./render/rasterize.ts";

export type LoadedPage = {
  page: Page;
  labelsKey: string;
  regions: Regions;
  ops: Op[];
  base: { png: ArrayBuffer; image: ImageBitmap } | null;
  snapshot: { image: ImageBitmap; opCount: number; digest: string } | null;
};

/**
 * Region ids depend on exactly how the art was rasterised and labelled, so
 * the labels an op log was made with are stored under a key naming all of it.
 */
export function labelsKeyFor(page: Page): string {
  return `${page.id}:${fnv1a(page.svg)}:v${LABEL_SCHEMA}:s${RASTER_SCALE}`;
}

async function regionsFor(page: Page, key: string): Promise<Regions> {
  const cached = await loadLabels(key);
  if (cached) return cached;
  const darkness = await rasterizeDarkness(page.svg, RASTER_W, RASTER_H);
  const regions = labelRegions(darkness, RASTER_W, RASTER_H, LINE_THRESHOLD, SPECK_AREA);
  void saveLabels(key, page.id, regions);
  return regions;
}

/** Everything a page needs to show and continue the child's picture. */
export async function loadPage(page: Page): Promise<LoadedPage> {
  const labelsKey = labelsKeyFor(page);
  const regions = await regionsFor(page, labelsKey);
  let record = await readLog(page.id);
  let preview = await loadPreview(page.id);
  const keep = [labelsKey];

  if (record && record.labelsKey !== labelsKey) {
    // The art (or the labelling) changed since these ops were painted: their
    // region ids mean nothing now. Render them once with the labels they were
    // made with; the result becomes the page's start image.
    const oldKey = record.labelsKey;
    const base = await renderWithOldLabels(oldKey, record.ops, record.base, preview?.png);
    record = { id: page.id, labelsKey, ops: [], base, updatedAt: Date.now() };
    if (await saveOps(record)) await deletePreview(page.id);
    // Not stored: the old log is still there, so its labels and preview stay
    // for the next try.
    else keep.push(oldKey);
    preview = undefined;
  }
  void pruneLabels(page.id, keep);

  const ops = record?.ops ?? [];
  const base = record?.base ? { png: record.base, image: await pngToImage(record.base) } : null;
  let snapshot: LoadedPage["snapshot"] = null;
  if (
    preview &&
    preview.opCount <= ops.length &&
    preview.digest === opsDigest(ops, preview.opCount)
  ) {
    try {
      const image = await pngToImage(preview.png);
      snapshot = { image, opCount: preview.opCount, digest: preview.digest };
    } catch (error) {
      console.warn("Malbuch: stored preview is unreadable, replaying instead", error);
    }
  }
  return { page, labelsKey, regions, ops, base, snapshot };
}

/**
 * The op log, read once more if the first read fails (Safari drops idle
 * connections); a second failure stops the page from opening rather than
 * letting it start empty and overwrite the stored log.
 */
async function readLog(id: string): Promise<OpsRecord | undefined> {
  try {
    return await loadOps(id);
  } catch (error) {
    console.warn("Malbuch: could not read the op log, trying again", error);
    return await loadOps(id);
  }
}

async function renderWithOldLabels(
  key: string,
  ops: Op[],
  base: ArrayBuffer | undefined,
  preview: ArrayBuffer | undefined,
): Promise<ArrayBuffer | undefined> {
  const old = await loadLabels(key);
  // Without the old labels the last preview is the best record of the picture.
  if (!old) return preview ?? base;
  const paint = createCanvas(RASTER_W, RASTER_H);
  const live = createCanvas(RASTER_W, RASTER_H);
  const masks = new MaskCache(old);
  let image: ImageBitmap | null = null;
  try {
    image = base ? await pngToImage(base) : null;
    const canvas = new PageCanvas({ paint, live, regions: old, masks, ops: [...ops], base: image });
    canvas.dispose();
    return await (await canvasToPng(paint)).arrayBuffer();
  } finally {
    image?.close();
    masks.dispose();
    releaseCanvas(paint);
    releaseCanvas(live);
  }
}
