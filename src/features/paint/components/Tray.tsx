import { type ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { ageGroup } from "../../../pages/groups.ts";
import { dayOf } from "../../rewards/engine/progress.ts";
import { playJingle } from "../../rewards/sound.ts";
import { useRewards } from "../../rewards/state.ts";
import { SIZES, type Tool } from "../config.ts";
import { MIX_SLOTS, mixColors } from "../engine/mix.ts";
import { colorsFor, groupOf, mixesFor, usePaint } from "../state.ts";
import { EraserIcon, FillIcon, PenIcon } from "./icons.tsx";
import { useMixDrag } from "./useMixDrag.ts";

const TOOLS: { tool: Tool; label: string; icon: ReactNode }[] = [
  { tool: "pen", label: "Stift", icon: <PenIcon /> },
  { tool: "fill", label: "Farbeimer", icon: <FillIcon /> },
  { tool: "eraser", label: "Radiergummi", icon: <EraserIcon /> },
];

/** Irregular blob outlines, cycled so neighbours never look alike. */
const BLOBS = [
  "rounded-[47%_53%_44%_56%/56%_42%_58%_44%]",
  "rounded-[55%_45%_52%_48%/46%_56%_44%_54%]",
  "rounded-[42%_58%_60%_40%/52%_48%_52%_48%]",
];

/** On phones the colours scroll in one row: the chosen one is kept in view. */
function keepInView(el: HTMLButtonElement | null): void {
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

/**
 * The tray: tools, pen sizes, colours. What it offers follows the age group
 * of the open page (docs/specs/malbuch.md §3): the youngest get ten colours
 * and the thick pens only, the others mix their own colours into four slots
 * by dragging one blob onto another (§3.5).
 */
export function Tray() {
  const { state, dispatch } = usePaint();
  const { dispatchRewards } = useRewards();
  const group = ageGroup(groupOf(state.pageId));
  const colors = colorsFor(state.pageId);
  const mixes = mixesFor(state);
  const sizes = SIZES.filter((s) => group.sizes.includes(s.size));
  const eraser = state.tool === "eraser";
  const mixing = group.mix !== "none";
  // The mix just made pops into its slot.
  const [popped, setPopped] = useState<string | null>(null);
  const drag = useMixDrag((from, onto) => {
    const color = mixColors(from, onto);
    dispatch({ type: "mix", from, onto });
    dispatchRewards({ type: "mixed", color, today: dayOf(new Date()) });
    setPopped(color);
    playJingle("mix");
  });
  const pick = (color: string) => {
    if (!drag.swallowClick()) dispatch({ type: "color", color });
  };
  const blobs = [
    ...colors.map(({ color, label }) => ({ color, label, mix: mixing })),
    // 5–6 mix the palette only; 7–8 mix their mixes again.
    ...mixes.map((color) => ({ color, label: "Eigene Farbe", mix: group.mix === "any" })),
  ];
  const empty = mixing ? MIX_SLOTS - mixes.length : 0;

  return (
    <section
      aria-label="Ablage"
      className="@container grid gap-3.5 rounded-t-[28px] bg-tray px-3.5 pt-3.5 pb-4 text-on-tray compact:gap-2.5 compact:rounded-t-[22px] compact:px-3 compact:pt-2.5 compact:pb-3 wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:m-4 wide:self-center wide:rounded-[28px] wide:compact:row-span-1 wide:compact:row-start-2 wide:compact:mx-2 wide:compact:mt-1 wide:compact:mb-2 wide:compact:rounded-[22px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 compact:gap-2 wide:flex-col wide:items-stretch">
        <div
          role="group"
          aria-label="Werkzeug"
          className="flex gap-2 compact:gap-1 wide:justify-between"
        >
          {TOOLS.map(({ tool, label, icon }) => (
            <button
              key={tool}
              type="button"
              aria-label={label}
              aria-pressed={state.tool === tool}
              onClick={() => dispatch({ type: "tool", tool })}
              className="grid size-[52px] cursor-pointer place-items-center rounded-2xl bg-tray-2 text-on-tray compact:size-12 aria-pressed:bg-sun aria-pressed:text-tray"
            >
              {icon}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Stiftgröße"
          className="flex gap-2 compact:gap-1 wide:justify-between"
        >
          {sizes.map(({ size, dot, label }) => (
            <button
              key={size}
              type="button"
              aria-label={label}
              aria-pressed={state.size === size}
              onClick={() => dispatch({ type: "size", size })}
              className="grid size-12 cursor-pointer place-items-center rounded-full bg-tray-2 aria-pressed:bg-sun"
            >
              <i
                className="block rounded-full"
                style={{
                  width: dot,
                  height: dot,
                  background: eraser ? "#fff" : state.color,
                  // The light ring keeps dark colours visible on the indigo tray.
                  boxShadow: eraser
                    ? "inset 0 0 0 2px #9aa3c7"
                    : "inset 0 0 0 2px rgba(0,0,0,.18), 0 0 0 2px rgba(255,255,255,.55)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label="Farbe"
        className={`${
          // 48 px at least (touch target), 72/64 px at most so the paper keeps its room.
          // Sixteen colours and four slots fill two rows of ten on a tablet.
          colors.length <= 10
            ? "grid grid-cols-[repeat(5,minmax(48px,72px))] justify-center gap-2.5 wide:gap-[5px]"
            : mixing
              ? "grid grid-cols-[repeat(4,minmax(48px,64px))] justify-center gap-2.5 @[22rem]:grid-cols-[repeat(5,minmax(48px,64px))] @[30rem]:grid-cols-[repeat(8,minmax(48px,64px))] @[36rem]:grid-cols-[repeat(10,minmax(48px,64px))] wide:gap-3.5"
              : "grid grid-cols-[repeat(4,minmax(48px,64px))] justify-center gap-2.5 @[22rem]:grid-cols-[repeat(6,minmax(48px,64px))] @[30rem]:grid-cols-[repeat(8,minmax(48px,64px))] wide:gap-3.5"
        } ${
          // Phones: one row that scrolls sideways, so the paper gets the height. The
          // padding leaves room for the chosen blob's outline, the fade hints at more.
          "compact:-mx-3 compact:flex compact:touch-pan-x compact:snap-x compact:justify-start compact:gap-2 compact:scroll-px-4 compact:overflow-x-auto compact:px-4 compact:py-2.5 compact:[mask-image:linear-gradient(90deg,transparent,#000_6px,#000_calc(100%-6px),transparent)] compact:[scrollbar-width:none] compact:wide:gap-2 compact:[&::-webkit-scrollbar]:hidden"
        }`}
      >
        {blobs.map(({ color, label, mix }, i) => {
          const selected = !eraser && state.color === color;
          const look =
            drag.lifted?.color === color
              ? "opacity-40"
              : drag.target === color
                ? "scale-125 outline-4 outline-offset-2 outline-sun"
                : selected
                  ? "scale-110 -rotate-8 outline-4 outline-offset-2 outline-sun"
                  : "";
          return (
            <button
              key={color}
              ref={selected ? keepInView : undefined}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => pick(color)}
              {...(mix ? drag.handlers(color) : {})}
              style={{ background: color }}
              className={`aspect-square min-h-12 min-w-12 cursor-pointer border-none p-0 shadow-[inset_-4px_-5px_0_rgba(0,0,0,.2),inset_3px_3px_0_rgba(255,255,255,.35),0_0_0_2px_rgba(255,255,255,.3)] transition-transform select-none [-webkit-touch-callout:none] compact:size-[52px] compact:shrink-0 compact:snap-start ${BLOBS[i % 3]} ${look} ${color === popped ? "animate-pop" : ""}`}
            />
          );
        })}
        {Array.from({ length: empty }, (_, i) => (
          // A free slot: a dashed outline where a mixed colour will land.
          <span
            key={`slot-${i}`}
            aria-hidden="true"
            className={`aspect-square min-h-12 min-w-12 border-[3px] border-dashed border-on-tray/40 compact:size-[52px] compact:shrink-0 ${BLOBS[(blobs.length + i) % 3]}`}
          />
        ))}
      </div>
      {drag.lifted &&
        // The lifted blob under the finger, on the body: the tray is a container,
        // which would hold a fixed element to itself.
        createPortal(
          <span
            aria-hidden="true"
            style={{ left: drag.lifted.x, top: drag.lifted.y, background: drag.lifted.color }}
            className={`pointer-events-none fixed z-30 size-16 -translate-x-1/2 -translate-y-1/2 shadow-[inset_-4px_-5px_0_rgba(0,0,0,.2),inset_3px_3px_0_rgba(255,255,255,.35),0_6px_14px_rgba(0,0,0,.35)] ${BLOBS[0]}`}
          />,
          document.body,
        )}
    </section>
  );
}
