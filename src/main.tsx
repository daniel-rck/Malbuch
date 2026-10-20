import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./lib/router.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

// No <UpdatePrompt />: its toast is text. The paint page shows a reload icon
// instead when a new version waits (useAppUpdate).
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
