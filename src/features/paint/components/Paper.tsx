import { useEffect, useEffectEvent, useRef, useState } from "react";
import { pageById } from "../../../pages/manifest.ts";
import { Autosave } from "../autosave.ts";
import { DOC_H, DOC_W, RASTER_H, RASTER_W } from "../config.ts";
import { type ActivePointer, decidePointerDown, isActivePointer } from "../engine/input.ts";
import { loadPage } from "../load.ts";
import { MaskCache } from "../render/masks.ts";
import { PageCanvas } from "../render/page-canvas.ts";
import type { Session } from "../session.ts";
import { usePaint } from "../state.ts";
import { artUrl } from "./thumbs.ts";

/** Paper border in CSS px (inside it the canvases are exactly 4:5). */
const BORDER = 4;

/**
 * The sheet of paper: paint and live canvases under the line art (an SVG
 * overlay multiplied on top, sharp at any pixel density), fitted into the
 * stage, taking pointer input (spec §5.3).
 */
export function Paper({ onSession }: { onSession: (session: Session | null) => void }) {
  const { state } = usePaint();
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const [width, setWidth] = useState(0);
  const page = pageById(state.pageId);

  // Fit the paper into the stage, aspect ratio fixed (spec §5.1).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const cs = getComputedStyle(stage);
      const w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const inner = Math.max(120, Math.min(w - 2 * BORDER, ((h - 2 * BORDER) * DOC_W) / DOC_H));
      setWidth(Math.floor(inner));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    fit();
    return () => observer.disconnect();
  }, []);

  const publish = useEffectEvent((session: Session | null) => {
    sessionRef.current = session;
    onSession(session);
  });

  // Open the page: labels, op log, snapshot → a PageCanvas and its autosave.
  useEffect(() => {
    const paint = paintRef.current;
    const live = liveRef.current;
    if (!page || !paint || !live) return;
    let cancelled = false;
    let teardown: (() => void) | null = null;
    loadPage(page)
      .then((loaded) => {
        if (cancelled) {
          loaded.base?.image.close();
          loaded.snapshot?.image.close();
          return;
        }
        const masks = new MaskCache(loaded.regions);
        const canvas = new PageCanvas({
          paint,
          live,
          regions: loaded.regions,
          masks,
          ops: loaded.ops,
          base: loaded.base?.image ?? null,
          ...(loaded.snapshot ? { snapshot: loaded.snapshot } : {}),
        });
        loaded.snapshot?.image.close();
        canvas.warmUp();
        const previewDigest =
          loaded.snapshot?.opCount === loaded.ops.length ? loaded.snapshot.digest : null;
        const autosave = new Autosave({
          pageId: page.id,
          labelsKey: loaded.labelsKey,
          base: loaded.base?.png,
          canvas,
          paint,
          previewDigest,
        });
        // Replayed beyond the stored preview: store this state for a fast next start.
        if (!previewDigest && loaded.ops.length > 0) autosave.schedulePreview();
        const unsubscribe = canvas.subscribe(() => autosave.changed());
        teardown = () => {
          // flush() reads the paint canvas before it awaits anything, so it
          // may be cleared and the next page may paint right after.
          void autosave.flush();
          autosave.dispose();
          unsubscribe();
          canvas.dispose();
          masks.dispose();
          loaded.base?.image.close();
        };
        publish({ page, canvas, autosave, paint });
      })
      .catch((error: unknown) => console.error("Malbuch: could not open the page", error));
    return () => {
      cancelled = true;
      teardown?.();
      publish(null);
      paint.getContext("2d")?.clearRect(0, 0, RASTER_W, RASTER_H);
      live.getContext("2d")?.clearRect(0, 0, RASTER_W, RASTER_H);
    };
  }, [page]);

  // Save when the app goes to the background (tablet switched off, app switch).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void sessionRef.current?.autosave.flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  const begin = useEffectEvent((canvas: PageCanvas, x: number, y: number) => {
    canvas.begin(state.tool, state.color, state.size, x, y);
    return state.tool !== "fill";
  });

  // Pointer input: native listeners for getCoalescedEvents and passive: false.
  useEffect(() => {
    const el = paperRef.current;
    const paint = paintRef.current;
    if (!el || !paint) return;
    let active: ActivePointer | null = null;
    const toDoc = (e: { clientX: number; clientY: number }, r: DOMRect): [number, number] => [
      ((e.clientX - r.left) * DOC_W) / r.width,
      ((e.clientY - r.top) * DOC_H) / r.height,
    ];

    const down = (e: PointerEvent) => {
      const canvas = sessionRef.current?.canvas;
      if (!canvas || (e.pointerType === "mouse" && e.button !== 0)) return;
      const decision = decidePointerDown(active, e.pointerId, e.pointerType);
      if (decision === "ignore") return;
      e.preventDefault();
      if (decision === "replace") canvas.abort();
      active = null;
      // The canvases' own box: inside the paper's border, exactly 4:5.
      const [x, y] = toDoc(e, paint.getBoundingClientRect());
      if (!begin(canvas, x, y)) return;
      active = { id: e.pointerId, kind: e.pointerType };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Capture is a convenience; without it moves outside the paper stop.
      }
    };
    const move = (e: PointerEvent) => {
      const canvas = sessionRef.current?.canvas;
      if (!canvas || !isActivePointer(active, e.pointerId)) return;
      // Measured per event: a rotation or split-screen resize mid-stroke moves the paper.
      const r = paint.getBoundingClientRect();
      // iOS 18.2+ has coalesced events, without pointerId: read positions only.
      const list = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      const points: number[] = [];
      for (const ev of list.length > 0 ? list : [e]) points.push(...toDoc(ev, r));
      canvas.extend(points);
    };
    const up = (e: PointerEvent) => {
      if (!isActivePointer(active, e.pointerId)) return;
      active = null;
      sessionRef.current?.canvas.end();
    };
    const noMenu = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", down, { passive: false });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
    el.addEventListener("contextmenu", noMenu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("lostpointercapture", up);
      el.removeEventListener("contextmenu", noMenu);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="grid min-h-0 place-items-center px-3 pt-2 pb-3.5 compact:px-1.5 compact:pt-1 compact:pb-2.5 wide:col-start-1 wide:row-start-2 wide:compact:row-span-2 wide:compact:row-start-1 wide:compact:py-2"
    >
      <div
        ref={paperRef}
        role="img"
        aria-label={page ? `Ausmalbild: ${page.name}` : "Ausmalbild"}
        className="relative touch-none overflow-hidden rounded-[22px] border-4 border-tray bg-paper shadow-[0_8px_0_var(--color-shade)]"
        style={{ width: width + 2 * BORDER, height: (width * DOC_H) / DOC_W + 2 * BORDER }}
      >
        <canvas
          ref={paintRef}
          width={RASTER_W}
          height={RASTER_H}
          className="pointer-events-none absolute inset-0 size-full"
        />
        <canvas
          ref={liveRef}
          width={RASTER_W}
          height={RASTER_H}
          className="pointer-events-none absolute inset-0 size-full"
        />
        {page && (
          <img
            src={artUrl(page)}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full mix-blend-multiply"
          />
        )}
      </div>
    </div>
  );
}
