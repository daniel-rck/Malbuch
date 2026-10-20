import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAll } from "../../lib/db/db.ts";
import { pageById } from "../../pages/manifest.ts";
import { loadOps, loadPreview, saveLabels, saveOps, savePreview } from "./db.ts";
import { type Op, opsDigest } from "./engine/ops.ts";
import { labelRegions } from "./engine/regions.ts";
import { grid } from "./engine/test/grid.ts";
import { labelsKeyFor, loadPage } from "./load.ts";

// jsdom has no canvas: decoding PNGs is faked; labels come from the cache.
vi.mock("./render/png.ts", () => ({
  pngToImage: vi.fn<(png: ArrayBuffer) => Promise<unknown>>(async (png) => ({ png, close() {} })),
  canvasToPng: vi.fn<() => Promise<Blob>>(),
}));

const page = pageById("drache");
if (!page) throw new Error("drache missing");
const key = labelsKeyFor(page);
const art = grid(["....", ".##.", "...."]);
const regions = labelRegions(art.darkness, art.width, art.height, 110);
const red: Op = { t: "fill", color: "#E53935", region: 1 };
const blue: Op = { t: "fill", color: "#1E88E5", region: 1 };

async function preview(ops: Op[], opCount: number) {
  await savePreview({
    id: "drache",
    png: new Uint8Array([opCount]).buffer,
    opCount,
    digest: opsDigest(ops, opCount),
    thumb: new ArrayBuffer(1),
    updatedAt: 1,
  });
}

beforeEach(async () => {
  await clearAll();
  await saveLabels(key, "drache", regions);
});

describe("loadPage", () => {
  it("opens a fresh page with its cached labels and no ops", async () => {
    const loaded = await loadPage(page);
    expect(loaded.regions).toEqual(regions);
    expect(loaded.ops).toEqual([]);
    expect(loaded.snapshot).toBeNull();
  });

  it("uses a snapshot whose digest matches the log, also behind the log's end", async () => {
    await saveOps({ id: "drache", labelsKey: key, ops: [red, blue], updatedAt: 1 });
    await preview([red, blue], 1);
    const loaded = await loadPage(page);
    expect(loaded.snapshot?.opCount).toBe(1);
  });

  it("ignores a snapshot of a different log of the same length (undo, then a new op)", async () => {
    await preview([red, red], 2);
    await saveOps({ id: "drache", labelsKey: key, ops: [red, blue], updatedAt: 1 });
    expect((await loadPage(page)).snapshot).toBeNull();
  });

  it("turns ops made on other labels into the start image and starts a new log", async () => {
    await saveOps({ id: "drache", labelsKey: "drache:old-art:v1:s1.5", ops: [red], updatedAt: 1 });
    await preview([red], 1);
    // The old labels are gone, so the last preview becomes the base.
    const loaded = await loadPage(page);
    expect(loaded.ops).toEqual([]);
    expect(new Uint8Array(loaded.base?.png ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1]));
    expect((await loadOps("drache"))?.labelsKey).toBe(key);
    expect(await loadPreview("drache")).toBeUndefined();
  });
});
