import { useEffect, useMemo } from "react";
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

/** Object URLs of every stored thumbnail, by page id; revoked when they change. */
export function useThumbUrls(): Map<string, string> {
  const { data } = useLiveQuery("previews", loadThumbs);
  const urls = useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, png] of data ?? []) {
      map.set(id, URL.createObjectURL(new Blob([png], { type: "image/png" })));
    }
    return map;
  }, [data]);
  useEffect(
    () => () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
    },
    [urls],
  );
  return urls;
}
