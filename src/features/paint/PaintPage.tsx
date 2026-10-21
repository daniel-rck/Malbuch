import { useEffect, useReducer, useState } from "react";
import { PagePicker } from "./components/PagePicker.tsx";
import { Paper } from "./components/Paper.tsx";
import { useThumbUrls } from "./components/thumbs.ts";
import { TopBar } from "./components/TopBar.tsx";
import { Tray } from "./components/Tray.tsx";
import { loadSettings, saveSettings } from "./db.ts";
import type { Session } from "./session.ts";
import { initialState, PaintContext, paintReducer } from "./state.ts";

/** The whole app: top bar, paper, tray — and the picture book on top when open. */
export function PaintPage() {
  const [state, dispatch] = useReducer(paintReducer, undefined, initialState);
  const [restored, setRestored] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const thumbs = useThumbUrls();

  // Settings: restore once, then save after each change (spec §5.5).
  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((settings) => {
      if (cancelled) return;
      if (settings) dispatch({ type: "restore", ...settings });
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

  // Ctrl/Cmd+Z for the grown-ups with a keyboard — not behind the picture book.
  useEffect(() => {
    if (state.pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        session?.canvas.undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [session, state.pickerOpen]);

  // Android Back (and its edge swipe) closes the picture book instead of
  // leaving the app: the open book is a history entry of its own.
  useEffect(() => {
    if (!state.pickerOpen) return;
    history.pushState({ ...(history.state as object | null), malbuchBook: true }, "");
    const onPop = () => dispatch({ type: "picker", open: false });
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed some other way (X, Escape, a pick): take the entry off again.
      if ((history.state as { malbuchBook?: boolean } | null)?.malbuchBook) history.back();
    };
  }, [state.pickerOpen]);

  const pickPage = (pageId: string) => {
    if (session?.canvas.isDrawing) return;
    dispatch({ type: "page", pageId });
  };

  return (
    <PaintContext value={{ state, dispatch }}>
      <div
        inert={state.pickerOpen}
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
    </PaintContext>
  );
}
