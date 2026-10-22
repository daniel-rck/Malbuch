import { useEffect, useRef, useState } from "react";
import { useInstallPrompt } from "../../../lib/ui/useInstallPrompt.ts";
import { AddHomeIcon, CloseIcon, InstallIcon, ShareIcon } from "./icons.tsx";
import { RoundButton } from "./RoundButton.tsx";

/**
 * "App installieren" (spec §3): only while the browser offers to install, or
 * on iPhone/iPad, which never does — there it shows the two Safari steps as
 * icons. Gone once the app runs installed. Like saving, it needs a held finger:
 * installing is for the grown-ups.
 */
export function InstallButton() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [howTo, setHowTo] = useState(false);
  if (isStandalone || (!canInstall && !isIOS)) return null;
  return (
    <>
      <RoundButton
        label="App installieren"
        hold
        onClick={() => (canInstall ? void promptInstall() : setHowTo(true))}
      >
        <InstallIcon />
      </RoundButton>
      {howTo && <HowTo onClose={() => setHowTo(false)} />}
    </>
  );
}

/** Safari's steps without words: share, then "add to home screen". */
function HowTo({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const step = "grid size-20 place-items-center rounded-3xl bg-paper text-tray [&_svg]:size-12";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Installieren: in Safari auf Teilen tippen, dann Zum Home-Bildschirm wählen"
      className="fixed inset-0 z-20 grid place-items-center bg-tray/60 p-4"
    >
      <div className="relative flex items-center gap-4 rounded-[28px] bg-tray px-6 pt-10 pb-6 text-on-tray shadow-[0_6px_0_var(--color-shade)]">
        <span className={step}>
          <ShareIcon />
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10">
          <path
            d="M3 12h16M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={step}>
          <AddHomeIcon />
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="Schließen"
          onClick={onClose}
          className="absolute -top-4 -right-4 grid size-12 cursor-pointer place-items-center rounded-full bg-sun text-tray shadow-[0_4px_0_var(--color-shade)]"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
