import type { ReactNode } from "react";

/** A round, icon-only action in the top bar (52 px, prototype style). */
export function RoundButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="grid size-[52px] shrink-0 cursor-pointer place-items-center rounded-full bg-tray text-on-tray shadow-[0_4px_0_var(--color-shade)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-shade)] disabled:cursor-default disabled:opacity-40"
    >
      {props.children}
    </button>
  );
}
