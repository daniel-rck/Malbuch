# Plan

Phasen für `.claude/commands/phase.md`: die erste Phase mit offenen Checkboxen umsetzen, Gate
laufen lassen, abhaken, mit dem angegebenen Commit committen. Spec: `docs/specs/malbuch.md`.

**Standard-Gate:** `bun run lint && bun run typecheck && bun run test && bun run check:pages && bun run build`
und `bunx github:daniel-rck/web-base#v0.6.0 check --strict`.

## Phase 1 — Gerüst auf web-base ✓

- [x] Vertauschte Dateien an ihren Platz (Spec, Prototyp, Phasen-Prompt)
- [x] `web-base init --name malbuch`, Seams: Manifest (Fullscreen), Viewport, Router mit einer Route, `App.tsx` ohne Shell, `main.tsx` ohne `UpdatePrompt`
- [x] Theme-Seam mit der Prototyp-Palette (hell/dunkel), App-Icon, CI + Dependabot

Gate: Standard · Commit: `chore: scaffold the app with web-base init`

## Phase 2 — Engine ✓

- [x] `labelRegions`/`regionAt` mit Splitter-Regel, `buildMask` als BFS (bit-gleich zum Prototyp)
- [x] Op-Typen, Rundung, Digest, `planReplay`, Ein-Pointer-Regel, RLE — alles getestet

Gate: `bun run test` · Commit: `feat: the paint MVP on web-base` (zusammen mit 3–5)

## Phase 3 — Render und Eingabe ✓

- [x] Gemeinsame Zeichen-Primitive für live und Replay, SVG-Overlay für die Linien
- [x] Pointer-Eingabe (coalesced, rAF), Stift schlägt Touch, Werkzeug beim Pointerdown eingefroren

## Phase 4 — Undo und Persistenz ✓

- [x] Checkpoints (25/4), gepinnter Clear, überdeckte Ops übersprungen, Nachbau im Leerlauf
- [x] IndexedDB: Ops, Vorschau mit Digest, Labels nach SVG-Hash, Settings; Quota-Fehler geschluckt

## Phase 5 — Oberfläche und Altersgruppen ✓

- [x] Bilderbuch mit drei Alters-Reitern, Ablage folgt der Gruppe, Top-Bar mit Undo/Löschen/Speichern/Update-Icon
- [x] Export als PNG (Web Share, Download-Fallback)

## Phase 6 — Ausmalbilder ✓

- [x] Prototyp-Bilder als SVG, Seiten-Check (`check:pages` + Test), `/dev/seiten`
- [x] 18 neue Bilder, 6 je Altersgruppe, alle ohne Lecks und über der Mindestgröße

Gate: Standard + `/dev/seiten` · Commit: `feat(pages): 18 new colouring pages in three age groups`

## Phase 7 — Überraschungsbilder und Sticker ✓

- [x] Fortschritt als reines TS (`features/rewards/engine/`): Maltage, Flächenanteil, Sticker-Katalog, Tests
- [x] Store `progress` (DB v3) mit Migrationstest; Nachholen aus den Op-Logs
- [x] Bilderbuch: Geschenk-Kacheln, Glitzer für frisch Ausgepacktes; Stickerheft; Feier mit Konfetti und Melodie
- [x] 21 Überraschungsbilder (7 Maltage × 3 Gruppen), alle ohne Lecks und über der Mindestgröße

Gate: Standard + `/dev/seiten` + Durchlauf in Chromium (Malen → Auspacken → Sticker, nächster Tag, Neuladen, reduzierte Bewegung) · Commit: `feat: surprise pages unlocked by painting days, and stickers`

## Phase 8 — Prüfung auf echten Geräten

- [ ] Deploy einrichten (Cloudflare Workers Builds, Repo `daniel-rck/Malbuch`, Worker `malbuch`)
- [ ] Auf dem Familien-Tablet installieren; Flugmodus: startet und malt
- [ ] Keine weißen Ritzen zwischen Farbe und Linie (Spec §9)
- [ ] Budgets aus Spec §8 auf dem Tablet messen (Labeling, Maske, erstes Pixel, Undo bei 200 Ops)
- [ ] „Bild speichern" auf iPad/Android: Teilen-Dialog, Speichern in Fotos
- [ ] Mit Kindern ausprobieren: Gruppen-Icons verständlich? Bilder passend zum Alter?
- [ ] Mit Kindern: Geschenke und Sticker verstanden? Melodie zu laut / nervig?

Gate: Spec §9 vollständig abgehakt · Commit: `docs: acceptance on the family tablet`

## Phase 9 — Saisonbilder ✓

- [x] Saison-Engine (reines TS): Zeiträume, Ostern, Schlüssel je Saison und Jahr — getestet
- [x] Saisonbilder als eigene Chunks (`loadSeasons`), nur in der Saison im Bilderbuch, vorn mit Abzeichen; Ankunft mit der Auspack-Feier
- [x] Seiten-Check, `/dev/seiten` und Gruppen-Sticker kennen Saisonbilder
- [x] 12 Saisonbilder (4 Saisons × 3 Gruppen), alle ohne Lecks und über der Mindestgröße

Gate: Standard + `/dev/seiten` + Durchlauf in Chromium (Datum in und außerhalb der Saisons, Neuladen) · Commit: `feat: season pages that come with their season`
