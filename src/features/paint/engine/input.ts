// The one-pointer rule (spec §5.3) as a pure decision, so it is testable
// without a DOM: the first finger paints, later ones are ignored (a hand
// resting on the tablet), and a pen takes over from a touch that came first
// (the palm landed before the pen).

export type ActivePointer = { id: number; kind: string };

export type DownDecision = "start" | "ignore" | "replace";

export function decidePointerDown(
  active: ActivePointer | null,
  id: number,
  kind: string,
): DownDecision {
  if (!active) return "start";
  if (active.id !== id && kind === "pen" && active.kind === "touch") return "replace";
  return "ignore";
}

/** Move, up, cancel and lost capture only count for the active pointer. */
export function isActivePointer(active: ActivePointer | null, id: number): boolean {
  return active !== null && active.id === id;
}
