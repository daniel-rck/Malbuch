import type { ReactNode } from "react";
import type { StickerKind } from "../engine/stickers.ts";

// Sticker art: a scalloped badge in its kind's colour, a picture in the
// middle, gold stars for the steps of a series. Decorative — the button or
// list item around it carries the aria-label.

const LINE = "#1E2238";
const SUN = "#FFD23F";

export const KIND_COLOR: Record<StickerKind, string> = {
  malen: "#F06292",
  werkzeug: "#26C6DA",
  tage: "#FB8C00",
  entdecker: "#8BC34A",
};

/** A flower-edged disc of 14 bumps around (50, 50). */
const BADGE = (() => {
  const n = 14;
  const r = 43;
  const bump = 6.5;
  const at = (i: number): [number, number] => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  };
  let d = `M${at(0)
    .map((v) => v.toFixed(2))
    .join(" ")}`;
  for (let i = 1; i <= n; i++) {
    d += ` A${bump} ${bump} 0 0 1 ${at(i)
      .map((v) => v.toFixed(2))
      .join(" ")}`;
  }
  return `${d} Z`;
})();

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * Math.PI - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function Stars({ n }: { n: number }) {
  const gap = 13;
  const x0 = 50 - ((n - 1) * gap) / 2;
  return (
    <g fill={SUN} stroke={LINE} strokeWidth="2" strokeLinejoin="round">
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={starPath(x0 + i * gap, 80, 6.5)} />
      ))}
    </g>
  );
}

const Frame = ({ children }: { children?: ReactNode }) => (
  <g stroke={LINE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <rect x="27" y="26" width="46" height="40" rx="4" fill="#fff" />
    {children ?? (
      <>
        <path d="M31 61l12-14 9 9 6-6 11 11z" fill="#8BC34A" />
        <circle cx="60" cy="37" r="5" fill={SUN} />
      </>
    )}
  </g>
);

const Calendar = ({ marks }: { marks?: number[] }) => (
  <g stroke={LINE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <rect x="25" y="28" width="50" height="40" rx="5" fill="#fff" />
    <path d="M25 40h50" fill="none" />
    <path d="M36 23v9M64 23v9" fill="none" />
    <g strokeWidth="2">
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={28.5 + i * 6.3}
          y="49"
          width="5"
          height="10"
          rx="1.5"
          fill={marks?.includes(i) ? SUN : "#fff"}
        />
      ))}
    </g>
  </g>
);

