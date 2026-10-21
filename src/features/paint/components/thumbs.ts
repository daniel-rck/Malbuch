import { useEffect } from "react";
import { useLiveQuery } from "../../../lib/db/useLiveQuery.ts";
import type { Page } from "../../../pages/manifest.ts";
import { loadThumbs } from "../db.ts";
import { svgDataUrl } from "../render/rasterize.ts";

const artUrls = new Map<string, string>();

/** The page's line art as an image URL, made once per page. */
export function artUrl(page: Page): string {
  let url = artUrls.get(page.id);
  if (!url) {
    url = svgDataUrl(page.svg);
    artUrls.set(page.id, url);
  }
  return url;
}

/**
 * Thumbnail image URLs by `<page>:<digest>`: a page keeps its URL while its
 * preview is unchanged, so saving one page doesn't reload the others' images.
 */
const thumbUrls = new Map<string, string>();
const NONE = new Map<string, string>();

async function loadThumbUrls(): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  for (const { id, thumb, digest } of await loadThumbs()) {
    const key = `${id}:${digest}`;
    let url = thumbUrls.get(key);
    if (!url) {
      url = URL.createObjectURL(new Blob([thumb], { type: "image/png" }));
      thumbUrls.set(key, url);
    }
    urls.set(id, url);
  }
  return urls;
}

/** Object URLs of every stored thumbnail, by page id; replaced ones are revoked. */
export function useThumbUrls(): Map<string, string> {
  const { data } = useLiveQuery("thumbs", loadThumbUrls);
  useEffect(() => {
    if (!data) return;
    const shown = new Set(data.values());
    for (const [key, url] of thumbUrls) {
      if (shown.has(url)) continue;
      URL.revokeObjectURL(url);
      thumbUrls.delete(key);
    }
  }, [data]);
  return data ?? NONE;
}
