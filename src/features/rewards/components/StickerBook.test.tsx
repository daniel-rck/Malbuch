import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithPaint } from "../../paint/components/test/render.tsx";
import { STICKERS } from "../engine/stickers.ts";
import { StickerBook } from "./StickerBook.tsx";

describe("StickerBook", () => {
  it("shows every sticker, earned ones by their name and the rest as not yet done", () => {
    renderWithPaint(<StickerBook />, "drache", { earned: { "bild-1": "2026-10-21" } });
    expect(screen.getByRole("button", { name: "Erstes Bild fertig" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fünf Bilder fertig – noch nicht geschafft" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(STICKERS.length);
    expect(screen.getAllByRole("list").map((l) => l.getAttribute("aria-label"))).toEqual([
      "Bilder",
      "Stifte und Farben",
      "Maltage",
      "Entdecken",
    ]);
  });

  it("closes with the close button and with Escape", async () => {
    const { dispatchRewards } = renderWithPaint(<StickerBook />);
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    await userEvent.keyboard("{Escape}");
    expect(dispatchRewards.mock.calls.map(([a]) => a)).toEqual([
      { type: "book", open: false },
      { type: "book", open: false },
    ]);
  });
});
