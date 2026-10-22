import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";

// Mixing colours by dragging one blob onto another (spec §3.5). A finger has
// to rest on a blob for a moment before it lifts: until then a tap picks the
// colour and a swipe scrolls the phone's colour row, as before. A mouse lifts
// the blob as soon as it moves.

/** How long a finger rests on a blob before it lifts. */
export const LIFT_MS = 250;
/** Movement before the lift that means a swipe or a shaky tap, not a drag (px). */
const SLOP = 10;
/** A mouse drags as soon as it moves this far (px). */
const MOUSE_SLOP = 6;

/** The attribute that marks a blob as something to mix onto; its value is the colour. */
export const MIX_ATTR = "data-mix";

type Press = {
  pointerId: number;
  color: string;
  mouse: boolean;
  x0: number;
  y0: number;
  el: Element;
  timer: ReturnType<typeof setTimeout> | undefined;
  lifted: boolean;
};

export type Lifted = { color: string; x: number; y: number };

/** The mix colour under a point, if it is a blob that takes this one. */
function targetAt(x: number, y: number, from: string): string | null {
  const el = document.elementFromPoint?.(x, y)?.closest(`[${MIX_ATTR}]`);
  const color = el?.getAttribute(MIX_ATTR) ?? null;
  return color === from ? null : color;
}

/**
 * Drag state and handlers for the tray's blobs. `onMix` gets the dragged
 * colour and the one it was dropped on.
 */
export function useMixDrag(onMix: (from: string, onto: string) => void) {
  const press = useRef<Press | null>(null);
  const dropped = useRef(false);
  const [lifted, setLifted] = useState<Lifted | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  const reset = useCallback(() => {
    const p = press.current;
    if (p?.timer !== undefined) clearTimeout(p.timer);
    press.current = null;
    setLifted(null);
    setTarget(null);
  }, []);

  const lift = useCallback((p: Press, x: number, y: number) => {
    p.lifted = true;
    p.timer = undefined;
    // A touch is held by its blob anyway; a mouse needs the capture to be followed.
    try {
      p.el.setPointerCapture(p.pointerId);
    } catch {
      // The pointer is gone already: its up or cancel follows.
    }
    setLifted({ color: p.color, x, y });
  }, []);

  // While a blob is lifted the finger drags it, not the page or the colour row.
  const isLifted = lifted !== null;
  useEffect(() => {
    if (!isLifted) return;
    const hold = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener("touchmove", hold, { passive: false });
    return () => window.removeEventListener("touchmove", hold);
  }, [isLifted]);

  useEffect(() => reset, [reset]);

  const handlers = (color: string) => ({
    [MIX_ATTR]: color,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      // One blob at a time, the main button only.
      if (press.current || e.button !== 0) return;
      dropped.current = false;
      const p: Press = {
        pointerId: e.pointerId,
        color,
        mouse: e.pointerType === "mouse",
        x0: e.clientX,
        y0: e.clientY,
        el: e.currentTarget,
        timer: undefined,
        lifted: false,
      };
      if (!p.mouse) p.timer = setTimeout(() => lift(p, p.x0, p.y0), LIFT_MS);
      press.current = p;
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const p = press.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (!p.lifted) {
        const moved = Math.hypot(e.clientX - p.x0, e.clientY - p.y0);
        if (p.mouse && moved > MOUSE_SLOP) lift(p, e.clientX, e.clientY);
        else if (!p.mouse && moved > SLOP) reset();
        return;
      }
      setLifted({ color: p.color, x: e.clientX, y: e.clientY });
      setTarget(targetAt(e.clientX, e.clientY, p.color));
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const p = press.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (p.lifted) {
        // The click that follows the drop must not pick the dragged colour.
        dropped.current = true;
        const onto = targetAt(e.clientX, e.clientY, p.color);
        if (onto) onMix(p.color, onto);
      }
      reset();
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      if (press.current?.pointerId !== e.pointerId) return;
      if (press.current.lifted) dropped.current = true;
      reset();
    },
    // A long press would open the context menu or the iOS callout.
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  });

  /** Whether a click is the tail of a drop (and so no pick); asking clears it. */
  const swallowClick = () => {
    const was = dropped.current;
    dropped.current = false;
    return was;
  };

  return { lifted, target, handlers, swallowClick };
}
