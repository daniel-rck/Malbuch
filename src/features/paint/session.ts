import type { Page } from "../../pages/manifest.ts";
import type { Autosave } from "./autosave.ts";
import type { Regions } from "./engine/regions.ts";
import type { PageCanvas } from "./render/page-canvas.ts";

/**
 * The open page, as the top bar and the stickers need it: its log, its saver,
 * its paint layer, its regions.
 */
export type Session = {
  page: Page;
  canvas: PageCanvas;
  autosave: Autosave;
  paint: HTMLCanvasElement;
  regions: Regions;
};
