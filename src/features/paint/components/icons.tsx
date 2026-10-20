import type { ReactNode } from "react";
import type { GroupId } from "../../../pages/groups.ts";

// Line icons in the prototype's style: 24×24, round caps, currentColor. All
// decorative — the button around each carries the German aria-label.

function Icon({ children, width = 2.4 }: { children: ReactNode; width?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[26px]"
    >
      {children}
    </svg>
  );
}

export const UndoIcon = () => (
  <Icon width={2.6}>
    <path d="M9 5L4 10l5 5" />
    <path d="M4 10h10a5 5 0 010 10h-3" />
  </Icon>
);

export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

/** "Bild speichern": a picture going out of the tray. */
export const SaveIcon = () => (
  <Icon>
    <path d="M12 3v11" />
    <path d="M7.5 9.5L12 14l4.5-4.5" />
    <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </Icon>
);

export const ReloadIcon = () => (
  <Icon>
    <path d="M20 12a8 8 0 11-2.4-5.7" />
    <path d="M20 4v5h-5" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon width={2.8}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const PenIcon = () => (
  <Icon width={2.3}>
    <path d="M4 20l1.4-4.6L16 4.8a2.1 2.1 0 013 3L8.4 18.6z" />
    <path d="M14 6.8l3.2 3.2" />
  </Icon>
);

export const FillIcon = () => (
  <Icon width={2.3}>
    <path d="M5.5 10.5L12 4l7 7-6.6 6.6a2 2 0 01-2.8 0l-4.1-4.2a2 2 0 010-2.9z" />
    <path d="M5 11h14" />
    <path d="M20.5 15s-2 2.3-2 3.6a2 2 0 004 0c0-1.3-2-3.6-2-3.6z" fill="currentColor" />
  </Icon>
);

export const EraserIcon = () => (
  <Icon width={2.3}>
    <path d="M9 20h11" />
    <path d="M4.6 14.4l9.2-9.2a2 2 0 012.8 0l3.2 3.2a2 2 0 010 2.8L12 19H8.8z" />
    <path d="M9.5 9.5l5 5" />
  </Icon>
);

/** A child, smaller or taller: the age groups' tabs. */
export function AgeIcon({ group }: { group: GroupId }) {
  const scale = { klein: 0.62, mittel: 0.8, gross: 1 }[group];
  // Feet stay on the ground line (y = 22), the figure grows upwards.
  const t = `translate(12 22) scale(${scale}) translate(-12 -22)`;
  return (
    <Icon width={2.2}>
      <g transform={t}>
        <circle cx="12" cy="5" r="3" fill="currentColor" />
        <path
          d="M12 9v7M12 16l-3.5 6M12 16l3.5 6M6.5 11.5L12 10l5.5 1.5"
          strokeWidth={2.6 / scale}
        />
      </g>
    </Icon>
  );
}
