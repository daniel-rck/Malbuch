import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

/** How long a finger must stay on a `hold` button before it fires. */
export const HOLD_MS = 700;

/**
 * A round, icon-only action in the top bar (52 px, prototype style; 48 on
 * phones). With `hold`, a tap does nothing: the finger has to stay on it
 * while a sun-yellow ring fills (spec §3) — a stray tap of a small child
 * neither wipes the picture nor opens the share sheet. Keyboards and screen
 * readers (a click without a pointer) still trigger it at once.
 */
export function RoundButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hold?: boolean;
  children: ReactNode;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const release = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    if (props.disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    // Without the implicit touch capture, sliding off the button lets go of it.
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    release();
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      props.onClick();
    }, HOLD_MS);
  };

  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={(e) => {
        // detail is 0 for Enter, Space and screen-reader activation.
        if (!props.hold || e.detail === 0) props.onClick();
      }}
      {...(props.hold && {
        onPointerDown: press,
        onPointerUp: release,
        onPointerLeave: release,
        onPointerCancel: release,
        onContextMenu: (e) => e.preventDefault(),
      })}
      className="relative grid size-[52px] shrink-0 cursor-pointer place-items-center rounded-full bg-tray text-on-tray shadow-[0_4px_0_var(--color-shade)] compact:size-12 active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-shade)] disabled:cursor-default disabled:opacity-40"
    >
      {props.children}
      {props.hold && (
        <svg
          viewBox="0 0 60 60"
          aria-hidden="true"
          data-holding={holding || undefined}
          className="pointer-events-none absolute -inset-1 -rotate-90 opacity-0 data-holding:opacity-100"
        >
          <circle
            cx="30"
            cy="30"
            r="28"
            pathLength={1}
            fill="none"
            stroke="var(--color-sun)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="1"
            className={
              holding
                ? "[stroke-dashoffset:0] transition-[stroke-dashoffset] duration-700 ease-linear motion-reduce:transition-none"
                : "[stroke-dashoffset:1]"
            }
          />
        </svg>
      )}
    </button>
  );
}
