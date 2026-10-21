import { useEffect, useRef } from "react";
import type { Session } from "../paint/session.ts";
import { saveProgress } from "./db.ts";
import { dayOf, type Progress } from "./engine/progress.ts";
import type { RewardsAction } from "./state.ts";

/**
 * Follow the open page's op log: every change is counted for stickers and
 * painting days. Opening a page counts too (its log may be older than the
 * stickers), but only fresh colour on the paper makes today a painting day.
 */
export function useTrackRewards(
  session: Session | null,
  dispatch: (action: RewardsAction) => void,
): void {
  useEffect(() => {
    if (!session) return;
    const { canvas, page, regions } = session;
    let count = canvas.ops.length;
    const report = (painted: boolean) =>
      dispatch({
        type: "ops",
        page,
        ops: canvas.ops,
        regionCount: regions.count,
        painted,
        today: dayOf(new Date()),
      });
    dispatch({ type: "seen", pageId: page.id });
    report(false);
    return canvas.subscribe(() => {
      const ops = canvas.ops;
      const last = ops.at(-1)?.t;
      const painted = ops.length > count && (last === "stroke" || last === "fill");
      count = ops.length;
      report(painted);
    });
  }, [session, dispatch]);
}

/** Store the progress shortly after each change, and at once when the app goes away. */
export function useSaveRewards(progress: Progress, ready: boolean): void {
  const latest = useRef(progress);
  const dirty = useRef(false);
  useEffect(() => {
    if (!ready || latest.current === progress) return;
    latest.current = progress;
    dirty.current = true;
    const timer = setTimeout(() => {
      dirty.current = false;
      void saveProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress, ready]);
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || !dirty.current) return;
      dirty.current = false;
      void saveProgress(latest.current);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);
}
