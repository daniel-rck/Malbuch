import {
  getDB,
  type LabelsRecord,
  notifyMutation,
  type OpsRecord,
  type PreviewRecord,
  type Settings,
} from "../../lib/db/db.ts";
import type { Regions } from "./engine/regions.ts";
import { decodeRuns, encodeRuns } from "./engine/rle.ts";

// The paint feature's reads and writes (spec §5.5). Writes never throw: a full
// quota or a broken database is logged and the app keeps painting.

async function write(what: string, run: () => Promise<unknown>): Promise<boolean> {
  try {
    await run();
    return true;
  } catch (error) {
    console.warn(`Malbuch: could not save ${what}`, error);
    return false;
  }
}

async function read<T>(what: string, run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch (error) {
    console.warn(`Malbuch: could not read ${what}`, error);
    return undefined;
  }
}

export const loadOps = (id: string) => read("ops", async () => (await getDB()).get("ops", id));

export const saveOps = (record: OpsRecord) =>
  write("ops", async () => (await getDB()).put("ops", record));

export const loadPreview = (id: string) =>
  read("preview", async () => (await getDB()).get("previews", id));

export async function savePreview(record: PreviewRecord): Promise<boolean> {
  const ok = await write("preview", async () => (await getDB()).put("previews", record));
  if (ok) notifyMutation("previews");
  return ok;
}

export async function deletePreview(id: string): Promise<void> {
  await write("preview", async () => (await getDB()).delete("previews", id));
  notifyMutation("previews");
}

/** Every page's thumbnail, by page id — for the picture book. */
export async function loadThumbs(): Promise<Map<string, ArrayBuffer>> {
  const all = (await read("thumbnails", async () => (await getDB()).getAll("previews"))) ?? [];
  return new Map(all.map((p) => [p.id, p.thumb]));
}

export async function loadLabels(key: string): Promise<Regions | undefined> {
  const record = await read("labels", async () => (await getDB()).get("labels", key));
  if (!record) return undefined;
  try {
    return {
      width: record.width,
      height: record.height,
      count: record.count,
      labels: decodeRuns(record.runs, record.width * record.height),
      // Copies: some IndexedDB implementations hand back typed arrays of
      // another realm, which equality checks and instanceof don't match.
      boxes: Int32Array.from(record.boxes),
      areas: Int32Array.from(record.areas),
    };
  } catch (error) {
    console.warn("Malbuch: cached labels are unreadable, rebuilding", error);
    return undefined;
  }
}

export const saveLabels = (key: string, pageId: string, regions: Regions) =>
  write("labels", async () => {
    const record: LabelsRecord = {
      key,
      pageId,
      width: regions.width,
      height: regions.height,
      count: regions.count,
      runs: encodeRuns(regions.labels),
      boxes: regions.boxes,
      areas: regions.areas,
    };
    await (await getDB()).put("labels", record);
  });

/** Drop a page's cached labels except `keep` (the ones its ops refer to). */
export const pruneLabels = (pageId: string, keep: readonly string[]) =>
  write("labels", async () => {
    const db = await getDB();
    const keys = await db.getAllKeysFromIndex("labels", "byPage", pageId);
    await Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => db.delete("labels", k)));
  });

export const loadSettings = () =>
  read("settings", async () => (await getDB()).get("settings", "settings"));

export const saveSettings = (settings: Omit<Settings, "id">) =>
  write("settings", async () => (await getDB()).put("settings", { id: "settings", ...settings }));
