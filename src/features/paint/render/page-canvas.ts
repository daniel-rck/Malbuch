import {
  ERASER_FACTOR,
  RASTER_H,
  RASTER_SCALE,
  RASTER_W,
  SEARCH_RADIUS,
  type Tool,
} from "../config.ts";
import { addPoint, isBlank, type Op } from "../engine/ops.ts";
import { regionAt, type Regions } from "../engine/regions.ts";
import { planReplay, type ReplayStart } from "../engine/replay-plan.ts";
import { context2d, createCanvas, releaseCanvas } from "./canvas.ts";
import {
  type Box,
  commitBox,
  composeMasked,
  copyCanvas,
  drawSegments,
  fillBox,
  intersect,
  maskBox,
  strokeRasterBox,
  union,
} from "./draw.ts";
import type { MaskCache, MaskCanvas } from "./masks.ts";

/** Checkpoints kept in memory (spec §5.4), and how often one is taken. */
const MAX_CHECKPOINTS = 4;
const CHECKPOINT_EVERY = 25;

type StrokeOp = Extract<Op, { t: "stroke" }>;
type EraseOp = Extract<Op, { t: "erase" }>;

type Active =
  | { kind: "pen"; op: StrokeOp; mask: MaskCanvas | null; drawn: number; dirty: Box | null }
  | { kind: "eraser"; op: EraseOp; drawn: number };

/** A paint state held in memory: the state after the first `at` ops. */
type Held = { at: number; key: string; canvas: HTMLCanvasElement };

export type PageCanvasOptions = {
  paint: HTMLCanvasElement;
  live: HTMLCanvasElement;
  regions: Regions;
  masks: MaskCache;
  ops: Op[];
  /** The page's start image (art changed since the ops were made), or null. */
  base: CanvasImageSource | null;
  /** A stored rendering of the first `opCount` ops, already verified by digest. */
  snapshot?: { image: CanvasImageSource; opCount: number };
};

/**
 * One open page: its op log and the canvases it paints. Live input and
 * replay go through the same primitives (draw.ts), so undo reproduces the
 * picture exactly. React only reads `ops`, `canUndo` and `canClear`.
 */
export class PageCanvas {
  readonly #paint: CanvasRenderingContext2D;
  readonly #live: CanvasRenderingContext2D;
  readonly #stroke: CanvasRenderingContext2D;
  readonly #regions: Regions;
  readonly #masks: MaskCache;
  readonly #base: CanvasImageSource | null;
  readonly #ops: Op[];
  #checkpoints: Held[] = [];
  #spare: HTMLCanvasElement[] = [];
  /** The paint before the last clear, so undoing it is exact by construction. */
  #pinned: Held | null = null;
  #active: Active | null = null;
  #frame = 0;
  #version = 0;
  readonly #listeners = new Set<() => void>();

  constructor(options: PageCanvasOptions) {
    this.#paint = context2d(options.paint);
    this.#live = context2d(options.live);
    this.#stroke = context2d(createCanvas(RASTER_W, RASTER_H));
    this.#regions = options.regions;
    this.#masks = options.masks;
    this.#base = options.base;
    this.#ops = options.ops;
    this.#live.clearRect(0, 0, RASTER_W, RASTER_H);
    if (options.snapshot && options.snapshot.opCount <= this.#ops.length) {
      this.#hold(options.snapshot.opCount, options.snapshot.image);
    }
    this.#replayTo(this.#ops.length);
  }

  get ops(): readonly Op[] {
    return this.#ops;
  }

  get hasBase(): boolean {
    return this.#base !== null;
  }

  get isDrawing(): boolean {
    return this.#active !== null;
  }

  get canUndo(): boolean {
    return !this.#active && this.#ops.length > 0;
  }

  get canClear(): boolean {
    return !this.#active && !isBlank(this.#ops, this.#base !== null);
  }

