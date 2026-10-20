import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { App } from "../App.tsx";
import { ROUTES } from "./routes.ts";
import { NotFound } from "./routing/NotFound.tsx";
import { RouteError } from "./routing/RouteError.tsx";
import { RouteFallback } from "./routing/RouteFallback.tsx";

// `import.meta.env.DEV` is false in a production build, so the bundler drops
// this route and its chunk.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: ROUTES.devPages,
        lazy: async () => ({
          Component: (await import("../features/dev/DevPagesPage.tsx")).DevPagesPage,
        }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    // The root layout route: a bare <Outlet /> (src/App.tsx) — Malbuch has no
    // app shell, the paint page fills the screen.
    path: ROUTES.home,
    Component: App,
    ErrorBoundary: RouteError,
    HydrateFallback: RouteFallback,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("../features/paint/PaintPage.tsx")).PaintPage,
            }),
          },
          ...devRoutes,
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
