import type { DBSchema } from "idb";
import type { Tool } from "../../features/paint/config.ts";
import type { Op } from "../../features/paint/engine/ops.ts";
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

/** A page's rendering (spec key `page:<id>:preview`): fast start and picture-book thumbnail. */
export type PreviewRecord = {
  id: string;
  /** Full-resolution paint layer after the first `opCount` ops. */
  png: ArrayBuffer;
  opCount: number;
  /** opsDigest of those ops: a snapshot is only used while it matches the log. */
  digest: string;
  /** Small paint layer for the picture book. */
  thumb: ArrayBuffer;
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

export type Settings = { id: "settings"; tool: Tool; color: string; size: number; pageId: string };

export interface AppSchema extends DBSchema {
  ops: { key: string; value: OpsRecord };
  previews: { key: string; value: PreviewRecord };
  labels: { key: string; value: LabelsRecord; indexes: { byPage: string } };
  settings: { key: string; value: Settings };
}

export const getDB = createDBOpener<AppSchema>({
  // Unique per app: in local dev every app shares the localhost origin, so two
  // apps with the same name would share (and upgrade) one database.
  name: "malbuch",
  version: 1,
  upgrade(db, oldVersion) {
    // The migration ladder. Never edit a step that has shipped: bump
    // `version` and add a new `if (oldVersion < N)` below the last one.
    if (oldVersion < 1) {
      db.createObjectStore("ops", { keyPath: "id" });
      db.createObjectStore("previews", { keyPath: "id" });
      db.createObjectStore("labels", { keyPath: "key" }).createIndex("byPage", "pageId");
      db.createObjectStore("settings", { keyPath: "id" });
    }
  },
});

/** Wipe every store (tests' `beforeEach`, a "delete all data" action). */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}

export { notifyMutation } from "./mutations.ts";
