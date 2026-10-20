import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Tests run through the app's own Vite config, so its plugins, aliases and
// virtual modules resolve exactly as they do in the build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      // The on-disk module cache keeps an import.meta.glob's file list from
      // before a page was added, so src/pages tests would miss the new SVG.
      fsModuleCache: false,
    },
  }),
);
