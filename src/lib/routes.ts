export const ROUTES = {
  home: "/",
  /** Dev builds only: every page rasterised and labelled, for checking new art. */
  devPages: "/dev/seiten",
} as const;

export type RouteKey = keyof typeof ROUTES;
