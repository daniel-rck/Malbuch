import type { Page } from "../../../pages/manifest.ts";
import { artUrl } from "./thumbs.ts";

/** A page in miniature: what's painted so far, the line art multiplied on top. */
export function PageThumb({ page, thumb }: { page: Page; thumb: string | undefined }) {
  return (
    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-paper">
      {thumb && <img src={thumb} alt="" draggable={false} className="absolute inset-0 size-full" />}
      <img
        src={artUrl(page)}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full mix-blend-multiply"
      />
    </span>
  );
}
