import { getDB, type OpsRecord } from "../../lib/db/db.ts";
import { PAGE_META } from "../../pages/meta.ts";
import { dayOf, emptyProgress, type Progress, record } from "./engine/progress.ts";
import { award } from "./engine/stickers.ts";

// The rewards row (spec §5.5). Like the paint feature's writes, these never
// throw: losing a sticker to a full disk must not stop the painting.

/**
 * The stored progress. On the first start with stickers there is none yet:
 * it is filled from the pictures already painted — which pages, colours and
 * tools, and the day each was last painted on. How finished a picture is
 * needs its regions, so that follows when the page is next opened.
 */
export async function loadProgress(): Promise<Progress> {
  try {
    const db = await getDB();
    const stored = await db.get("progress", "progress");
    if (stored) {
      const { id: _, ...progress } = stored;
      return { ...emptyProgress(), ...progress };
    }
    return fromOps(await db.getAll("ops"));
  } catch (error) {
    console.warn("Malbuch: could not read the progress", error);
    return emptyProgress();
  }
}

export function fromOps(logs: readonly OpsRecord[]): Progress {
  let progress = emptyProgress();
  const days = new Set<string>();
  for (const log of logs.toSorted((a, b) => a.updatedAt - b.updatedAt)) {
    const meta = PAGE_META.find((m) => m.id === log.id);
    if (!meta) continue;
    progress = record(progress, meta, log.ops, 0, false, "");
    if (log.ops.some((op) => op.t === "stroke" || op.t === "fill")) {
      days.add(dayOf(new Date(log.updatedAt)));
    }
  }
  progress = { ...progress, days: [...days].toSorted() };
  return award(progress, PAGE_META, dayOf(new Date())).progress;
}

export async function saveProgress(progress: Progress): Promise<boolean> {
  try {
    await (await getDB()).put("progress", { id: "progress", ...progress });
    return true;
  } catch (error) {
    console.warn("Malbuch: could not save the progress", error);
    return false;
  }
}
