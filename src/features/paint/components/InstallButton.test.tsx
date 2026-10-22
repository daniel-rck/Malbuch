import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallButton } from "./InstallButton.tsx";

/** What Chrome hands the page when it would install it. */
function offerInstall() {
  const prompt = vi.fn<() => Promise<void>>(async () => {});
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
}

const userAgent = navigator.userAgent;
afterEach(() => {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: userAgent });
});

describe("InstallButton", () => {
  it("is not there while the browser offers no install", () => {
    render(<InstallButton />);
    expect(screen.queryByRole("button", { name: "App installieren" })).toBeNull();
  });

  it("asks the browser to install once it offers to", async () => {
    render(<InstallButton />);
    const prompt = offerInstall();
    // A click without a pointer (keyboard) fires a hold button at once.
    fireEvent.click(screen.getByRole("button", { name: "App installieren" }), { detail: 0 });
    await act(async () => {});
    expect(prompt).toHaveBeenCalledTimes(1);
    // The offer is used up.
    expect(screen.queryByRole("button", { name: "App installieren" })).toBeNull();
  });

  it("shows the Safari steps on iPhone and iPad", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    render(<InstallButton />);
    fireEvent.click(screen.getByRole("button", { name: "App installieren" }), { detail: 0 });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
