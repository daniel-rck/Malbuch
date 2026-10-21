import { deleteDB, openDB } from "idb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type AppSchema, clearAll, getDB, upgrade } from "../../lib/db/db.ts";
import {
  deletePreview,
  loadLabels,
  loadOps,
  loadPreview,
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

  it("writes a preview and its thumbnail together, and deletes both", async () => {
    const thumb = new Uint8Array([1, 2, 3]).buffer;
    const record = { id: "fisch", png: new ArrayBuffer(4), opCount: 0, digest: "x", updatedAt: 1 };
    await savePreview(record, thumb);
    const thumbs = await loadThumbs();
    expect(thumbs.map((t) => [t.id, t.digest])).toEqual([["fisch", "x"]]);
    expect(new Uint8Array(thumbs[0]?.thumb ?? new ArrayBuffer(0))).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect((await loadPreview("fisch"))?.opCount).toBe(0);
    await deletePreview("fisch");
    expect(await loadThumbs()).toEqual([]);
    expect(await loadPreview("fisch")).toBeUndefined();
  });

  it("moves v1 thumbnails into their own store on the upgrade to v2", async () => {
    const name = "malbuch-upgrade-test";
    const v1 = await openDB(name, 1, {
      upgrade: (db) => db.createObjectStore("previews", { keyPath: "id" }),
    });
    const thumb = new Uint8Array([7]).buffer;
    await v1.put("previews", {
      id: "zug",
      png: new ArrayBuffer(2),
      opCount: 3,
      digest: "d",
      thumb,
      updatedAt: 5,
    });
    v1.close();
    const v2 = await openDB<AppSchema>(name, 2, { upgrade });
    const moved = await v2.get("thumbs", "zug");
    v2.close();
    await deleteDB(name);
    expect(moved && { ...moved, thumb: [...new Uint8Array(moved.thumb)] }).toEqual({
      id: "zug",
      thumb: [7],
      digest: "d",
      updatedAt: 5,
    });
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
