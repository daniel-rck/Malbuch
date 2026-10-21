import { beforeEach, describe, expect, it, vi } from "vitest";
import { Autosave } from "./autosave.ts";
import { saveOps, savePreview } from "./db.ts";
import type { Op } from "./engine/ops.ts";
import type { PageCanvas } from "./render/page-canvas.ts";
import { canvasToPng, thumbnailPng } from "./render/png.ts";

vi.mock("./db.ts", () => ({
  saveOps: vi.fn<() => Promise<boolean>>(),
  savePreview: vi.fn<() => Promise<boolean>>(async () => true),
}));
// jsdom has no canvas: encoding is faked, but when it is called is what counts.
vi.mock("./render/png.ts", () => ({
  canvasToPng: vi.fn<() => Promise<Blob>>(async () => new Blob(["png"])),
  thumbnailPng: vi.fn<() => Promise<Blob>>(async () => new Blob(["thumb"])),
}));

const fill: Op = { t: "fill", color: "#E53935", region: 1 };

function setup() {
  const paint = document.createElement("canvas");
  const canvas = { ops: [fill], isDrawing: false } as unknown as PageCanvas;
  const autosave = new Autosave({
    pageId: "drache",
    labelsKey: "k",
    base: undefined,
    canvas,
    paint,
    previewDigest: null,
  });
  return { paint, autosave };
}

beforeEach(() => {
  vi.mocked(saveOps).mockResolvedValue(true);
});

describe("Autosave.flush", () => {
  it("reads the paint canvas before it waits for the op log", async () => {
    // The page switch clears the shared canvas right after calling flush().
    const write: { resolve?: (ok: boolean) => void } = {};
    vi.mocked(saveOps).mockReturnValue(new Promise((resolve) => (write.resolve = resolve)));
    const { paint, autosave } = setup();
    autosave.changed();
    const done = autosave.flush();
    expect(canvasToPng).toHaveBeenCalledWith(paint);
    expect(thumbnailPng).toHaveBeenCalledWith(paint);
    write.resolve?.(true);
    await done;
    expect(savePreview).toHaveBeenCalledTimes(1);
    autosave.dispose();
  });

  it("writes the op log again after a failed write", async () => {
    vi.mocked(saveOps).mockResolvedValueOnce(false);
    const { autosave } = setup();
    autosave.changed();
    await autosave.flush();
    await autosave.flush();
    expect(saveOps).toHaveBeenCalledTimes(2);
    await autosave.flush();
    expect(saveOps).toHaveBeenCalledTimes(2);
    autosave.dispose();
  });
});
