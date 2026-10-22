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

  it("mixes two colours into a slot and picks the mix", () => {
    let s = paintReducer(initialState(), { type: "tool", tool: "eraser" });
    s = paintReducer(s, { type: "mix", from: "#1E88E5", onto: "#FDD835" });
    expect(s.mixes).toHaveLength(1);
    expect(s.color).toBe(s.mixes[0]);
    expect(s.tool).toBe("pen");
  });

  it("keeps a mixed colour from five on, the youngest get the default", () => {
    let s = paintReducer(initialState(), { type: "mix", from: "#1E88E5", onto: "#FDD835" });
    const mixed = s.color;
    s = paintReducer(s, { type: "page", pageId: "roboter" });
    expect(s.color).toBe(mixed);
    s = paintReducer(s, { type: "page", pageId: "fisch" });
    expect(s.color).toBe("#E53935");
    expect(s.mixes).toEqual([mixed]);
  });

  it("restores the mixed colours, dropping anything odd", () => {
    const s = paintReducer(initialState(), {
      type: "restore",
      tool: "pen",
      color: "#74CE4B",
      size: 30,
      pageId: "drache",
      mixes: ["#74CE4B", "rot", "#C78140"],
    });
    expect(s.mixes).toEqual(["#74CE4B", "#C78140"]);
    expect(s.color).toBe("#74CE4B");
  });
});
