// `bun run check:pages`: every page in src/pages/meta.ts has its SVG, every SVG
// is listed, and each follows the drawing convention of its age group.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkManifest, checkSvg } from "../src/pages/check.ts";
import { AGE_GROUPS } from "../src/pages/groups.ts";
import { PAGE_META } from "../src/pages/meta.ts";

const root = join(import.meta.dirname, "../src/pages");
const files = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(join(root, d.name))
      .filter((f) => f.endsWith(".svg"))
      .map((f) => `./${d.name}/${f}`),
  );

const problems = checkManifest(PAGE_META, files, AGE_GROUPS);
for (const page of PAGE_META) {
  const group = AGE_GROUPS.find((g) => g.id === page.group);
  const path = `./${page.group}/${page.id}.svg`;
  if (!group || !files.includes(path)) continue;
  for (const p of checkSvg(readFileSync(join(root, path), "utf8"), group)) {
    problems.push(`${path}: ${p}`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}
console.log(`✓ ${PAGE_META.length} pages follow the convention.`);
