import { createContext, useContext } from "react";
import { ageGroup, type GroupId } from "../../pages/groups.ts";
import { pageById, PAGES } from "../../pages/manifest.ts";
import { FIRST_PAGE } from "../../pages/meta.ts";
import type { SeasonId } from "../rewards/engine/seasons.ts";
import { PALETTE, type PenSize, SIZES, type Tool } from "./config.ts";
import { addMix, MIX_SLOTS, mixColors } from "./engine/mix.ts";

// The UI state (spec §4: useReducer + Context, no framework). The op log is
// not in here — it lives with the canvases in render/page-canvas.ts.

export type PaintState = {
  tool: Tool;
  color: string;
  size: PenSize;
  pageId: string;
  pickerOpen: boolean;
  /** Seasons on today, their pages loaded (spec §3.4). */
  seasons: readonly SeasonId[];
  /** Colours the child mixed, newest first (spec §3.5). */
  mixes: readonly string[];
};

export type PaintAction =
  | { type: "tool"; tool: Tool }
  | { type: "color"; color: string }
  /** One colour dragged onto another: their mix gets a slot and is picked. */
  | { type: "mix"; from: string; onto: string }
  | { type: "size"; size: PenSize }
  | { type: "page"; pageId: string }
  | { type: "picker"; open: boolean }
  | { type: "seasons"; seasons: readonly SeasonId[] }
  | {
      type: "restore";
      tool: Tool;
      color: string;
      size: number;
      pageId: string;
      mixes?: readonly string[];
    };

export function groupOf(pageId: string): GroupId {
  return pageById(pageId)?.group ?? "mittel";
}

/** The colours the tray offers for a page. */
export function colorsFor(pageId: string): (typeof PALETTE)[number][] {
  return ageGroup(groupOf(pageId)).colors.flatMap((i) => PALETTE[i] ?? []);
}

/** The mixed colours the tray offers for a page: none for the youngest. */
export function mixesFor(state: Pick<PaintState, "pageId" | "mixes">): readonly string[] {
  return ageGroup(groupOf(state.pageId)).mix === "none" ? [] : state.mixes;
}

/** Keep colour and size when the page's age group offers them, else take the group's defaults. */
function fitToGroup(state: PaintState): PaintState {
  const group = ageGroup(groupOf(state.pageId));
  const colors = [...colorsFor(state.pageId).map((c) => c.color as string), ...mixesFor(state)];
  return {
    ...state,
    color: colors.includes(state.color) ? state.color : (colors[0] ?? PALETTE[0].color),
    size: group.sizes.includes(state.size) ? state.size : group.defaultSize,
  };
}

export function initialState(): PaintState {
  const pageId = pageById(FIRST_PAGE) ? FIRST_PAGE : (PAGES[0]?.id ?? FIRST_PAGE);
  return fitToGroup({
    tool: "pen",
    color: PALETTE[0].color,
    size: 30,
    pageId,
    pickerOpen: false,
    seasons: [],
    mixes: [],
  });
}

export function paintReducer(state: PaintState, action: PaintAction): PaintState {
  switch (action.type) {
    case "tool":
      return { ...state, tool: action.tool };
    case "color":
      // Picking a colour means painting with it: the eraser hands back to the pen.
      return { ...state, color: action.color, tool: state.tool === "eraser" ? "pen" : state.tool };
    case "mix": {
      const color = mixColors(action.from, action.onto);
      const palette = PALETTE.map((c) => c.color as string);
      const mixes = addMix(state.mixes, color, palette);
      return { ...state, mixes, color, tool: state.tool === "eraser" ? "pen" : state.tool };
    }
    case "size":
      return { ...state, size: action.size };
    case "page":
      return fitToGroup({ ...state, pageId: action.pageId, pickerOpen: false });
    case "picker":
      return { ...state, pickerOpen: action.open };
    case "seasons":
      return action.seasons.join() === state.seasons.join()
        ? state
        : { ...state, seasons: action.seasons };
    case "restore": {
      const size = SIZES.find((s) => s.size === action.size)?.size ?? state.size;
      const pageId = pageById(action.pageId) ? action.pageId : state.pageId;
      const mixes = (action.mixes ?? [])
        .filter((c) => /^#[0-9A-F]{6}$/.test(c))
        .slice(0, MIX_SLOTS);
      return fitToGroup({ ...state, tool: action.tool, color: action.color, size, pageId, mixes });
    }
  }
}

export const PaintContext = createContext<{
  state: PaintState;
  dispatch: (action: PaintAction) => void;
} | null>(null);

export function usePaint() {
  const value = useContext(PaintContext);
  if (!value) throw new Error("usePaint needs a PaintContext provider");
  return value;
}
