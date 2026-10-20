import { describe, expect, it } from "vitest";
import { decodeRuns, encodeRuns } from "./rle.ts";

describe("run-length coding", () => {
  it("round-trips", () => {
    const values = Int32Array.from([1, 1, 1, -1, -1, 2, 1, 1, 3]);
    const runs = encodeRuns(values);
    expect([...runs]).toEqual([1, 3, -1, 2, 2, 1, 1, 2, 3, 1]);
    expect(decodeRuns(runs, values.length)).toEqual(values);
  });

  it("handles an empty buffer", () => {
    expect(decodeRuns(encodeRuns(new Int32Array(0)), 0)).toEqual(new Int32Array(0));
  });

  it("rejects data of the wrong length", () => {
    expect(() => decodeRuns(Int32Array.from([1, 3]), 4)).toThrow(/covers 3 of 4/);
  });
});
