# Spec: Malbuch

Status: lebend · Owner: Daniel

## 1. Ziel

Eine Ausmal-App, die sich für Kinder wie ein echtes Malbuch anfühlt, nur ohne Frust: Kinder
wählen Farbe und Stiftgröße, malen Comic-Figuren aus, und nichts läuft über die Linien.
Läuft offline als PWA auf dem Familien-Tablet.

**Zielgruppe:** Kinder ca. 4–8 Jahre, Bedienung ohne Lesen. Eltern nur für „Bild speichern".

## 2. Kernprinzipien

1. **Der Strich bleibt in seiner Fläche.** Die Fläche wird beim Pointerdown bestimmt; alles,
   was der Strich danach außerhalb berührt, wird nicht gemalt. Das ist das zentrale Feature.
2. **Keine Texte nötig.** Icons, Farbkleckse, Punktgrößen. Text nur in `aria-label`.
3. **Nichts geht verloren.** Jede Seite speichert sich automatisch; Löschen ist rückgängig machbar.
4. **Sofort reagieren.** Vom Finger-Aufsetzen bis zum ersten sichtbaren Pixel < 1 Frame.

## 3. Funktionsumfang

### MVP

| Feature | Verhalten |
|---|---|
| Seitenauswahl | Thumbnails oben; Wechsel speichert die aktuelle Seite |
| Stift | Freihand, geclippt auf die Startfläche (siehe §5.2) |
| Farbeimer | Tippen füllt die getroffene Fläche komplett |
| Radierer | Freihand, **nicht** geclippt, entfernt nur Farbe (nie Linien) |
| Größen | 4 Stufen: 8 / 16 / 30 / 52 px (Dokument-Koordinaten); Radierer ×1.4 |
| Farben | 16 Kleckse inkl. zwei Hauttöne, Weiß und Schwarz (Palette aus Prototyp) |
| Rückgängig | Unbegrenzt innerhalb der Seite, über Operation-Log (§5.4) |
| Alles löschen | Eine Operation im Log → rückgängig machbar |
| Autosave | Pro Seite in IndexedDB, nach jeder abgeschlossenen Operation (debounced) |
| Bild speichern | Gemaltes Bild + Linien als PNG; Web Share API, Fallback Download |
| PWA | Installierbar, vollständig offline, Fullscreen, kein Pinch-Zoom/Scroll-Bounce |

### Später (nicht im MVP)

Stempel/Sticker · Glitzer- und Regenbogenstift · Zeitraffer-Replay des Malprozesses
(fällt aus dem Op-Log fast gratis ab) · mehr Seiten/Seitenpakete · Elternbereich mit
Galerie.

## 4. Stack

- Vite + React 19 + TypeScript, Bun als Runtime/PM, Biome, `bun test`
- `vite-plugin-pwa` (Workbox, `generateSW`, alle Assets precached)
- `idb-keyval` für Persistenz
- Keine UI-Library, kein State-Management-Framework – `useReducer` + Context reichen.

## 5. Architektur

```
src/
  engine/            reines TS, kein DOM — vollständig unit-getestet
    regions.ts       labelRegions(), regionAt()
    mask.ts          buildMask() mit Dilation unter die Linien
    ops.ts           Operation-Typen, Reducer, Serialisierung
  render/            Canvas-Schicht
    layers.ts        Paint-, Live- und Linien-Canvas
    rasterize.ts     SVG → Linien-Alpha + Darkness-Buffer
    replay.ts        Ops abspielen, Checkpoints
  ui/                React
    App.tsx  PagePicker.tsx  Paper.tsx  Tray.tsx  icons.tsx
  pages/             Ausmalbilder
    manifest.ts      Liste {id, name, file}
    *.svg
  storage/
    db.ts            idb-keyval Wrapper, Schema-Version
  main.tsx
```

### 5.1 Koordinaten und Auflösung

- Dokument-Koordinaten fix **800 × 1000** (Hochformat 4:5). Alle Ops speichern Dokument-Koordinaten.
- Raster-Auflösung = Dokument × `RASTER_SCALE` (Default 1.5 → 1200 × 1500). Labels, Masken und
  Canvas arbeiten im Rasterraum. Skalierung passiert an genau einer Stelle (`render/`).
- Das Papier wird per JS in die verfügbare Fläche eingepasst (ResizeObserver), Seitenverhältnis fix.

### 5.2 Flächenerkennung und Masking

Algorithmus wie im Prototyp:

1. SVG auf weißen Offscreen-Canvas rastern → `darkness = 255 − Luminanz` pro Pixel.
2. Linien-Canvas: Farbe `#1E2238`, Alpha = `min(255, darkness × 1.25)`.
3. `labelRegions(darkness, w, h, threshold = 110)`: Pixel über Threshold = Linie (`-1`), der Rest
   per 4er-Nachbarschaft-Floodfill in Regionen (1…n) mit Bounding-Box pro Region.
   Iterativ mit eigenem Stack (`Int32Array`), keine Rekursion.
4. `regionAt(x, y)`: Startpunkt auf einer Linie → spiralförmig im Radius ≤ 18 px die nächste Region
   suchen. Keine gefunden → Strich ungeclippt.
5. `buildMask(regionId)`: Region + Linienpixel, die in ≤ `DILATE` Schritten (Default 9 bei Scale 1,
   skaliert mit `RASTER_SCALE`) über Linienpixel erreichbar sind. Nur innerhalb der
   Bounding-Box + Rand rechnen. Letzte Maske cachen.
