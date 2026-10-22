import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mixColors } from "../engine/mix.ts";
import { renderWithPaint } from "./test/render.tsx";
import { Tray } from "./Tray.tsx";
import { LIFT_MS } from "./useMixDrag.ts";

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

  it("offers mixed colours from five on, none for the youngest", () => {
    const { unmount } = renderWithPaint(<Tray />, "fisch", {}, { mixes: ["#74CE4B"] });
    expect(screen.queryByRole("button", { name: "Eigene Farbe" })).toBeNull();
    unmount();
    renderWithPaint(<Tray />, "drache", {}, { mixes: ["#74CE4B", "#C78140"] });
    expect(group("Farbe").getAllByRole("button")).toHaveLength(18);
    expect(screen.getAllByRole("button", { name: "Eigene Farbe" })).toHaveLength(2);
  });

  it("mixes a blob held and dragged onto another, and swallows the click after", () => {
    vi.useFakeTimers();
    try {
      const { dispatch, dispatchRewards } = renderWithPaint(<Tray />, "drache");
      const blue = screen.getByRole("button", { name: "Blau" });
      const yellow = screen.getByRole("button", { name: "Gelb" });
      document.elementFromPoint = () => yellow;
      const at = { pointerId: 3, pointerType: "touch", button: 0, clientX: 10, clientY: 10 };
      fireEvent.pointerDown(blue, at);
      act(() => vi.advanceTimersByTime(LIFT_MS));
      fireEvent.pointerMove(blue, { ...at, clientX: 80 });
      expect(yellow.className).toContain("scale-125");
      fireEvent.pointerUp(blue, { ...at, clientX: 80 });
      fireEvent.click(blue);
      expect(dispatch.mock.calls.map(([a]) => a)).toEqual([
        { type: "mix", from: "#1E88E5", onto: "#FDD835" },
      ]);
      expect(dispatchRewards).toHaveBeenCalledWith(
        expect.objectContaining({ type: "mixed", color: mixColors("#1E88E5", "#FDD835") }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a quick tap a pick, and a swipe before the lift no drag", () => {
    vi.useFakeTimers();
    try {
      const { dispatch } = renderWithPaint(<Tray />, "drache");
      const blue = screen.getByRole("button", { name: "Blau" });
      const at = { pointerId: 4, pointerType: "touch", button: 0, clientX: 10, clientY: 10 };
      fireEvent.pointerDown(blue, at);
      fireEvent.pointerMove(blue, { ...at, clientX: 40 });
      act(() => vi.advanceTimersByTime(LIFT_MS));
      fireEvent.pointerUp(blue, { ...at, clientX: 40 });
      fireEvent.click(blue);
      expect(dispatch.mock.calls.map(([a]) => a)).toEqual([{ type: "color", color: "#1E88E5" }]);
    } finally {
      vi.useRealTimers();
    }
  });
});
