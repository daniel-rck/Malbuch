// The fixed numbers of the paint surface (spec §5.1–5.2). Document coordinates
// are what ops store; raster coordinates are what labels, masks and canvases
// use. Scaling between the two happens in render/ only.

export const DOC_W = 800;
export const DOC_H = 1000;

export const RASTER_SCALE = 1.5;
export const RASTER_W = Math.round(DOC_W * RASTER_SCALE);
export const RASTER_H = Math.round(DOC_H * RASTER_SCALE);

/** Darkness (255 − luminance) above which a pixel counts as line. */
export const LINE_THRESHOLD = 110;

/** How far, in raster px, a region's mask reaches under the adjoining lines. */
export const DILATE = Math.round(9 * RASTER_SCALE);

/** How far, in raster px, a start point on a line looks for the nearest region. */
export const SEARCH_RADIUS = Math.round(18 * RASTER_SCALE);

/**
 * Regions smaller than this many doc px² (eye highlights, letter counters,
 * antialiasing holes in line junctions) count as line: nobody colours them on
 * purpose, and a stroke that started in one would paint nothing visible.
 */
export const SPECK_AREA = Math.round(150 * RASTER_SCALE * RASTER_SCALE);

/** Bump when labelling changes (threshold, specks, …): cached labels are rebuilt. */
export const LABEL_SCHEMA = 1;

/** The four pen sizes in doc px, with the dot diameter the tray shows for each. */
export const SIZES = [
  { size: 8, dot: 8, label: "Dünn" },
  { size: 16, dot: 14, label: "Mittel" },
  { size: 30, dot: 22, label: "Dick" },
  { size: 52, dot: 30, label: "Ganz dick" },
] as const;

export type PenSize = (typeof SIZES)[number]["size"];

export const ERASER_FACTOR = 1.4;

/** The 16 colours of the prototype, including two skin tones, white and black. */
export const PALETTE = [
  { color: "#E53935", label: "Rot" },
  { color: "#FB8C00", label: "Orange" },
  { color: "#FDD835", label: "Gelb" },
  { color: "#8BC34A", label: "Hellgrün" },
  { color: "#2E7D32", label: "Grün" },
  { color: "#26C6DA", label: "Türkis" },
  { color: "#1E88E5", label: "Blau" },
  { color: "#283593", label: "Dunkelblau" },
  { color: "#8E24AA", label: "Lila" },
  { color: "#F06292", label: "Rosa" },
  { color: "#F7D0B0", label: "Hautfarbe hell" },
  { color: "#C68642", label: "Hautfarbe braun" },
  { color: "#6D4C41", label: "Braun" },
  { color: "#9E9E9E", label: "Grau" },
  { color: "#212121", label: "Schwarz" },
  { color: "#FFFFFF", label: "Weiß" },
] as const;

export type Tool = "pen" | "fill" | "eraser";