6. Live-Strich auf Offscreen-Canvas, pro Frame `copy` + `destination-in` mit Maske auf den
   Live-Canvas; bei Pointerup auf den Paint-Canvas übernehmen.

Labels werden pro Seite einmal berechnet und mit Schema-Version in IndexedDB gecacht.

### 5.3 Eingabe

- Pointer Events, `touch-action: none`, ein aktiver Pointer (weitere Finger ignorieren – Handballen!).
- `getCoalescedEvents()` nutzen, Rendering per `requestAnimationFrame` gedrosselt.
- Stylus und Maus wie Finger behandeln. Kein Druck-Support im MVP.

### 5.4 Operation-Log (statt Bild-Snapshots)

```ts
type Op =
  | { t: "stroke"; color: string; size: number; region: number | null; pts: number[] }
  | { t: "erase"; size: number; pts: number[] }
  | { t: "fill"; color: string; region: number }
  | { t: "clear" };
```

- `pts` als flaches Array `[x0, y0, x1, y1, …]` in Dokument-Koordinaten, auf 0.5 gerundet.
- Undo = letzte Op entfernen und aus dem nächsten Checkpoint neu abspielen.
- Checkpoint (`ImageBitmap`) alle 25 Ops, max. 4 im Speicher. Kein Checkpoint wird persistiert.
- Persistiert werden: Op-Log + gerenderte PNG-Vorschau (für Thumbnails und schnellen Start).
- `region` wird beim Abspielen verwendet, nicht neu bestimmt → deterministisch.

### 5.5 Persistenz

IndexedDB via `idb-keyval`, Keys:
`page:<id>:ops` · `page:<id>:preview` · `labels:<id>:v<schema>` · `settings` (Farbe, Größe, Werkzeug, letzte Seite).
Schreibfehler (Quota) werden geschluckt und geloggt, die App läuft weiter.

## 6. Ausmalbilder-Konvention

Jedes Bild ist eine SVG-Datei mit `viewBox="0 0 800 1000"`:

- Alle Flächen geschlossen; Strichstärke 6–8, `stroke-linejoin="round"`, Strichfarbe dunkel.
- Formen mit `fill="#fff"`, in Malreihenfolge hinten → vorne; verdeckte Linien werden dadurch
  automatisch ausgeblendet. Offene Linien (Mund, Schnurrhaare) mit `fill="none"`.
- Kleinste sinnvolle Fläche ≥ ca. 20 × 20 px, sonst frustriert es beim Ausmalen.
- Text (Sprechblasen) als `<text>` mit `stroke="none"`, Systemschrift.
- Nur eigene Figuren – keine bekannten Charaktere, Marken, Logos.

Ein Check-Script (`bun run check:pages`) prüft viewBox, Strichstärke und verbotene Elemente
(`<image>`, externe Referenzen, `<script>`).

Startbestand: die drei Seiten aus dem Prototyp (Drache, Roboter und Katze, Weltraum-Comic).

## 7. Design

Wie im Prototyp: Himmelblau mit Punkteraster als Hintergrund, Ablage in tiefem Indigo, Farben als
unregelmäßige Kleckse, Auswahl = Sonnengelb + leichte Drehung. Papier immer weiß.
Light- und Dark-Mode über CSS-Variablen auf `:root`. Ab 760 px Breite im Querformat wandert die
Ablage nach rechts. `prefers-reduced-motion` respektieren. Safe-Area-Insets beachten.

## 8. Performance-Budgets (Mittelklasse-Tablet, Scale 1.5)

| Messpunkt | Budget |
|---|---|
| Labeling einer Seite (ohne Cache) | < 150 ms |
| Masken-Build einer Region | < 30 ms |
| Pointerdown → erstes Pixel (Maske gecacht) | < 16 ms |
| Undo bei 200 Ops | < 100 ms |

## 9. Akzeptanzkriterien MVP

- [ ] Strich, der im Drachenbauch beginnt und quer über das Bild gezogen wird, färbt nur den Bauch.
- [ ] Zwischen Farbe und Linie bleiben keine weißen Ritzen sichtbar.
- [ ] Ein zweiter Finger während des Malens erzeugt keinen Strich.
- [ ] Farbeimer auf eine Linie getippt füllt die nächstgelegene Fläche.
- [ ] Radierer entfernt Farbe, Linien bleiben unverändert.
- [ ] „Alles löschen" → „Rückgängig" stellt das Bild exakt wieder her.
- [ ] App neu laden / Seite wechseln → Bild ist unverändert da.
- [ ] Flugmodus: installierte App startet und funktioniert vollständig.
- [ ] Bild speichern liefert PNG mit Farbe und Linien.
- [ ] Alle Bedienelemente ≥ 48 px, alle mit deutschem `aria-label`.

## 10. Offene Fragen

- Altersfokus enger ziehen? (3–5 → weniger Farben, größere Flächen; 6–8 → mehr Details, Stempel)
- Seitenpakete später nachladbar oder alles im Bundle?

## 11. Entscheidungslog

- _2026-10-20_ — Op-Log statt ImageData-Snapshots für Undo (Speicher, Replay-Feature).
- _2026-10-20_ — Radierer bewusst ungeclippt: Kinder wollen „überall wegmachen" können.
