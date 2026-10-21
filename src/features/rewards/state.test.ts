import { describe, expect, it } from "vitest";
import type { Op } from "../paint/engine/ops.ts";
import { initialRewards, type RewardsState, rewardsReducer } from "./state.ts";

const fill = (region: number): Op => ({ t: "fill", color: "#E53935", region });
const page = { id: "fisch", group: "klein" as const };
const ops = (state: RewardsState, list: Op[], painted: boolean, today = "2026-10-21") =>
  rewardsReducer(state, { type: "ops", page, ops: list, regionCount: 4, painted, today });

describe("rewardsReducer", () => {
  it("opens the first surprises with the first paint, and queues the celebrations", () => {
    const opened = ops(initialRewards(), [], false);
    expect(opened.queue).toEqual([]);
    const s = ops(opened, [fill(1)], true);
    expect(s.progress.days).toEqual(["2026-10-21"]);
    expect(s.queue[0]).toMatchObject({ kind: "unlock", pages: ["katze", "igel", "zoo"] });
  });

  it("queues a sticker once it is won, and plays one celebration after another", () => {
    let s = ops(initialRewards(), [fill(1)], true);
    s = ops(s, [fill(1), fill(2), fill(3)], true);
    expect(s.queue.map((c) => (c.kind === "sticker" ? c.id : c.kind))).toEqual([
      "unlock",
      "bild-1",
    ]);
    expect(new Set(s.queue.map((c) => c.n)).size).toBe(2);
    s = rewardsReducer(s, { type: "celebrated" });
    expect(s.queue.map((c) => c.kind)).toEqual(["sticker"]);
  });

  it("leaves the state alone when a change counts for nothing", () => {
    const s = ops(initialRewards(), [fill(1)], true);
    expect(ops(s, [fill(1), fill(1)], true)).toBe(s);
  });

  it("clears the fresh stickers when the sticker book closes", () => {
    let s = ops(initialRewards(), [fill(1), fill(2), fill(3)], true);
    expect(s.progress.fresh).toContain("bild-1");
    s = rewardsReducer(s, { type: "book", open: true });
    expect(s.progress.fresh).toContain("bild-1");
    s = rewardsReducer(s, { type: "book", open: false });
    expect(s.progress.fresh).toEqual([]);
    expect(s.progress.earned).toHaveProperty("bild-1");
  });

  it("remembers opened surprise pages", () => {
    const s = rewardsReducer(initialRewards(), { type: "seen", pageId: "katze" });
    expect(s.progress.seen).toEqual(["katze"]);
  });
});
