import {
  getDB,
  type LabelsRecord,
  notifyMutation,
  type OpsRecord,
  type PreviewRecord,
  type Settings,
  type ThumbRecord,
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

/**
 * A page's op log, or undefined when it has none yet. Unlike the other reads
 * this one throws: a log that is only out of reach must not look empty, or
 * the next stroke would overwrite it.
 */
export const loadOps = async (id: string): Promise<OpsRecord | undefined> =>
  (await getDB()).get("ops", id);

export const saveOps = (record: OpsRecord) =>
  write("ops", async () => (await getDB()).put("ops", record));

export const loadPreview = (id: string) =>
  read("preview", async () => (await getDB()).get("previews", id));

/** A page's preview and its picture-book thumbnail, in one transaction. */
export async function savePreview(record: PreviewRecord, thumb: ArrayBuffer): Promise<boolean> {
  const ok = await write("preview", async () => {
    const tx = (await getDB()).transaction(["previews", "thumbs"], "readwrite");
    const { id, digest, updatedAt } = record;
    await Promise.all([
      tx.objectStore("previews").put(record),
      tx.objectStore("thumbs").put({ id, thumb, digest, updatedAt }),
      tx.done,
    ]);
  });
  if (ok) notifyMutation("thumbs");
  return ok;
}

export async function deletePreview(id: string): Promise<void> {
  await write("preview", async () => {
    const tx = (await getDB()).transaction(["previews", "thumbs"], "readwrite");
    await Promise.all([
      tx.objectStore("previews").delete(id),
      tx.objectStore("thumbs").delete(id),
      tx.done,
    ]);
  });
  notifyMutation("thumbs");
}

/** Every page's thumbnail — for the picture book. */
export async function loadThumbs(): Promise<ThumbRecord[]> {
  return (await read("thumbnails", async () => (await getDB()).getAll("thumbs"))) ?? [];
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
