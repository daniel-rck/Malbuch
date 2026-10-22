import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ageGroup } from "../../pages/groups.ts";
import { loadAllSeasons, type Page, PAGES } from "../../pages/manifest.ts";
import {
  DILATE,
  LINE_THRESHOLD,
  RASTER_H,
  RASTER_SCALE,
  RASTER_W,
  SPECK_AREA,
} from "../paint/config.ts";
import { buildMask } from "../paint/engine/mask.ts";
import { LINE, labelRegions } from "../paint/engine/regions.ts";
import { regionStats } from "../paint/engine/stats.ts";
import { context2d } from "../paint/render/canvas.ts";
import { rasterizeDarkness } from "../paint/render/rasterize.ts";

/** Dropped areas under this many doc px² are junction holes, not worth listing. */
const MIN_SPECK_REPORT = 10;

type PageReport = {
  id: string;
  group: string;
  regions: number;
  /** Smallest region's inscribed square, doc px. */
  smallest: number;
  /** Regions under the group's minimum, with their inscribed size in doc px. */
  tooSmall: { id: number; inscribed: number; x: number; y: number }[];
  /**
   * White areas the speck rule turned into line (area in doc px², box in doc
   * px): fine for highlights, letter counters and junction holes — a drawn
   * shape here can't be coloured.
   */
  specks: { area: number; x: number; y: number; w: number; h: number }[];
  labelMs: number;
  /** Mask build of the largest region, the worst case. */
  maskMs: number;
};

/**
 * Dev builds only (`/dev/seiten`, `?seite=<id>` for one page): every page
 * through the real rasterise → label pipeline. Regions are tinted, regions
 * under the age group's minimum are red, areas dropped as specks orange, and a
 * JSON report sits at the end for scripts. A leak in the art shows as one tint
 * spreading where it should not.
 */
export function DevPagesPage() {
  const [params] = useSearchParams();
  const only = params.get("seite");
  // Season pages too, whatever the date.
  const [loaded, setLoaded] = useState<readonly Page[] | null>(null);
  useEffect(() => {
    void loadAllSeasons().then((season) => setLoaded([...PAGES, ...season]));
  }, []);
  const pages = (loaded ?? []).filter((p) => !only || p.id === only);
  const [reports, setReports] = useState<Record<string, PageReport>>({});
  const done = loaded !== null && Object.keys(reports).length === pages.length;
  const onReport = useCallback((r: PageReport) => setReports((all) => ({ ...all, [r.id]: r })), []);

  return (
    <main className="min-h-screen bg-white p-4 text-black">
      <h1 className="mb-4 text-xl font-bold">Seiten-Prüfung</h1>
      <div className="flex flex-wrap gap-4">
        {pages.map((page) => (
          <PageCard key={page.id} page={page} onReport={onReport} />
        ))}
      </div>
      <pre id="report" data-done={done} className="mt-4 text-xs whitespace-pre-wrap">
        {JSON.stringify(Object.values(reports), null, 1)}
      </pre>
    </main>
  );
}

function PageCard({ page, onReport }: { page: Page; onReport: (r: PageReport) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [report, setReport] = useState<PageReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const darkness = await rasterizeDarkness(page.svg, RASTER_W, RASTER_H);
      const t0 = performance.now();
      const regions = labelRegions(darkness, RASTER_W, RASTER_H, LINE_THRESHOLD, SPECK_AREA);
      const labelMs = performance.now() - t0;
      // The same labelling without the speck rule: what it dropped.
      const all = labelRegions(darkness, RASTER_W, RASTER_H, LINE_THRESHOLD);
      const specks: PageReport["specks"] = [];
      for (let id = 1; id <= all.count; id++) {
        const raster = all.areas[id] ?? 0;
        const area = raster / RASTER_SCALE ** 2;
        if (raster >= SPECK_AREA || area < MIN_SPECK_REPORT) continue;
        const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = all.boxes.subarray(id * 4, id * 4 + 4);
        specks.push({
          area: Math.round(area),
          x: Math.round(x0 / RASTER_SCALE),
          y: Math.round(y0 / RASTER_SCALE),
          w: Math.round((x1 - x0 + 1) / RASTER_SCALE),
          h: Math.round((y1 - y0 + 1) / RASTER_SCALE),
        });
      }
      let largest = 1;
      for (let id = 1; id <= regions.count; id++) {
        if ((regions.areas[id] ?? 0) > (regions.areas[largest] ?? 0)) largest = id;
      }
      const t1 = performance.now();
      buildMask(regions, largest, DILATE);
      const maskMs = performance.now() - t1;
      const stats = regionStats(regions);
      const min = ageGroup(page.group).minRegion;
      const tooSmall = stats
        .filter((s) => s.inscribed / RASTER_SCALE < min)
        .map((s) => ({
          id: s.id,
          inscribed: Math.round(s.inscribed / RASTER_SCALE),
          x: Math.round((regions.boxes[s.id * 4] ?? 0) / RASTER_SCALE),
          y: Math.round((regions.boxes[s.id * 4 + 1] ?? 0) / RASTER_SCALE),
        }));
      const small = new Set(tooSmall.map((s) => s.id));
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = context2d(canvas);
        const img = ctx.createImageData(RASTER_W, RASTER_H);
        const px = new Uint32Array(img.data.buffer);
        for (let i = 0; i < regions.labels.length; i++) {
          const l = regions.labels[i] ?? LINE;
          if (l === LINE) px[i] = (all.labels[i] ?? LINE) > 0 ? 0xff00a0ff : 0xff38221e;
          else px[i] = small.has(l) ? 0xff0000ff : tint(l);
        }
        ctx.putImageData(img, 0, 0);
      }
      const r: PageReport = {
        id: page.id,
        group: page.group,
        regions: regions.count,
        smallest: Math.round(Math.min(...stats.map((s) => s.inscribed)) / RASTER_SCALE),
        tooSmall,
        specks,
        labelMs: Math.round(labelMs),
        maskMs: Math.round(maskMs * 10) / 10,
      };
      setReport(r);
      onReport(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, onReport]);

  return (
    <figure className="w-[400px]" data-page={page.id}>
      <canvas
        ref={canvasRef}
        width={RASTER_W}
        height={RASTER_H}
        className="h-[500px] w-[400px] border"
      />
      <figcaption className="text-sm">
        <strong>{page.name}</strong> ({page.group})
        {report && (
          <>
            {" "}
            · {report.regions} Flächen · kleinste {report.smallest} px · zu klein:{" "}
            {report.tooSmall.length} · verworfen: {report.specks.length} · Labels {report.labelMs}{" "}
            ms · Maske {report.maskMs} ms
          </>
        )}
      </figcaption>
    </figure>
  );
}

/** A light, stable colour per region id, as little-endian RGBA. */
function tint(id: number): number {
  const hue = (id * 137.508) % 360;
  const [r, g, b] = hslToRgb(hue, 0.65, 0.78);
  return (0xff << 24) | (b << 16) | (g << 8) | r;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}
