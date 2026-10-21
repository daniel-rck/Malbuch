import { createContext, useContext } from "react";
import type { GroupId } from "../../pages/groups.ts";
import { PAGE_META } from "../../pages/meta.ts";
import type { Op } from "../paint/engine/ops.ts";
import { emptyProgress, markSeen, type Progress, record } from "./engine/progress.ts";
import { award } from "./engine/stickers.ts";
import { newlyUnlocked, unlockLevel } from "./engine/unlock.ts";

// Stickers and surprise pages as UI state (spec §3.2–3.3): the progress, the
// celebrations waiting to play, and whether the sticker book is open.

/** Something to celebrate; `n` tells two equal ones apart. */
export type Celebration =
  | { n: number; kind: "sticker"; id: string }
  | { n: number; kind: "unlock"; pages: string[] };

export type RewardsState = {
  progress: Progress;
  queue: Celebration[];
  /** The next celebration's `n`. */
  next: number;
  bookOpen: boolean;
};

export type RewardsAction =
  | { type: "loaded"; progress: Progress }
  | {
      type: "ops";
      page: { id: string; group: GroupId };
      ops: readonly Op[];
      regionCount: number;
      painted: boolean;
      today: string;
    }
  | { type: "seen"; pageId: string }
  | { type: "book"; open: boolean }
  | { type: "celebrated" };

export function initialRewards(): RewardsState {
  return { progress: emptyProgress(), queue: [], next: 1, bookOpen: false };
}

export function rewardsReducer(state: RewardsState, action: RewardsAction): RewardsState {
  switch (action.type) {
    case "loaded":
      return { ...state, progress: action.progress };
    case "ops": {
      const { page, ops, regionCount, painted, today } = action;
      const before = state.progress;
      const after = record(before, page, ops, regionCount, painted, today);
      if (after === before) return state;
      const opened = newlyUnlocked(PAGE_META, unlockLevel(before.days), unlockLevel(after.days));
      const { progress, won } = award(after, PAGE_META, today);
      const queue: Celebration[] = [...state.queue];
      let n = state.next;
      if (opened.length > 0) queue.push({ n: n++, kind: "unlock", pages: opened.map((p) => p.id) });
      for (const s of won) queue.push({ n: n++, kind: "sticker", id: s.id });
      return { ...state, progress, queue, next: n };
    }
    case "seen": {
      const progress = markSeen(state.progress, action.pageId);
      return progress === state.progress ? state : { ...state, progress };
    }
    case "book":
      // Closing the book means the new stickers have been looked at.
      return action.open
        ? { ...state, bookOpen: true }
        : { ...state, bookOpen: false, progress: { ...state.progress, fresh: [] } };
    case "celebrated":
      return { ...state, queue: state.queue.slice(1) };
  }
}

export const RewardsContext = createContext<{
  rewards: RewardsState;
  dispatchRewards: (action: RewardsAction) => void;
} | null>(null);

export function useRewards() {
  const value = useContext(RewardsContext);
  if (!value) throw new Error("useRewards needs a RewardsContext provider");
  return value;
}
