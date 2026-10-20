import type { ReactNode } from "react";
import { ageGroup } from "../../../pages/groups.ts";
import { SIZES, type Tool } from "../config.ts";
import { colorsFor, groupOf, usePaint } from "../state.ts";
import { EraserIcon, FillIcon, PenIcon } from "./icons.tsx";

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

/**
 * The tray: tools, pen sizes, colours. What it offers follows the age group
 * of the open page (docs/specs/malbuch.md §3): the youngest get ten colours
 * and the thick pens only.
 */
export function Tray() {
  const { state, dispatch } = usePaint();
  const group = ageGroup(groupOf(state.pageId));
  const colors = colorsFor(state.pageId);
  const sizes = SIZES.filter((s) => group.sizes.includes(s.size));
  const eraser = state.tool === "eraser";

  return (
    <section
      aria-label="Ablage"
      className="@container grid gap-3.5 rounded-t-[28px] bg-tray px-3.5 pt-3.5 pb-4 text-on-tray wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:m-4 wide:self-center wide:rounded-[28px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 wide:flex-col wide:items-stretch">
        <div role="group" aria-label="Werkzeug" className="flex gap-2 wide:justify-between">
          {TOOLS.map(({ tool, label, icon }) => (
            <button
              key={tool}
              type="button"
              aria-label={label}
              aria-pressed={state.tool === tool}
              onClick={() => dispatch({ type: "tool", tool })}
              className="grid size-[52px] cursor-pointer place-items-center rounded-2xl bg-tray-2 text-on-tray aria-pressed:bg-sun aria-pressed:text-tray"
            >
              {icon}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Stiftgröße" className="flex gap-2 wide:justify-between">
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
                  boxShadow: eraser ? "inset 0 0 0 2px #9aa3c7" : "inset 0 0 0 2px rgba(0,0,0,.18)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label="Farbe"
        className={
          // 48 px at least (touch target), 72/64 px at most so the paper keeps its room.
          colors.length <= 10
            ? "grid grid-cols-[repeat(5,minmax(48px,72px))] justify-center gap-2.5"
            : "grid grid-cols-[repeat(4,minmax(48px,64px))] justify-center gap-2.5 @[22rem]:grid-cols-[repeat(6,minmax(48px,64px))] @[30rem]:grid-cols-[repeat(8,minmax(48px,64px))] wide:gap-3.5"
        }
      >
        {colors.map(({ color, label }, i) => {
          const selected = !eraser && state.color === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => dispatch({ type: "color", color })}
              style={{ background: color }}
              className={`aspect-square min-h-12 min-w-12 cursor-pointer border-none p-0 shadow-[inset_-4px_-5px_0_rgba(0,0,0,.2),inset_3px_3px_0_rgba(255,255,255,.35)] transition-transform ${BLOBS[i % 3]} ${selected ? "scale-110 -rotate-8 outline-4 outline-offset-2 outline-sun" : ""}`}
            />
          );
        })}
      </div>
    </section>
  );
}
