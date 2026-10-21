import { useState } from "react";
import { useAppUpdate } from "../../../lib/pwa/useAppUpdate.ts";
import { pageById } from "../../../pages/manifest.ts";
import { picturePng } from "../render/png.ts";
import type { Session } from "../session.ts";
import { sharePicture } from "../share.ts";
import { usePaint } from "../state.ts";
import { ReloadIcon, SaveIcon, TrashIcon, UndoIcon } from "./icons.tsx";
import { PageThumb } from "./PageThumb.tsx";
import { RoundButton } from "./RoundButton.tsx";
import { useCanvasState } from "./useCanvasState.ts";

export function TopBar({
  session,
  thumbs,
}: {
  session: Session | null;
  thumbs: Map<string, string>;
}) {
  const { state, dispatch } = usePaint();
  const { canUndo, canClear } = useCanvasState(session?.canvas ?? null);
  const update = useAppUpdate();
  const [saving, setSaving] = useState(false);
  const page = pageById(state.pageId);

  const openPicker = () => {
    // The picture book shows thumbnails: bring this page's up to date first.
    void session?.autosave.flush();
    dispatch({ type: "picker", open: true });
  };

  const save = async () => {
    if (!session || saving) return;
    setSaving(true);
    try {
      const png = await picturePng(session.paint, session.page.svg);
      await sharePicture(png, `malbuch-${session.page.id}.png`, session.page.name);
    } catch (error) {
      console.error("Malbuch: could not save the picture", error);
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    await session?.autosave.flush();
    update.reload();
  };

  return (
    <header className="flex items-center justify-between gap-3 px-3.5 pt-2.5 pb-1 compact:gap-2 compact:px-2.5 compact:pt-1.5 wide:col-start-1 wide:row-start-1 wide:compact:col-start-2 wide:compact:pt-2">
      <button
        type="button"
        aria-label={page ? `Bild wählen, jetzt: ${page.name}` : "Bild wählen"}
        onClick={openPicker}
        className="w-[56px] shrink-0 -rotate-3 compact:w-12 cursor-pointer overflow-hidden rounded-xl border-[3px] border-sun bg-paper p-0 shadow-[0_4px_0_var(--color-shade)] transition-transform active:translate-y-0.5"
      >
        {page && <PageThumb page={page} thumb={thumbs.get(page.id)} />}
      </button>
      {/* Clearing sits apart from Undo, and it and saving need a held finger (spec §3). */}
      <div className="flex gap-6 compact:gap-4">
        <div className="flex gap-2.5 compact:gap-2">
          {update.needRefresh && (
            <RoundButton label="Neue Version laden" onClick={() => void reload()}>
              <ReloadIcon />
            </RoundButton>
          )}
          <RoundButton
            label="Rückgängig"
            disabled={!canUndo}
            onClick={() => session?.canvas.undo()}
          >
            <UndoIcon />
          </RoundButton>
          <RoundButton
            label="Bild speichern"
            hold
            disabled={!session || saving}
            onClick={() => void save()}
          >
            <SaveIcon />
          </RoundButton>
        </div>
        <RoundButton
          label="Alles wegmachen"
          hold
          disabled={!canClear}
          onClick={() => session?.canvas.clear()}
        >
          <TrashIcon />
        </RoundButton>
      </div>
    </header>
  );
}
