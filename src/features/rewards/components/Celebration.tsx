import { type CSSProperties, useEffect, useEffectEvent, useRef, useState } from "react";
import { pageById } from "../../../pages/manifest.ts";
import { GiftIcon } from "../../paint/components/icons.tsx";
import { PageThumb } from "../../paint/components/PageThumb.tsx";
import { STICKERS } from "../engine/stickers.ts";
import { playJingle } from "../sound.ts";
import { type Celebration as Item, useRewards } from "../state.ts";
import { StickerArt } from "./StickerArt.tsx";

/** How long a celebration stays in the middle, then how long it flies to its button. */
export const SHOW_MS = 1700;
export const FLY_MS = 550;

/** The buttons a won sticker and opened surprise pages fly to. */
export const STICKER_BUTTON_ID = "stickerheft-knopf";
export const BOOK_BUTTON_ID = "bilderbuch-knopf";

const CONFETTI = [
  "#E53935",
  "#FB8C00",
  "#FDD835",
  "#8BC34A",
  "#26C6DA",
  "#1E88E5",
  "#8E24AA",
  "#F06292",
];

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Plays the queued celebrations one after another (spec §3.3): a jingle, the
 * sticker (or the opened surprise pages) popping up among confetti, then
 * flying into its button. It takes no pointer events — painting carries on.
 */
export function Celebration() {
  const { rewards, dispatchRewards } = useRewards();
  const item = rewards.queue[0];
  if (!item) return null;
  return <Show key={item.n} item={item} onDone={() => dispatchRewards({ type: "celebrated" })} />;
}

function Show({ item, onDone }: { item: Item; onDone: () => void }) {
  const [flying, setFlying] = useState<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [calm] = useState(reducedMotion);

  const start = useEffectEvent(() => {
    playJingle(item.kind);
    const fly = setTimeout(() => {
      const target = document.getElementById(
        item.kind === "sticker" ? STICKER_BUTTON_ID : BOOK_BUTTON_ID,
      );
      const box = boxRef.current?.getBoundingClientRect();
      const to = target?.getBoundingClientRect();
      if (calm || !box || !to || box.width === 0) return;
      setFlying({
        x: to.left + to.width / 2 - (box.left + box.width / 2),
        y: to.top + to.height / 2 - (box.top + box.height / 2),
      });
    }, SHOW_MS);
    const done = setTimeout(onDone, SHOW_MS + FLY_MS);
    return () => {
      clearTimeout(fly);
      clearTimeout(done);
    };
  });
  // Once per celebration: the parent keys this component by its item.
  useEffect(() => start(), []);

  const sticker = item.kind === "sticker" ? STICKERS.find((s) => s.id === item.id) : undefined;
  const label = sticker
    ? `Neuer Sticker: ${sticker.label}`
    : `Neue Bilder: ${item.kind === "unlock" ? item.pages.map((id) => pageById(id)?.name).join(", ") : ""}`;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-20 grid place-items-center overflow-hidden"
    >
      {!calm && !flying && <Confetti />}
      <div
        ref={boxRef}
        role="img"
        aria-label={label}
        className="transition-[translate,scale,opacity] ease-in"
        style={{
          transitionDuration: `${FLY_MS}ms`,
          ...(flying && { translate: `${flying.x}px ${flying.y}px`, scale: "0.15", opacity: 0.6 }),
        }}
      >
        {sticker ? (
          <div className="size-[min(60vw,50vh,280px)] animate-pop">
            <StickerArt id={sticker.id} kind={sticker.kind} />
          </div>
        ) : item.kind === "unlock" ? (
          <Unlock pages={item.pages} />
        ) : null}
      </div>
    </div>
  );
}

function Unlock({ pages }: { pages: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid size-[min(34vw,26vh,150px)] animate-pop place-items-center rounded-3xl bg-sun text-tray shadow-[0_6px_0_var(--color-shade)] [&_svg]:size-3/5">
        <GiftIcon />
      </div>
      <div className="flex gap-3">
        {pages.map((id, i) => {
          const page = pageById(id);
          return (
            page && (
              <div
                key={id}
                className="w-[min(24vw,18vh,120px)] animate-pop overflow-hidden rounded-xl border-4 border-sun bg-paper shadow-[0_5px_0_var(--color-shade)]"
                style={{ animationDelay: `${250 + i * 150}ms` }}
              >
                <PageThumb page={page} thumb={undefined} />
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => {
      const angle = (i / 36) * 2 * Math.PI + Math.random() * 0.4;
      const dist = 140 + Math.random() * 260;
      return {
        color: CONFETTI[i % CONFETTI.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist + 120,
        rot: (Math.random() - 0.5) * 900,
        delay: Math.random() * 150,
        round: i % 3 === 0,
      };
    }),
  );
  return (
    <div aria-hidden="true" data-confetti className="absolute top-1/2 left-1/2">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute block animate-confetti ${p.round ? "size-3 rounded-full" : "h-4 w-2.5 rounded-sm"}`}
          style={
            {
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
