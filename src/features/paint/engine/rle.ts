// Run-length coding for the label cache: regions are large and contiguous, so
// a 1200×1500 label buffer (7.2 MB) shrinks to a few dozen kB.

/** Encode as [value, runLength, value, runLength, …]. */
export function encodeRuns(values: Int32Array): Int32Array {
  const runs: number[] = [];
  let i = 0;
  while (i < values.length) {
    const v = values[i] ?? 0;
    let j = i + 1;
    while (j < values.length && values[j] === v) j++;
    runs.push(v, j - i);
    i = j;
  }
  return Int32Array.from(runs);
}

export function decodeRuns(runs: Int32Array, length: number): Int32Array {
  const out = new Int32Array(length);
  let at = 0;
  for (let r = 0; r + 1 < runs.length; r += 2) {
    const n = runs[r + 1] ?? 0;
    out.fill(runs[r] ?? 0, at, at + n);
    at += n;
  }
  if (at !== length) throw new Error(`Run-length data covers ${at} of ${length} values`);
  return out;
}
