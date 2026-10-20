import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithPaint } from "./test/render.tsx";
import { Tray } from "./Tray.tsx";

const group = (name: string) => within(screen.getByRole("group", { name }));

describe("Tray", () => {
  it("offers ten colours and the two thick pens for ages 3–4", () => {
    renderWithPaint(<Tray />, "fisch");
    expect(group("Farbe").getAllByRole("button")).toHaveLength(10);
    expect(
      group("Stiftgröße")
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Dick", "Ganz dick"]);
  });

  it("offers all sixteen colours and four sizes for ages 7–8", () => {
    renderWithPaint(<Tray />, "roboter");
    expect(group("Farbe").getAllByRole("button")).toHaveLength(16);
    expect(group("Stiftgröße").getAllByRole("button")).toHaveLength(4);
  });

  it("labels every control in German and marks the current choice", () => {
    renderWithPaint(<Tray />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.getAttribute("aria-label")).toMatch(/^[A-ZÄÖÜ][a-zäöüß ]+$/);
    }
    expect(screen.getByRole("button", { name: "Stift" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Rot" })).toHaveAttribute("aria-pressed", "true");
  });

  it("dispatches the child's choices", async () => {
    const { dispatch } = renderWithPaint(<Tray />);
    await userEvent.click(screen.getByRole("button", { name: "Farbeimer" }));
    await userEvent.click(screen.getByRole("button", { name: "Hautfarbe braun" }));
    await userEvent.click(screen.getByRole("button", { name: "Ganz dick" }));
    expect(dispatch.mock.calls.map(([a]) => a)).toEqual([
      { type: "tool", tool: "fill" },
      { type: "color", color: "#C68642" },
      { type: "size", size: 52 },
    ]);
  });
});
