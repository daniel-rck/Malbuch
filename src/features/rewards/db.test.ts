import { deleteDB, openDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { type AppSchema, clearAll, upgrade } from "../../lib/db/db.ts";
import { saveOps } from "../paint/db.ts";
import { fromOps, loadProgress, saveProgress } from "./db.ts";
import { emptyProgress } from "./engine/progress.ts";

beforeEach(async () => {
  await clearAll();
});

describe("rewards storage", () => {
  it("starts empty and round-trips the progress", async () => {
    expect(await loadProgress()).toEqual(emptyProgress());
    const progress = { ...emptyProgress(), days: ["2026-10-21"], seen: ["katze"] };
    await saveProgress(progress);
    expect(await loadProgress()).toEqual(progress);
  });

  it("fills a first progress from the pictures painted before stickers", async () => {
    const day = new Date(2026, 9, 20, 15).getTime();
    await saveOps({
      id: "fisch",
      labelsKey: "k",
      ops: [
        { t: "fill", color: "#E53935", region: 1 },
        { t: "erase", size: 8, pts: [1, 1] },
      ],
      updatedAt: day,
    });
    await saveOps({ id: "zug", labelsKey: "k", ops: [], updatedAt: day + 86_400_000 });
    const p = await loadProgress();
    expect(p.days).toEqual(["2026-10-20"]);
    expect(p.pages.fisch).toMatchObject({ group: "klein", fill: true, erase: true, best: 0 });
    // An empty log is no painting day.
    expect(p.pages.zug).toMatchObject({ pen: false, fill: false });
  });

  it("ignores logs of pages that no longer exist", () => {
    const p = fromOps([
      {
        id: "weg",
        labelsKey: "k",
        ops: [{ t: "fill", color: "#E53935", region: 1 }],
        updatedAt: 1,
      },
    ]);
    expect(p).toEqual(emptyProgress());
  });

  it("adds the progress store on the upgrade to v3", async () => {
    const name = "malbuch-upgrade-v3-test";
    const v2 = await openDB(name, 2, {
      upgrade: (db) => {
        for (const store of ["ops", "previews", "thumbs", "settings"]) {
          db.createObjectStore(store, { keyPath: "id" });
        }
        db.createObjectStore("labels", { keyPath: "key" }).createIndex("byPage", "pageId");
      },
    });
    await v2.put("ops", { id: "fisch", labelsKey: "k", ops: [], updatedAt: 1 });
    v2.close();
    const v3 = await openDB<AppSchema>(name, 3, { upgrade });
    expect(v3.objectStoreNames.contains("progress")).toBe(true);
    expect(await v3.get("ops", "fisch")).toMatchObject({ id: "fisch" });
    v3.close();
    await deleteDB(name);
  });
});
