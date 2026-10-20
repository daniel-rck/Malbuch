import { Outlet } from "react-router-dom";

/**
 * The root layout route. Malbuch shows no app shell: children can't read, so
 * the paint page is the whole screen (see docs/specs/malbuch.md §7).
 */
export function App() {
  return <Outlet />;
}
