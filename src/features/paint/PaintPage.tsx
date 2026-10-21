import { useCallback, useEffect, useReducer, useState } from "react";
import { pageById } from "../../pages/manifest.ts";
import { Celebration } from "../rewards/components/Celebration.tsx";
import { StickerBook } from "../rewards/components/StickerBook.tsx";
import { loadProgress } from "../rewards/db.ts";
import { isUnlocked, unlockLevel } from "../rewards/engine/unlock.ts";
import { primeSound } from "../rewards/sound.ts";
import { initialRewards, RewardsContext, rewardsReducer } from "../rewards/state.ts";
import { useSaveRewards, useTrackRewards } from "../rewards/tracking.ts";
import { PagePicker } from "./components/PagePicker.tsx";
import { Paper } from "./components/Paper.tsx";
import { useThumbUrls } from "./components/thumbs.ts";
import { TopBar } from "./components/TopBar.tsx";
import { Tray } from "./components/Tray.tsx";
import { loadSettings, saveSettings } from "./db.ts";
import type { Session } from "./session.ts";
import { initialState, PaintContext, paintReducer } from "./state.ts";

/**
 * Android Back (and its edge swipe) closes a fullscreen book instead of
 * leaving the app: an open book is a history entry of its own.
 */
function useBackCloses(open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    history.pushState({ ...(history.state as object | null), malbuchBook: true }, "");
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("popstate", close);
      // Closed some other way (X, Escape, a pick): take the entry off again.
      if ((history.state as { malbuchBook?: boolean } | null)?.malbuchBook) history.back();
    };
  }, [open, close]);
}

/**
 * The whole app: top bar, paper, tray — the picture book or the sticker book
 * on top when open, and the celebrations above it all.
 */
export function PaintPage() {
  const [state, dispatch] = useReducer(paintReducer, undefined, initialState);
  const [rewards, dispatchRewards] = useReducer(rewardsReducer, undefined, initialRewards);
  const [restored, setRestored] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const thumbs = useThumbUrls();
  const level = unlockLevel(rewards.progress.days);

  // Settings and progress: restore once, then save after each change (spec §5.5).
  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadSettings(), loadProgress()]).then(([settings, progress]) => {
      if (cancelled) return;
      dispatchRewards({ type: "loaded", progress });
      if (settings) {
        // A surprise page only reopens while it is open (it always is, unless
        // the progress was lost): else the first page it is.
        const page = pageById(settings.pageId);
        const open = page && isUnlocked(page, unlockLevel(progress.days));
        dispatch({ type: "restore", ...settings, pageId: open ? settings.pageId : "" });
      }
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      void saveSettings({
        tool: state.tool,
        color: state.color,
        size: state.size,
        pageId: state.pageId,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [restored, state.tool, state.color, state.size, state.pageId]);

  useSaveRewards(rewards.progress, restored);
  useTrackRewards(session, dispatchRewards);
  useEffect(primeSound, []);

  const bookOpen = state.pickerOpen || rewards.bookOpen;

  // Ctrl/Cmd+Z for the grown-ups with a keyboard — not behind a book.
  useEffect(() => {
    if (bookOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        session?.canvas.undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [session, bookOpen]);

  const closePicker = useCallback(() => dispatch({ type: "picker", open: false }), []);
  const closeStickers = useCallback(() => dispatchRewards({ type: "book", open: false }), []);
  useBackCloses(state.pickerOpen, closePicker);
  useBackCloses(rewards.bookOpen, closeStickers);

  const pickPage = (pageId: string) => {
    const page = pageById(pageId);
    if (session?.canvas.isDrawing || !page || !isUnlocked(page, level)) return;
    dispatch({ type: "page", pageId });
  };

  return (
    <PaintContext value={{ state, dispatch }}>
      <RewardsContext value={{ rewards, dispatchRewards }}>
        <div
          inert={bookOpen}
          className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] wide:grid-cols-[minmax(0,1fr)_320px] wide:grid-rows-[auto_minmax(0,1fr)] wide:compact:grid-cols-[minmax(0,1fr)_296px]"
        >
          <TopBar session={session} thumbs={thumbs} />
          {restored ? (
            <Paper onSession={setSession} />
          ) : (
            <div className="min-h-0 wide:col-start-1 wide:row-start-2 wide:compact:row-span-2 wide:compact:row-start-1" />
          )}
          <Tray />
        </div>
        {state.pickerOpen && <PagePicker thumbs={thumbs} onPick={pickPage} />}
        {rewards.bookOpen && <StickerBook />}
        <Celebration />
      </RewardsContext>
    </PaintContext>
  );
}
