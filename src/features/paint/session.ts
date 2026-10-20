import type { Page } from "../../pages/manifest.ts";
import type { Autosave } from "./autosave.ts";
import type { PageCanvas } from "./render/page-canvas.ts";

/** The open page, as the top bar needs it: its log, its saver, its paint layer. */
export type Session = {
  page: Page;
  canvas: PageCanvas;
  autosave: Autosave;
  paint: HTMLCanvasElement;
};
