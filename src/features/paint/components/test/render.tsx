import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { initialState, PaintContext, type PaintAction, paintReducer } from "../../state.ts";

/** Render with a PaintContext on `pageId`; returns the dispatch spy. */
export function renderWithPaint(ui: ReactNode, pageId = "drache") {
  const state = paintReducer(initialState(), { type: "page", pageId });
  const dispatch = vi.fn<(action: PaintAction) => void>();
  const result = render(<PaintContext value={{ state, dispatch }}>{ui}</PaintContext>);
  return { ...result, dispatch, state };
}