const Gift = ({ x = 50, y = 50, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    stroke={LINE}
    strokeWidth={3 / s}
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <rect x="-20" y="-6" width="40" height="26" rx="2" fill="#E53935" />
    <rect x="-23" y="-14" width="46" height="9" rx="2" fill="#E53935" />
    <path d="M-4 -14h8v34h-8z" fill={SUN} />
    <path
      d="M0 -14c-4-10-15-9-12-3 1.5 3 6 3 12 3zM0 -14c4-10 15-9 12-3-1.5 3-6 3-12 3z"
      fill={SUN}
    />
  </g>
);

const Pen = ({
  x,
  y,
  s = 1,
  color = "#1E88E5",
}: {
  x: number;
  y: number;
  s?: number;
  color?: string;
}) => (
  <g
    transform={`translate(${x} ${y}) rotate(-45) scale(${s})`}
    stroke={LINE}
    strokeWidth={3 / s}
    strokeLinejoin="round"
  >
    <rect x="-6" y="-24" width="12" height="34" rx="2" fill={color} />
    <path d="M-6 10l6 12 6-12z" fill="#F7D0B0" />
    <path d="M-2 18l2 4 2-4z" fill={LINE} />
  </g>
);

const Bucket = () => (
  <g stroke={LINE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M44 44l14-12 14 15-13 12a3 3 0 01-4 0l-11-11a3 3 0 010-4z" fill="#fff" />
    <path d="M44 45h28" fill="none" />
    <path d="M74 54s-4 5-4 7.5a4 4 0 008 0c0-2.5-4-7.5-4-7.5z" fill="#E53935" />
  </g>
);

const Figure = ({ x, s, color }: { x: number; s: number; color: string }) => (
  <g
    transform={`translate(${x} 70) scale(${s})`}
    stroke={LINE}
    strokeWidth={3 / s}
    strokeLinecap="round"
  >
    <circle cx="0" cy="-34" r="7" fill={color} />
    <path d="M0 -26v15M0 -11l-7 11M0 -11l7 11M-9 -22l9 -2 9 2" fill="none" />
  </g>
);

const RAINBOW = ["#E53935", "#FB8C00", "#FDD835", "#8BC34A", "#1E88E5", "#8E24AA"];

const ART: Record<string, () => ReactNode> = {
  "bild-1": () => (
    <>
      <Frame />
      <Stars n={1} />
    </>
  ),
  "bild-5": () => (
    <>
      <Frame />
      <Stars n={2} />
    </>
  ),
  "bild-10": () => (
    <>
      <Frame />
      <Stars n={3} />
    </>
  ),
  "bild-25": () => (
    <>
      <Frame />
      <Stars n={4} />
    </>
  ),
  "ganz-bunt": () => (
    <Frame>
      {RAINBOW.map((c, i) => (
        <rect key={c} x={29 + i * 7} y="28" width="7" height="36" fill={c} stroke="none" />
      ))}
      <rect x="27" y="26" width="46" height="40" rx="4" fill="none" />
    </Frame>
  ),
  ...Object.fromEntries(
    (["klein", "mittel", "gross"] as const).map((g, i) => [
      `alle-${g}`,
      () => (
        <>
          <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
            <path d="M26 58l-2-26 13 11 13-18 13 18 13-11-2 26z" fill={SUN} />
            <circle cx="50" cy="45" r="4" fill="#E53935" />
          </g>
          <Stars n={i + 1} />
        </>
      ),
    ]),
  ),
  werkzeuge: () => (
    <>
      <Pen x={38} y={50} s={0.8} />
      <Bucket />
      <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
        <rect x="30" y="64" width="24" height="12" rx="3" fill="#F06292" />
        <path d="M42 64v12" fill="none" />
      </g>
    </>
  ),
  "nur-stift": () => <Pen x={52} y={46} s={1.15} color="#E53935" />,
  regenbogen: () => (
    <g fill="none" strokeLinecap="round">
      {RAINBOW.map((c, i) => (
        <path
          key={c}
          d={`M${22 + i * 4} 66a${28 - i * 4} ${28 - i * 4} 0 0 1 ${56 - i * 8} 0`}
          stroke={c}
          strokeWidth="4.5"
        />
      ))}
      <path d="M20 66a30 30 0 0 1 60 0" stroke={LINE} strokeWidth="2" />
    </g>
  ),
  "alle-farben": () => (
    <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
      <path
        d="M50 24c16 0 28 10 28 23 0 8-6 11-12 10-5-1-8 2-6 7 2 6-3 9-10 9-16 0-28-11-28-25s12-24 28-24z"
        fill="#F7D0B0"
      />
      {[
        [38, 36, "#E53935"],
        [52, 32, "#FDD835"],
        [65, 39, "#1E88E5"],
        [34, 51, "#8BC34A"],
        [45, 62, "#8E24AA"],
      ].map(([x, y, c]) => (
        <circle key={String(c)} cx={x} cy={y} r="5.5" fill={String(c)} strokeWidth="2" />
      ))}
    </g>
  ),
  "tage-3": () => (
    <>
      <Calendar />
      <Stars n={1} />
    </>
  ),
  "tage-7": () => (
    <>
      <Calendar />
      <Stars n={2} />
    </>
  ),
  "tage-14": () => (
    <>
      <Calendar />
      <Stars n={3} />
    </>
  ),
  woche: () => <Calendar marks={[0, 1, 2, 3, 4, 5, 6]} />,
  wochenende: () => <Calendar marks={[5, 6]} />,
  "alle-gruppen": () => (
    <>
      <Figure x={30} s={0.62} color="#E53935" />
      <Figure x={50} s={0.8} color={SUN} />
      <Figure x={71} s={1} color="#1E88E5" />
    </>
  ),
  ueberraschung: () => <Gift />,
  "alle-ueberraschungen": () => (
    <>
      <Gift x={36} y={56} s={0.62} />
      <Gift x={64} y={56} s={0.62} />
      <Gift x={50} y={36} s={0.62} />
    </>
  ),
  "alle-themen": () => (
    <g stroke={LINE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M57 57l14 14" fill="none" strokeWidth="7" />
      <circle cx="45" cy="45" r="17" fill="#fff" />
      <path d={starPath(45, 45, 9)} fill={SUN} strokeWidth="2" />
    </g>
  ),
};

/** One sticker; `earned: false` shows its grey silhouette. */
export function StickerArt({
  id,
  kind,
  earned = true,
  className = "size-full",
}: {
  id: string;
  kind: StickerKind;
  earned?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${className} ${earned ? "drop-shadow-[0_3px_0_rgba(0,0,0,0.18)]" : "opacity-35 grayscale"}`}
    >
      <path
        d={BADGE}
        fill={KIND_COLOR[kind]}
        stroke={earned ? "#fff" : LINE}
        strokeWidth="4"
        strokeDasharray={earned ? undefined : "6 5"}
      />
      {ART[id]?.()}
    </svg>
  );
}
