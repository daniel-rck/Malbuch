import { useEffect, useRef, useState } from "react";
import { PAGE_META } from "../../../pages/meta.ts";
import { CloseIcon, Sparkle, StickerIcon } from "../../paint/components/icons.tsx";
import { goalOf, STICKERS, type Sticker, type StickerKind } from "../engine/stickers.ts";
import { playJingle } from "../sound.ts";
import { useRewards } from "../state.ts";
import { KIND_COLOR, StickerArt } from "./StickerArt.tsx";

const KINDS: { kind: StickerKind; label: string }[] = [
  { kind: "malen", label: "Bilder" },
  { kind: "werkzeug", label: "Stifte und Farben" },
  { kind: "tage", label: "Maltage" },
  { kind: "entdecker", label: "Entdecken" },
];

/**
 * The sticker book (docs/specs/malbuch.md §3.3): fullscreen like the picture
 * book, every sticker in its place — earned ones in colour, the rest as grey
 * outlines with dots for how far along they are.
 */
export function StickerBook() {
  const { rewards, dispatchRewards } = useRewards();
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => dispatchRewards({ type: "book", open: false });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatchRewards({ type: "book", open: false });
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [dispatchRewards]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stickerheft"
      className="fixed inset-0 z-10 flex flex-col bg-sky bg-[radial-gradient(var(--color-dots)_2.5px,transparent_3px)] bg-size-[28px_28px] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between gap-3 px-3.5 pt-2.5 pb-1">
        <span className="grid size-[56px] -rotate-3 place-items-center rounded-2xl bg-sun text-tray shadow-[0_4px_0_var(--color-shade)]">
          <StickerIcon />
        </span>
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
      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          {KINDS.map(({ kind, label }) => (
            <ul
              key={kind}
              aria-label={label}
              className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3 rounded-3xl border-4 border-tray bg-paper p-3 shadow-[0_6px_0_var(--color-shade)]"
              style={{ backgroundColor: `color-mix(in srgb, ${KIND_COLOR[kind]} 18%, white)` }}
            >
              {STICKERS.filter((s) => s.kind === kind).map((s) => (
                <StickerSlot
                  key={s.id}
                  sticker={s}
                  earned={s.id in rewards.progress.earned}
                  fresh={rewards.progress.fresh.includes(s.id)}
                  count={s.count(rewards.progress, PAGE_META)}
                />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

function StickerSlot({
  sticker,
  earned,
  fresh,
  count,
}: {
  sticker: Sticker;
  earned: boolean;
  fresh: boolean;
  count: number;
}) {
  const [wiggle, setWiggle] = useState(0);
  const goal = goalOf(sticker, PAGE_META);
  const done = Math.min(count, goal);
  return (
    <li className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={earned ? sticker.label : `${sticker.label} – noch nicht geschafft`}
        onClick={() => {
          if (!earned) return;
          setWiggle((n) => n + 1);
          playJingle();
        }}
        className="relative size-[84px] cursor-pointer rounded-full p-0"
      >
        <span key={wiggle} className={`block size-full ${wiggle ? "animate-wiggle" : ""}`}>
          <StickerArt id={sticker.id} kind={sticker.kind} earned={earned} />
        </span>
        {fresh && <Sparkle className="absolute -top-1 -right-1 size-7 animate-twinkle" />}
      </button>
      {!earned && goal > 1 && (
        <span aria-hidden="true" className="flex h-3 items-center gap-1">
          {goal <= 7 ? (
            Array.from({ length: goal }, (_, i) => (
              <span
                key={i}
                className={`size-2.5 rounded-full border-2 border-tray ${i < done ? "bg-tray" : "bg-paper"}`}
              />
            ))
          ) : (
            <span className="h-2.5 w-16 overflow-hidden rounded-full border-2 border-tray bg-paper">
              <span className="block h-full bg-tray" style={{ width: `${(done / goal) * 100}%` }} />
            </span>
          )}
        </span>
      )}
    </li>
  );
}
