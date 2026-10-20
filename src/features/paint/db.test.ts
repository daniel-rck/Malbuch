import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAll, getDB } from "../../lib/db/db.ts";
import {
  loadLabels,
  loadOps,
  loadSettings,
  loadThumbs,
  pruneLabels,
  saveLabels,
  saveOps,
  savePreview,
  saveSettings,
} from "./db.ts";
import { labelRegions } from "./engine/regions.ts";
import { grid } from "./engine/test/grid.ts";

beforeEach(async () => {
  await clearAll();
});

const art = grid(["......", ".####.", ".#..#.", ".####.", "......"]);
const regions = labelRegions(art.darkness, art.width, art.height, 110);

describe("paint storage", () => {
  it("round-trips a page's ops", async () => {
    await saveOps({
      id: "drache",
      labelsKey: "k",
      ops: [{ t: "fill", color: "#E53935", region: 2 }],
      updatedAt: 1,
    });
    expect((await loadOps("drache"))?.ops).toEqual([{ t: "fill", color: "#E53935", region: 2 }]);
  });

  it("stores labels run-length coded and reads them back identical", async () => {
    await saveLabels("drache:abc:v1:s1.5", "drache", regions);
    const stored = await (await getDB()).get("labels", "drache:abc:v1:s1.5");
    expect(stored?.runs.length).toBeLessThan(regions.labels.length);
    expect(await loadLabels("drache:abc:v1:s1.5")).toEqual(regions);
  });

  it("prunes a page's labels except the ones its ops use", async () => {
    await saveLabels("drache:old:v1:s1.5", "drache", regions);
    await saveLabels("drache:new:v1:s1.5", "drache", regions);
    await saveLabels("fisch:x:v1:s1.5", "fisch", regions);
    await pruneLabels("drache", ["drache:new:v1:s1.5"]);
    expect(await (await getDB()).getAllKeys("labels")).toEqual([
      "drache:new:v1:s1.5",
      "fisch:x:v1:s1.5",
    ]);
  });

  it("lists the thumbnails by page", async () => {
    const thumb = new Uint8Array([1, 2, 3]).buffer;
    await savePreview({
      id: "fisch",
      png: new ArrayBuffer(4),
      opCount: 0,
      digest: "x",
      thumb,
      updatedAt: 1,
    });
    const thumbs = await loadThumbs();
    expect([...thumbs.keys()]).toEqual(["fisch"]);
    expect(new Uint8Array(thumbs.get("fisch") ?? new ArrayBuffer(0))).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });

  it("keeps the settings", async () => {
    await saveSettings({ tool: "fill", color: "#8E24AA", size: 16, pageId: "zug" });
    expect(await loadSettings()).toEqual({
      id: "settings",
      tool: "fill",
      color: "#8E24AA",
      size: 16,
      pageId: "zug",
    });
  });

  it("swallows a failed write (full quota) and says so in the console", async () => {
    const db = await getDB();
    vi.spyOn(db, "put").mockRejectedValue(new DOMException("full", "QuotaExceededError"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ok = await saveOps({ id: "drache", labelsKey: "k", ops: [], updatedAt: 1 });
    expect(ok).toBe(false);
    expect(warn).toHaveBeenCalledWith("Malbuch: could not save ops", expect.any(DOMException));
  });
});
