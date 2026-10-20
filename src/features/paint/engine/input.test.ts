import { describe, expect, it } from "vitest";
import { decidePointerDown, isActivePointer } from "./input.ts";

describe("the one-pointer rule", () => {
  it("starts with the first pointer", () => {
    expect(decidePointerDown(null, 1, "touch")).toBe("start");
  });

  it("ignores a second finger while one paints", () => {
    expect(decidePointerDown({ id: 1, kind: "touch" }, 2, "touch")).toBe("ignore");
    expect(decidePointerDown({ id: 1, kind: "pen" }, 2, "touch")).toBe("ignore");
    expect(decidePointerDown({ id: 1, kind: "mouse" }, 2, "pen")).toBe("ignore");
  });

  it("lets a pen take over from a touch that came first (the palm)", () => {
    expect(decidePointerDown({ id: 1, kind: "touch" }, 2, "pen")).toBe("replace");
  });

  it("only follows the active pointer", () => {
    expect(isActivePointer({ id: 1, kind: "touch" }, 1)).toBe(true);
    expect(isActivePointer({ id: 1, kind: "touch" }, 2)).toBe(false);
    expect(isActivePointer(null, 1)).toBe(false);
  });
});
