import { describe, expect, it } from "vitest";
import { initialState, paintReducer } from "./state.ts";

describe("paintReducer", () => {
  it("starts on the first page with the pen", () => {
    const s = initialState();
    expect(s.pageId).toBe("drache");
    expect(s.tool).toBe("pen");
  });

  it("fits colour and size to the age group of a newly opened page", () => {
    let s = initialState();
    s = paintReducer(s, { type: "color", color: "#9E9E9E" }); // grey: not for 3–4
    s = paintReducer(s, { type: "size", size: 16 });
    s = paintReducer(s, { type: "page", pageId: "fisch" });
    expect(s.color).toBe("#E53935");
    expect(s.size).toBe(52);
    expect(s.pickerOpen).toBe(false);
  });

  it("keeps colour and size the new group offers too", () => {
    let s = paintReducer(initialState(), { type: "color", color: "#1E88E5" });
    s = paintReducer(s, { type: "size", size: 30 });
    s = paintReducer(s, { type: "page", pageId: "fisch" });
    expect(s).toMatchObject({ color: "#1E88E5", size: 30 });
  });

  it("hands the eraser back to the pen when a colour is picked", () => {
    let s = paintReducer(initialState(), { type: "tool", tool: "eraser" });
    s = paintReducer(s, { type: "color", color: "#FDD835" });
    expect(s.tool).toBe("pen");
    s = paintReducer(s, { type: "tool", tool: "fill" });
    s = paintReducer(s, { type: "color", color: "#E53935" });
    expect(s.tool).toBe("fill");
  });

  it("restores settings, ignoring a page or size that no longer exists", () => {
    const s = paintReducer(initialState(), {
      type: "restore",
      tool: "fill",
      color: "#8E24AA",
      size: 99,
      pageId: "gibt-es-nicht",
    });
    expect(s).toMatchObject({ tool: "fill", color: "#8E24AA", pageId: "drache", size: 30 });
  });
});
