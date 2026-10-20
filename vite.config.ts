import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// A plain object, not the function form: vitest.config.ts merges it.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "index.ts",
      // A new version waits for the user's go (the reload icon in the top bar); see src/sw/base.ts.
      registerType: "prompt",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
      },
      devOptions: { enabled: false, type: "module" },
      manifest: {
        id: "/",
        name: "Malbuch",
        short_name: "Malbuch",
        description:
          "Ausmalen ohne Übermalen: Malbuch für Kinder von 3 bis 8, offline auf dem Tablet.",
        lang: "de",
        dir: "ltr",
        // accent-600 of the app's hue, as hex (#a71f65 is hue 355)
        theme_color: "#a71f65",
        // The splash screen in the sky blue of the app.
        background_color: "#bfe0ff",
        // Children paint on the whole screen: no browser bars, any orientation.
        display: "fullscreen",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
