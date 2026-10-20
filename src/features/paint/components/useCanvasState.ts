import { useSyncExternalStore } from "react";
import type { PageCanvas } from "../render/page-canvas.ts";

const noSubscribe = () => () => {};
const noVersion = () => -1;

/** Re-render when the open page's op log changes; returns what the buttons need. */
export function useCanvasState(canvas: PageCanvas | null): { canUndo: boolean; canClear: boolean } {
  useSyncExternalStore(canvas?.subscribe ?? noSubscribe, canvas?.version ?? noVersion);
  return { canUndo: canvas?.canUndo ?? false, canClear: canvas?.canClear ?? false };
}
