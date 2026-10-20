/**
 * A darkness buffer from ASCII art, for engine tests: `#` is line (255),
 * anything else white (0).
 */
export function grid(rows: string[]): { darkness: Uint8Array; width: number; height: number } {
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  const darkness = new Uint8Array(width * height);
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) if (row[x] === "#") darkness[y * width + x] = 255;
  });
  return { darkness, width, height };
}
