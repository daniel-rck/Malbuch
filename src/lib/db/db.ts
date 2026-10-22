import type { DBSchema, OpenDBCallbacks } from "idb";
import type { Tool } from "../../features/paint/config.ts";
import type { Op } from "../../features/paint/engine/ops.ts";
import type { Progress } from "../../features/rewards/engine/progress.ts";
import { clearStores } from "./mutations.ts";
import { createDBOpener } from "./open.ts";

// Malbuch's stores (docs/specs/malbuch.md §5.5). Images are PNG bytes as
// ArrayBuffer: structured-clone-safe everywhere, unlike Blobs in older Safari.

/** A page's op log (spec key `page:<id>:ops`). */
export type OpsRecord = {
  id: string;
  /** The labels the ops' region ids refer to (see LabelsRecord.key). */
  labelsKey: string;
  ops: Op[];
  /** Start image when the art changed after painting began; ops apply on top. */
  base?: ArrayBuffer;
  updatedAt: number;
};

/** A page's rendering (spec key `page:<id>:preview`): the fast start. */
export type PreviewRecord = {
  id: string;
  /**
   * The labels (and so the start image) the ops were painted on: after an art
   * change a new log can repeat an old one's ops, but not its picture.
   */
  labelsKey: string;
  /** Full-resolution paint layer after the first `opCount` ops. */
  png: ArrayBuffer;
  opCount: number;
  /** opsDigest of those ops: a snapshot is only used while it matches the log. */
  digest: string;
  updatedAt: number;
};

/**
 * A page's small paint layer for the picture book, written together with its
 * preview. A store of its own, so the book never loads the full-size PNGs.
 */
export type ThumbRecord = {
  id: string;
  thumb: ArrayBuffer;
  /** The preview's digest: a thumbnail's image URL is kept while it is unchanged. */
  digest: string;
  updatedAt: number;
};

/** A page's region labels, run-length coded (spec key `labels:<id>:v<schema>`). */
export type LabelsRecord = {
  /** `<page>:<art hash>:v<schema>:s<raster scale>` */
  key: string;
  pageId: string;
  width: number;
  height: number;
  count: number;
  runs: Int32Array;
  boxes: Int32Array;
  areas: Int32Array;
};

export type Settings = {
  id: "settings";
  tool: Tool;
  color: string;
  size: number;
  pageId: string;
  /** Mixed colours in the tray, newest first (spec §3.5); missing before mixing came. */
  mixes?: string[];
};

/** Stickers, painting days and opened surprise pages (spec §3.2–3.3), one row. */
export type ProgressRecord = Progress & { id: "progress" };

export interface AppSchema extends DBSchema {
  ops: { key: string; value: OpsRecord };
  previews: { key: string; value: PreviewRecord };
  thumbs: { key: string; value: ThumbRecord };
  labels: { key: string; value: LabelsRecord; indexes: { byPage: string } };
  settings: { key: string; value: Settings };
  progress: { key: string; value: ProgressRecord };
}

/** A v1 preview: the thumbnail still inline. */
type PreviewRecordV1 = PreviewRecord & { thumb?: ArrayBuffer };

/** The migration ladder (exported for its test). */
export const upgrade: OpenDBCallbacks<AppSchema>["upgrade"] = (db, oldVersion, _new, tx) => {
  // Never edit a step that has shipped: bump `version` below and add a new
  // `if (oldVersion < N)` after the last one.
  if (oldVersion < 1) {
    db.createObjectStore("ops", { keyPath: "id" });
    db.createObjectStore("previews", { keyPath: "id" });
    db.createObjectStore("labels", { keyPath: "key" }).createIndex("byPage", "pageId");
    db.createObjectStore("settings", { keyPath: "id" });
  }
  if (oldVersion < 2) {
    // Thumbnails get a store of their own; v1 previews carried them inline
    // (and keep that copy until they are saved again).
    const thumbs = db.createObjectStore("thumbs", { keyPath: "id" });
    void tx
      .objectStore("previews")
      .getAll()
      .then(async (previews: PreviewRecordV1[]) => {
        for (const { id, thumb, digest, updatedAt } of previews) {
          if (thumb) await thumbs.put({ id, thumb, digest, updatedAt });
        }
      });
  }
  if (oldVersion < 3) {
    // Rewards. The first start after the upgrade fills it from the op logs.
    db.createObjectStore("progress", { keyPath: "id" });
  }
};

export const getDB = createDBOpener<AppSchema>({
  // Unique per app: in local dev every app shares the localhost origin, so two
  // apps with the same name would share (and upgrade) one database.
  name: "malbuch",
  version: 3,
  upgrade,
});

/** Wipe every store (tests' `beforeEach`, a "delete all data" action). */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}

export { notifyMutation } from "./mutations.ts";
