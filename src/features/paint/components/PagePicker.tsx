import { useEffect, useRef, useState } from "react";
import { AGE_GROUPS, type GroupId } from "../../../pages/groups.ts";
import { pagesOf } from "../../../pages/manifest.ts";
import { groupOf, usePaint } from "../state.ts";
import { AgeIcon, CloseIcon } from "./icons.tsx";
import { PageThumb } from "./PageThumb.tsx";

/**
 * The picture book (docs/specs/malbuch.md §3): fullscreen, one tab per age
 * group, every page of the group as a big thumbnail with what's painted so far.
 */
export function PagePicker({
  thumbs,
  onPick,
}: {
  thumbs: Map<string, string>;
  onPick: (pageId: string) => void;
}) {
  const { state, dispatch } = usePaint();
  const [group, setGroup] = useState<GroupId>(() => groupOf(state.pageId));
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => dispatch({ type: "picker", open: false });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "picker", open: false });
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [dispatch]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bild wählen"
      className="fixed inset-0 z-10 flex flex-col bg-sky bg-[radial-gradient(var(--color-dots)_2.5px,transparent_3px)] bg-size-[28px_28px] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between gap-3 px-3.5 pt-2.5 pb-1">
        <div role="tablist" aria-label="Alter" className="flex gap-2.5">
          {AGE_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-label={g.label}
              aria-selected={group === g.id}
              aria-controls="seiten"
              onClick={() => setGroup(g.id)}
              className="grid size-[56px] cursor-pointer place-items-center rounded-2xl bg-tray text-on-tray shadow-[0_4px_0_var(--color-shade)] transition-transform aria-selected:-translate-y-0.5 aria-selected:-rotate-3 aria-selected:bg-sun aria-selected:text-tray"
            >
              <AgeIcon group={g.id} />
            </button>
          ))}
        </div>
        <button
          ref={closeRef}
          type="button"
          aria-label="Schließen"
          onClick={close}
          className="grid size-[52px] cursor-pointer place-items-center rounded-full bg-tray text-on-tray shadow-[0_4px_0_var(--color-shade)]"
        >
          <CloseIcon />
        </button>
      </div>
      <div
        id="seiten"
        role="tabpanel"
        aria-label={AGE_GROUPS.find((g) => g.id === group)?.label}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-3 pb-6"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {pagesOf(group).map((page, i) => (
            <button
              key={page.id}
              type="button"
              aria-label={page.name}
              aria-pressed={page.id === state.pageId}
              onClick={() => onPick(page.id)}
              className={`cursor-pointer overflow-hidden rounded-2xl border-4 border-tray bg-paper p-0 shadow-[0_6px_0_var(--color-shade)] transition-transform active:translate-y-0.5 aria-pressed:border-sun ${i % 2 ? "rotate-1" : "-rotate-1"}`}
            >
              <PageThumb page={page} thumb={thumbs.get(page.id)} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
