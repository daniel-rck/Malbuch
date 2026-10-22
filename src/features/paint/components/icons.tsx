import type { ReactNode } from "react";
import type { GroupId } from "../../../pages/groups.ts";
import type { SeasonId } from "../../rewards/engine/seasons.ts";

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

/** A wrapped present: a surprise page not open yet. */
export const GiftIcon = () => (
  <Icon width={2.2}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
    <rect x="2.5" y="6" width="19" height="4" rx="1" />
    <path d="M12 6v14.5" />
    <path d="M12 6C10.5 2.5 6 2.5 7 5c.4 1 2.5 1 5 1zM12 6c1.5-3.5 6-3.5 5-1-.4 1-2.5 1-5 1z" />
  </Icon>
);

/** A season page's badge: egg, sun, pumpkin or Christmas tree. */
export function SeasonIcon({ season }: { season: SeasonId }) {
  switch (season) {
    case "ostern":
      return (
        <Icon width={2.2}>
          <path d="M12 3c3.6 0 6.5 5.6 6.5 10.2A6.5 6.5 0 015.5 13.2C5.5 8.6 8.4 3 12 3z" />
          <path d="M6 12.5l2.5-1.5 2 1.5 2-1.5 2 1.5 2-1.5 1.5 1" />
        </Icon>
      );
    case "sommer":
      return (
        <Icon width={2.2}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
        </Icon>
      );
    case "halloween":
      return (
        <Icon width={2.2}>
          <path d="M12 7c-5 0-8.5 2.8-8.5 6.8S7 21 12 21s8.5-3.2 8.5-7.2S17 7 12 7z" />
          <path d="M12 7c-1.6 2.8-1.6 11 0 14M12 7c1.6 2.8 1.6 11 0 14M12 7c0-2 .6-3.2 2-4" />
        </Icon>
      );
    case "weihnachten":
      return (
        <Icon width={2.2}>
          <path d="M12 2.5l4.5 6h-2.5l4.5 6h-3l3.5 4.5H5l3.5-4.5h-3l4.5-6H7.5z" />
          <path d="M12 19v2.5" />
        </Icon>
      );
  }
}

/** "Stickerheft": a star sticker with a peeled corner. */
export const StickerIcon = () => (
  <Icon width={2.2}>
    <path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8L3.6 9.3l5.8-.8z" />
    <path d="M14.5 14.6l1.2 1.4" />
  </Icon>
);

/** Four-pointed sparkle: something new is waiting. Filled, sun-yellow by default. */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 1.5c.9 5.4 3.6 8.4 10.5 10.5-6.9 2.1-9.6 5.1-10.5 10.5C11.1 17.1 8.4 14.1 1.5 12 8.4 9.9 11.1 6.9 12 1.5z"
        fill="var(--color-sun)"
        stroke="var(--color-line)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