  /** For useSyncExternalStore: bumps after every change to the log. */
  readonly version = (): number => this.#version;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** Pointer down at (x, y) doc px. Tool, colour and size hold for the whole stroke. */
  begin(tool: Tool, color: string, size: number, x: number, y: number): void {
    if (this.#active) return;
    if (tool === "fill") {
      const region = regionAt(this.#regions, x * RASTER_SCALE, y * RASTER_SCALE, SEARCH_RADIUS);
      if (region === null) return;
      this.#commit({ t: "fill", color, region });
      return;
    }
    if (tool === "eraser") {
      const op: EraseOp = { t: "erase", size, pts: [] };
      addPoint(op.pts, x, y);
      this.#active = { kind: "eraser", op, drawn: 0 };
    } else {
      const region = regionAt(this.#regions, x * RASTER_SCALE, y * RASTER_SCALE, SEARCH_RADIUS);
      const op: StrokeOp = { t: "stroke", color, size, region, pts: [] };
      addPoint(op.pts, x, y);
      const mask = region === null ? null : this.#masks.get(region);
      this.#active = { kind: "pen", op, mask, drawn: 0, dirty: null };
    }
    this.#drawNew();
  }

  /** More points of the active stroke, flat `[x0, y0, x1, y1, …]` in doc px. */
  extend(points: readonly number[]): void {
    const active = this.#active;
    if (!active) return;
    for (let i = 0; i + 1 < points.length; i += 2) {
      addPoint(active.op.pts, points[i] ?? 0, points[i + 1] ?? 0);
    }
    this.#drawNew();
  }

  /** Pointer up (or cancelled by the browser): the stroke becomes an op. */
  end(): void {
    const active = this.#active;
    if (!active) return;
    this.#active = null;
    cancelAnimationFrame(this.#frame);
    if (active.kind === "eraser") {
      // Already on the paint canvas, segment by segment.
      this.#push(active.op);
      return;
    }
    this.#finishPen(active.op, active.mask);
    this.#push(active.op);
  }

  /**
   * Drop the active stroke (a pen took over from the palm). An eraser stroke
   * has already changed the paint, so it is kept as an op — still undoable.
   */
  abort(): void {
    const active = this.#active;
    if (!active) return;
    if (active.kind === "eraser") {
      this.end();
      return;
    }
    this.#active = null;
    cancelAnimationFrame(this.#frame);
    const box = strokeRasterBox(active.op.pts, active.op.size);
    if (box) {
      this.#live.clearRect(box.x, box.y, box.w, box.h);
      this.#stroke.clearRect(box.x, box.y, box.w, box.h);
    }
  }

  undo(): boolean {
    if (!this.canUndo) return false;
    this.#ops.pop();
    const target = this.#ops.length;
    this.#checkpoints = this.#checkpoints.filter((c) => {
      if (c.at <= target) return true;
      this.#spare.push(c.canvas);
      return false;
    });
    if (this.#pinned && this.#pinned.at > target) {
      this.#spare.push(this.#pinned.canvas);
      this.#pinned = null;
    }
    this.#replayTo(target);
    this.#changed();
    return true;
  }

  /** "Alles löschen": one op, so undo brings the picture back. */
  clear(): boolean {
    if (!this.canClear) return false;
    const canvas = this.#pinned?.canvas ?? this.#spare.pop() ?? createCanvas(RASTER_W, RASTER_H);
    copyCanvas(context2d(canvas), this.#paint.canvas);
    this.#pinned = { at: this.#ops.length, key: "pinned", canvas };
    this.#commit({ t: "clear" });
    return true;
  }

  dispose(): void {
    cancelAnimationFrame(this.#frame);
    this.#listeners.clear();
    releaseCanvas(this.#stroke.canvas);
    for (const c of [...this.#checkpoints.map((h) => h.canvas), ...this.#spare]) releaseCanvas(c);
    if (this.#pinned) releaseCanvas(this.#pinned.canvas);
    this.#checkpoints = [];
    this.#spare = [];
    this.#pinned = null;
  }

  /** Draw the active stroke's new segments; the pen's masked view follows on the next frame. */
  #drawNew(): void {
    const active = this.#active;
    if (!active) return;
    const n = active.op.pts.length / 2;
    if (active.kind === "eraser") {
      const { op } = active;
      drawSegments(
        this.#paint,
        op.pts,
        active.drawn,
        op.size * ERASER_FACTOR,
        "#000",
        "destination-out",
      );
      active.drawn = n;
      return;
    }
    const { op } = active;
    drawSegments(this.#stroke, op.pts, active.drawn, op.size, op.color, "source-over");
    const from = Math.max(0, active.drawn - 1) * 2;
    const fresh = strokeRasterBox(op.pts.slice(from), op.size);
    active.dirty = union(active.dirty, fresh);
    active.drawn = n;
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#composeLive());
  }

  #composeLive(): void {
    const active = this.#active;
    if (!active || active.kind !== "pen" || !active.dirty) return;
    const box = active.mask ? intersect(active.dirty, maskBox(active.mask)) : active.dirty;
    active.dirty = null;
    if (box) composeMasked(this.#live, this.#stroke.canvas, active.mask, box);
  }

  /** stroke ∩ mask onto paint, then clean live and stroke — for live and replay alike. */
  #finishPen(op: StrokeOp, mask: MaskCanvas | null): void {
    const box = strokeRasterBox(op.pts, op.size);
    const target = mask ? intersect(box, maskBox(mask)) : box;
    if (target) {
      composeMasked(this.#live, this.#stroke.canvas, mask, target);
      commitBox(this.#paint, this.#live, this.#stroke, target);
    }
    if (box) {
      this.#live.clearRect(box.x, box.y, box.w, box.h);
      this.#stroke.clearRect(box.x, box.y, box.w, box.h);
    }
  }

  /** Apply one op to the paint canvas (replay, fills, clears). */
  #apply(op: Op): void {
    switch (op.t) {
      case "clear":
        this.#paint.clearRect(0, 0, RASTER_W, RASTER_H);
        return;
      case "erase":
        drawSegments(this.#paint, op.pts, 0, op.size * ERASER_FACTOR, "#000", "destination-out");
        return;
      case "fill": {
        const mask = this.#masks.get(op.region);
        const box = maskBox(mask);
        fillBox(this.#stroke, box, op.color);
        composeMasked(this.#live, this.#stroke.canvas, mask, box);
        commitBox(this.#paint, this.#live, this.#stroke, box);
        return;
      }
      case "stroke": {
        const mask = op.region === null ? null : this.#masks.get(op.region);
        drawSegments(this.#stroke, op.pts, 0, op.size, op.color, "source-over");
        this.#finishPen(op, mask);
      }
    }
  }

  #commit(op: Op): void {
    this.#apply(op);
    this.#push(op);
  }

  #push(op: Op): void {
    this.#ops.push(op);
    if (this.#ops.length % CHECKPOINT_EVERY === 0) this.#hold(this.#ops.length, this.#paint.canvas);
    this.#changed();
  }

  #changed(): void {
    this.#version++;
    for (const listener of this.#listeners) listener();
  }

  /** Keep `source` as the state after `at` ops; only the highest MAX_CHECKPOINTS stay. */
  #hold(at: number, source: CanvasImageSource): void {
    if (this.#checkpoints.some((c) => c.at === at)) return;
    let canvas: HTMLCanvasElement;
    if (this.#checkpoints.length >= MAX_CHECKPOINTS) {
      this.#checkpoints.sort((a, b) => a.at - b.at);
      const lowest = this.#checkpoints[0];
      if (!lowest || lowest.at > at) return;
      this.#checkpoints.shift();
      canvas = lowest.canvas;
    } else {
      canvas = this.#spare.pop() ?? createCanvas(RASTER_W, RASTER_H);
    }
    copyCanvas(context2d(canvas), source);
    this.#checkpoints.push({ at, key: `c${at}`, canvas });
  }

  /**
   * Bring the paint canvas to the state after `target` ops: restore the
   * nearest held state, then apply the plan's steps — in segments ending on
   * checkpoint boundaries, so a long replay leaves checkpoints behind.
   */
  #replayTo(target: number): void {
    const held = [...this.#checkpoints, ...(this.#pinned ? [this.#pinned] : [])];
    const starts: ReplayStart[] = held.map(({ at, key }) => ({ at, key }));
    const { start } = planReplay(this.#ops, target, starts);
    if (start.key === "base") this.#restoreBase();
    else if (start.key === "blank") this.#paint.clearRect(0, 0, RASTER_W, RASTER_H);
    else {
      const from = held.find((h) => h.key === start.key);
      if (from) copyCanvas(this.#paint, from.canvas);
    }
    let at = start.at;
    const step = (to: number) => {
      const plan = planReplay(this.#ops, to, [{ at, key: "current" }]);
      if (plan.start.key === "blank") this.#paint.clearRect(0, 0, RASTER_W, RASTER_H);
      for (const i of plan.steps) {
        const op = this.#ops[i];
        if (op) this.#apply(op);
      }
      at = to;
    };
    for (
      let b = (Math.floor(at / CHECKPOINT_EVERY) + 1) * CHECKPOINT_EVERY;
      b <= target;
      b += CHECKPOINT_EVERY
    ) {
      step(b);
      this.#hold(b, this.#paint.canvas);
    }
    if (at < target) step(target);
  }

  #restoreBase(): void {
    if (this.#base) copyCanvas(this.#paint, this.#base);
    else this.#paint.clearRect(0, 0, RASTER_W, RASTER_H);
  }
}
