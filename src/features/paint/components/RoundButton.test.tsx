import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HOLD_MS, RoundButton } from "./RoundButton.tsx";

function renderButton(props: { hold?: boolean; disabled?: boolean } = {}) {
  const onClick = vi.fn<() => void>();
  render(
    <RoundButton label="Alles wegmachen" onClick={onClick} {...props}>
      <span />
    </RoundButton>,
  );
  return { onClick, button: screen.getByRole("button", { name: "Alles wegmachen" }) };
}

// jsdom has no pointer capture.
beforeAll(() => {
  Object.defineProperty(Element.prototype, "hasPointerCapture", {
    configurable: true,
    value: () => false,
  });
  Object.defineProperty(Element.prototype, "releasePointerCapture", {
    configurable: true,
    value: () => {},
  });
});
afterAll(() => {
  Reflect.deleteProperty(Element.prototype, "hasPointerCapture");
  Reflect.deleteProperty(Element.prototype, "releasePointerCapture");
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("RoundButton", () => {
  it("fires on a tap without hold", () => {
    const { onClick, button } = renderButton();
    fireEvent.click(button, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("with hold, ignores a tap", () => {
    const { onClick, button } = renderButton({ hold: true });
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button, { detail: 1 });
    vi.advanceTimersByTime(2 * HOLD_MS);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("with hold, fires on release once the finger stayed long enough", () => {
    const { onClick, button } = renderButton({ hold: true });
    fireEvent.pointerDown(button);
    vi.advanceTimersByTime(HOLD_MS - 1);
    fireEvent.pointerUp(button);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.pointerDown(button);
    vi.advanceTimersByTime(HOLD_MS);
    // Not while held: the release is the gesture that may open the share sheet.
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.pointerUp(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.click(button, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("with hold, lets go when the finger slides off", () => {
    const { onClick, button } = renderButton({ hold: true });
    fireEvent.pointerDown(button);
    vi.advanceTimersByTime(2 * HOLD_MS);
    fireEvent.pointerLeave(button);
    fireEvent.pointerUp(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("with hold, frees the pointer from the icon a touch landed on", () => {
    const { button } = renderButton({ hold: true });
    const icon = button.querySelector("span");
    if (!icon) throw new Error("no icon");
    vi.spyOn(icon, "hasPointerCapture").mockReturnValue(true);
    const release = vi.spyOn(icon, "releasePointerCapture");
    fireEvent.pointerDown(icon, { pointerId: 3 });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("with hold, still fires at once for keyboards and screen readers", () => {
    const { onClick, button } = renderButton({ hold: true });
    fireEvent.click(button, { detail: 0 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("with hold, does nothing while disabled", () => {
    const { onClick, button } = renderButton({ hold: true, disabled: true });
    fireEvent.pointerDown(button);
    vi.advanceTimersByTime(2 * HOLD_MS);
    expect(onClick).not.toHaveBeenCalled();
  });
});
