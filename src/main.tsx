import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./lib/router.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

// The pictures live only in IndexedDB: ask the browser not to evict them
// under storage pressure (granted silently by Chrome and Safari).
void (async () => {
  const storage = navigator.storage as StorageManager | undefined;
  if (storage?.persist && !(await storage.persisted())) await storage.persist();
})().catch((error: unknown) => console.warn("Malbuch: no persistent storage", error));

// No <UpdatePrompt />: its toast is text. The paint page shows a reload icon
// instead when a new version waits (useAppUpdate).
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
