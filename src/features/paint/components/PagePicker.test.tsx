import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PAGES } from "../../../pages/manifest.ts";
import { PagePicker } from "./PagePicker.tsx";
import { renderWithPaint } from "./test/render.tsx";

const pageNames = () =>
  within(screen.getByRole("tabpanel"))
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label"));

describe("PagePicker", () => {
  it("opens on the current page's age group, with the page marked", () => {
    renderWithPaint(<PagePicker thumbs={new Map()} onPick={() => {}} />, "drache");
    expect(screen.getByRole("tab", { name: "5 bis 6 Jahre" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "Drache" })).toHaveAttribute("aria-pressed", "true");
    expect(pageNames()).toEqual(PAGES.filter((p) => p.group === "mittel").map((p) => p.name));
  });

  it("shows another group's pages per tab and picks one", async () => {
    const onPick = vi.fn<(id: string) => void>();
    renderWithPaint(<PagePicker thumbs={new Map()} onPick={onPick} />);
    await userEvent.click(screen.getByRole("tab", { name: "7 bis 8 Jahre" }));
    expect(pageNames()).toContain("Roboter und Katze");
    await userEvent.click(screen.getByRole("button", { name: "Weltraum" }));
    expect(onPick).toHaveBeenCalledWith("weltraum");
  });

  it("closes with the close button and with Escape", async () => {
    const { dispatch } = renderWithPaint(<PagePicker thumbs={new Map()} onPick={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    await userEvent.keyboard("{Escape}");
    expect(dispatch.mock.calls.map(([a]) => a)).toEqual([
      { type: "picker", open: false },
      { type: "picker", open: false },
    ]);
  });
});
