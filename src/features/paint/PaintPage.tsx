import { useCallback, useEffect, useReducer, useState } from "react";
import { loadSeasons, type Page, pageById } from "../../pages/manifest.ts";
import { Celebration } from "../rewards/components/Celebration.tsx";
import { StickerBook } from "../rewards/components/StickerBook.tsx";
import { loadProgress } from "../rewards/db.ts";
import { dayOf } from "../rewards/engine/progress.ts";
import { activeSeasons, type SeasonId, seasonKey } from "../rewards/engine/seasons.ts";
import { isAvailable, unlockLevel } from "../rewards/engine/unlock.ts";
import { primeSound } from "../rewards/sound.ts";
import {
  initialRewards,
  RewardsContext,
  type RewardsAction,
  rewardsReducer,
} from "../rewards/state.ts";
import { useSaveRewards, useTrackRewards } from "../rewards/tracking.ts";
import { PagePicker } from "./components/PagePicker.tsx";
import { Paper } from "./components/Paper.tsx";
import { useThumbUrls } from "./components/thumbs.ts";
import { TopBar } from "./components/TopBar.tsx";
import { Tray } from "./components/Tray.tsx";
import { loadSettings, saveSettings } from "./db.ts";
import type { Session } from "./session.ts";
import { initialState, PaintContext, type PaintAction, paintReducer } from "./state.ts";

type Seasons = { today: string; seasons: SeasonId[]; pages: Page[] };

/** The seasons on today, their pages loaded (spec §3.4). A failed load shows none. */
async function seasonsToday(): Promise<Seasons> {
  const today = dayOf(new Date());
  const seasons = activeSeasons(today);
  try {
    return { today, seasons, pages: await loadSeasons(seasons) };
  } catch (error) {
    console.warn("Malbuch: could not load the season pages", error);
    return { today, seasons: [], pages: [] };
  }
}

/** Put the seasons in the picture book, and announce each once per season and year. */
function applySeasons(
  { today, seasons, pages }: Seasons,
  dispatch: (action: PaintAction) => void,
  dispatchRewards: (action: RewardsAction) => void,
): void {
  dispatch({ type: "seasons", seasons });
  for (const season of seasons) {
    const ids = pages.filter((p) => p.season === season).map((p) => p.id);
    dispatchRewards({ type: "season", key: seasonKey(today, season), pages: ids });
  }
}

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
    void Promise.all([loadSettings(), loadProgress(), seasonsToday()]).then(
      ([settings, progress, seasons]) => {
        if (cancelled) return;
        dispatchRewards({ type: "loaded", progress });
        applySeasons(seasons, dispatch, dispatchRewards);
        if (settings) {
          // A surprise page only reopens while it is open (it always is, unless
          // the progress was lost), a season page only in its season: else the
          // first page it is.
          const page = pageById(settings.pageId);
          const open = page && isAvailable(page, unlockLevel(progress.days), seasons.seasons);
          dispatch({ type: "restore", ...settings, pageId: open ? settings.pageId : "" });
        }
        setRestored(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  // A season may begin or end while the app sleeps in the background.
  useEffect(() => {
    if (!restored) return;
    const onShow = () => {
      if (document.visibilityState !== "visible") return;
      void seasonsToday().then((seasons) => applySeasons(seasons, dispatch, dispatchRewards));
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [restored]);
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      void saveSettings({
        tool: state.tool,
        color: state.color,
        size: state.size,
        pageId: state.pageId,
        mixes: [...state.mixes],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [restored, state.tool, state.color, state.size, state.pageId, state.mixes]);

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
    if (session?.canvas.isDrawing || !page || !isAvailable(page, level, state.seasons)) return;
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
