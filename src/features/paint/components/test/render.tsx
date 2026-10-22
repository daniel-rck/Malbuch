import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { emptyProgress, type Progress } from "../../../rewards/engine/progress.ts";
import { initialRewards, RewardsContext, type RewardsAction } from "../../../rewards/state.ts";
import {
  initialState,
  PaintContext,
  type PaintAction,
  paintReducer,
  type PaintState,
} from "../../state.ts";

/**
 * Render with a PaintContext on `pageId` (with `paint` on top, e.g. seasons
 * or mixes) and a RewardsContext holding `progress`; returns both dispatch spies.
 */
export function renderWithPaint(
  ui: ReactNode,
  pageId = "drache",
  progress: Partial<Progress> = {},
  paint: Partial<PaintState> = {},
) {
  const state = { ...paintReducer(initialState(), { type: "page", pageId }), ...paint };
  const dispatch = vi.fn<(action: PaintAction) => void>();
  const rewards = { ...initialRewards(), progress: { ...emptyProgress(), ...progress } };
  const dispatchRewards = vi.fn<(action: RewardsAction) => void>();
  const result = render(
    <PaintContext value={{ state, dispatch }}>
      <RewardsContext value={{ rewards, dispatchRewards }}>{ui}</RewardsContext>
    </PaintContext>,
  );
  return { ...result, dispatch, dispatchRewards, state };
}
