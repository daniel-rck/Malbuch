# Spec: Malbuch

Status: lebend · Owner: Daniel · Basis: [web-base](https://github.com/daniel-rck/web-base) 0.6.0
(Stempel `webBase` in `package.json`)

## 1. Ziel

Eine Ausmal-App, die sich für Kinder wie ein echtes Malbuch anfühlt, nur ohne Frust: Kinder
wählen Farbe und Stiftgröße, malen Comic-Figuren aus, und nichts läuft über die Linien.
Läuft offline als PWA auf dem Familien-Tablet.

**Zielgruppe:** Kinder ca. 3–8 Jahre in drei Altersgruppen (§3.1), Bedienung ohne Lesen.
Eltern nur für „Bild speichern".

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
| Bilderbuch | Knopf oben links (aktuelles Bild); öffnet Vollbild-Übersicht mit 3 Alters-Reitern und großen Vorschaubildern inkl. Gemaltem; Wechsel speichert die aktuelle Seite; die Zurück-Taste (Android) schließt es |
| Stift | Freihand, geclippt auf die Startfläche (siehe §5.2) |
| Farbeimer | Tippen füllt die getroffene Fläche komplett (auf einer Linie: die nächste Fläche) |
| Radierer | Freihand, **nicht** geclippt, entfernt nur Farbe (nie Linien) |
| Größen | 8 / 16 / 30 / 52 px (Dokument-Koordinaten), je nach Altersgruppe (§3.1); Radierer ×1.4 |
| Farben | 16 Kleckse inkl. zwei Hauttöne, Weiß und Schwarz; je nach Altersgruppe (§3.1) |
| Rückgängig | Unbegrenzt innerhalb der Seite, über Operation-Log (§5.4) |
| Alles löschen | Eine Operation im Log → rückgängig machbar, stellt exakt wieder her. Nur durch **Gedrückthalten** (0,7 s, ein sonnengelber Ring füllt sich), dann Loslassen — erst das Loslassen löst aus (bei Touch ist es die Nutzergeste, die das Teilen-Menü braucht); mit Abstand zu Rückgängig: ein Fehltipp löscht nichts. Tastatur/Screenreader lösen sofort aus |
| Autosave | Pro Seite in IndexedDB: Op-Log nach jeder Operation, Vorschau nach Pause/Wechsel (§5.5) |
| Bild speichern | Gemaltes Bild + Linien als PNG (1200 × 1500); Web Share API, Fallback Download. Ebenfalls Gedrückthalten — das Teilen-Menü ist Sache der Eltern |
| Neue Version | Nur wenn eine wartet: Icon „Neu laden" oben (kein Text-Toast) |
| Überraschungsbilder | Jeder Maltag packt neue Bilder aus (§3.2); noch verpackte sind Geschenke im Bilderbuch |
| Stickerheft | Stern-Knopf neben dem Bilderbuch; gewonnene Sticker mit Konfetti und kurzer Melodie (§3.3) |
| Saisonbilder | Ostern, Sommer, Halloween, Weihnachten: je Gruppe ein Bild, nur während der Saison im Bilderbuch (§3.4) |
| PWA | Installierbar, vollständig offline, Fullscreen, kein Pinch-Zoom/Scroll-Bounce |

### 3.1 Altersgruppen

Die Gruppe bestimmt, welche Bilder zusammen im Bilderbuch stehen, und was die Ablage anbietet.
**Die Ablage folgt der Gruppe des geöffneten Bildes** — kein eigener Schalter, kein verstecktes
Profil. Passt die gewählte Farbe/Größe nicht zur Gruppe, gilt der Gruppen-Default.
Quelle: `src/pages/groups.ts`.

| Gruppe | Reiter-Icon | Farben | Größen | Default |
|---|---|---|---|---|
| `klein` · 3–4 Jahre | kleine Figur | 10 (Rot, Orange, Gelb, Grün, Blau, Lila, Rosa, beide Hauttöne, Braun) | 30 / 52 | 52 |
| `mittel` · 5–6 Jahre | mittlere Figur | alle 16 | 16 / 30 / 52 | 30 |
| `gross` · 7–8 Jahre | große Figur | alle 16 | 8 / 16 / 30 / 52 | 16 |

### 3.2 Überraschungsbilder

21 der 42 Bilder sind am Anfang verpackt: je Altersgruppe eins pro **Maltag** 1–7
(`unlockDay` in `src/pages/meta.ts`). Ein Maltag ist ein Kalendertag (lokal), an dem das Kind
Farbe aufs Papier bringt (Strich oder Farbeimer); Seite öffnen, Rückgängig oder Radieren zählen
nicht. Nach dem n-ten Maltag sind die Bilder der Tage 1…n offen — gezählt werden Maltage, nicht
Kalendertage, eine Woche Pause kostet also nichts. Der allererste Strich packt Tag 1 sofort aus.

- Verpackt: Geschenk-Kachel mit einem Punkt je nötigem Maltag (gefüllt = geschafft); Tippen
  lässt sie wackeln, öffnet aber nichts.
- Frisch ausgepackt: Glitzer am Bild, am Alters-Reiter und am Bilderbuch-Knopf, bis das Bild
  einmal geöffnet war.
- Beim Auspacken: Geschenk + die neuen Bilder springen in die Mitte und fliegen zum Bilderbuch.

### 3.3 Sticker

22 Sticker in vier Reihen (`src/features/rewards/engine/stickers.ts`), jeder ein Bild ohne
Text; Stufen einer Serie zeigen goldene Sterne:

| Reihe | Sticker |
|---|---|
| Bilder | 1 / 5 / 10 / 25 Bilder fertig · ein Bild ganz ausgemalt · alle Bilder einer Altersgruppe (×3, ohne Saisonbilder) |
| Stifte und Farben | Stift, Farbeimer und Radierer ausprobiert · ein Bild nur mit dem Stift · 8 Farben in einem Bild · alle 16 Farben |
| Maltage | 3 / 7 / 14 Maltage · an jedem Wochentag · Samstag und Sonntag |
| Entdecken | alle drei Altersgruppen · ein Überraschungsbild gemalt · alle Überraschungen ausgepackt · aus jeder Überraschung eins |

- **Fertig** = ≥ 75 % der Flächen haben Farbe (Farbeimer oder ein in die Fläche geclippter
  Strich seit dem letzten „Alles löschen"); **ganz ausgemalt** = 100 %. Der Radierer zählt nicht
  (er ist nicht an Flächen gebunden). Gemerkt wird der beste Stand: Rückgängig nimmt nichts weg.
- Ein Sticker bleibt für immer. Neue tragen Glitzer am Stickerheft-Knopf und im Heft, bis das
  Heft wieder zugeht.
- Im Heft: gewonnene bunt (Tippen: wackeln + Melodie), offene als graue Umrisse mit Punkten
  (≤ 7 Schritte) oder Balken für den Fortschritt.
- **Feier:** kurze Melodie (WebAudio-Dreiklang, keine Audiodatei), der Sticker springt groß ins
  Bild, Konfetti, dann fliegt er zum Knopf (≈ 2,3 s). Mehrere nacheinander. Die Feier nimmt
  keine Eingaben — weitermalen geht. Mit `prefers-reduced-motion`: kein Konfetti, kein Flug.
  Der Ton lässt sich nicht abschalten, solange es keinen Elternbereich gibt.

### 3.4 Saisonbilder

12 Bilder gehören zu einer Jahreszeit: je Altersgruppe eins pro Saison (`season` in
`src/pages/meta.ts`, Engine `src/features/rewards/engine/seasons.ts`). Sie stehen **nur
während ihrer Saison** im Bilderbuch, vorn in ihrer Gruppe, mit dem Saison-Abzeichen (Ei,
Sonne, Kürbis, Tannenbaum) unten links. Danach sind sie weg; Gemaltes bleibt gespeichert und ist
in der nächsten Saison wieder da. Ein noch offenes Saisonbild nach der Saison: es bleibt offen,
erst der nächste Start öffnet das erste Bild.

| Saison | Zeitraum (lokal, inklusive) | 3–4 | 5–6 | 7–8 |
|---|---|---|---|---|
| Ostern | Ostersonntag − 14 Tage … + 7 Tage | Osterhase | Osterkorb | Eiersuche (Wimmelbild) |
| Sommer | 21.6.–31.8. | Krabbe am Strand | Sandburg | Freibad |
| Halloween | 15.10.–7.11. | Kürbis | Gespenst und Kürbisse | Kürbisfest-Comic |
| Weihnachten | 1.12.–6.1. | Tannenbaum | Rentier mit Schlitten | Weihnachtsmarkt |

- Geprüft wird beim Start und wenn die App wieder sichtbar wird (`visibilitychange`).
- **Ankunft:** beim ersten Start in einer Saison die Auspack-Feier (§3.2) mit den Saisonbildern,
  einmal pro Saison und Jahr (`progress.seasons`, Schlüssel `2026-halloween`; Weihnachten im
  Januar gehört zum Vorjahr). Glitzer, bis das Bild einmal geöffnet war.
- **Nachladen:** Saisonbilder sind eigene JS-Chunks (nicht-eager `import.meta.glob`), geladen
  nur für die laufende Saison. Der Service Worker precacht alle Chunks → auch offline da.
- Saisonbilder zählen als Bilder (Fertig-Sticker), aber nicht zu „alle Bilder einer
  Altersgruppe" — die wären sonst erst nach einem Jahr zu schaffen.

### Später (nicht im MVP)

Stempel · Glitzer- und Regenbogenstift · Zeitraffer-Replay des Malprozesses
(fällt aus dem Op-Log fast gratis ab) · Elternbereich mit Galerie.

## 4. Stack

Malbuch ist mit `web-base init` entstanden und folgt deren Konventionen
(`web-base/docs/specs/07-conventions.md`); Abweichungen stehen in
`web-base/docs/specs/08-app-migrations.md` („Malbuch — text-free kids' paint surface").

- Vite 8 + React 19 + TypeScript 7 (strict, `noUncheckedIndexedAccess`), Tailwind 4, Bun
- oxlint + oxfmt, Vitest (jsdom) — `bun run lint`, `typecheck`, `test`, `check:pages`
- `vite-plugin-pwa` mit `injectManifest` und `registerType: "prompt"` (`src/sw/`), Manifest
  `display: "fullscreen"`
- IndexedDB über `idb` und den web-base-Opener (`src/lib/db/`)
- react-router mit einer Route; im Dev-Build zusätzlich `/dev/seiten` (§6)
- Kein State-Management-Framework — `useReducer` + Context reichen. Die web-base-Shell
  (`AppShell`, `AppNav`, `PageHeader`, `ThemeToggle`, `UpdatePrompt`, …) ist nur für
  `web-base check --strict` installiert und wird nicht verwendet: sie zeigt Text.

## 5. Architektur

```
src/
  features/paint/
    engine/          reines TS, kein DOM — vollständig unit-getestet
      regions.ts     labelRegions(), regionAt()
      mask.ts        buildMask(): Fläche + Linien bis DILATE Schritte (BFS)
      ops.ts         Operation-Typen, Rundung, Digest
      replay-plan.ts planReplay(): Startzustand + abzuspielende Ops
      input.ts       Ein-Pointer-Regel
      rle.ts hash.ts stats.ts
    render/          Canvas-Schicht (einzige Stelle mit RASTER_SCALE)
      page-canvas.ts eine offene Seite: Op-Log, Live-Strich, Undo, Checkpoints
      draw.ts        Zeichen-Primitive für live und Replay
      masks.ts       Masken-Cache  rasterize.ts  png.ts  canvas.ts
    components/      TopBar, Paper, Tray, PagePicker, PageThumb, icons
    PaintPage.tsx    state.ts  db.ts  load.ts  autosave.ts  share.ts  config.ts
  features/rewards/  Überraschungsbilder und Sticker (§3.2–3.3)
    engine/          reines TS: unlock.ts, progress.ts (Fortschritt, Flächenanteil), stickers.ts,
                     seasons.ts (Saison-Zeiträume, Ostern)
    components/      StickerBook, Celebration, StickerArt
    state.ts  db.ts  tracking.ts (folgt dem Op-Log der offenen Seite)  sound.ts
  features/dev/      /dev/seiten (nur Dev-Build)
  pages/             Ausmalbilder
    meta.ts          Liste {id, name, group, unlockDay?, season?}
    groups.ts        Altersgruppen
    manifest.ts      Seiten mit SVG-Text (?raw); Saisonbilder nachgeladen (loadSeasons)
    check.ts         Seiten-Konvention als Prüfung
    klein/ mittel/ gross/  *.svg
    saison/<saison>/       *.svg
  lib/               web-base (db/, ui/, pwa/, routing/, router.tsx, routes.ts)
scripts/check-pages.ts
```

### 5.1 Koordinaten und Auflösung

- Dokument-Koordinaten fix **800 × 1000** (Hochformat 4:5). Alle Ops speichern Dokument-Koordinaten.
- Raster-Auflösung = Dokument × `RASTER_SCALE` (1.5 → 1200 × 1500). Labels, Masken und
  Canvas arbeiten im Rasterraum. Skalierung passiert nur in `render/`.
- Das Papier wird per JS in die verfügbare Fläche eingepasst (ResizeObserver); innerhalb des
  Rahmens exakt 4:5, Eingabe-Koordinaten beziehen sich auf die Canvas-Box (nicht den Rahmen).

### 5.2 Flächenerkennung und Masking

Algorithmus aus dem Prototyp (`docs/reference/prototype.html`), mit diesen Änderungen:

1. SVG (mit `width/height` = Rastergröße) auf weißen Canvas rastern →
   `darkness = 255 − Luminanz` pro Pixel.
2. **Linien als SVG-Overlay** über den Canvases (`mix-blend-mode: multiply`) statt Linien-Canvas:
   bleibt bei jeder Pixeldichte scharf. Der Export zeichnet das SVG genauso mit `multiply`.
3. `labelRegions(darkness, w, h, threshold = 110)`: Pixel über Threshold = Linie (`-1`), der Rest
   per 4er-Nachbarschaft-Floodfill in Regionen (1…n) mit Bounding-Box und Fläche.
   Iterativ mit eigenem Stack (`Int32Array`). **Splitter** unter 150 Dok-px² (Augenlichter,
   Buchstaben-Innenräume, Antialiasing-Löcher) werden Linie — sonst landet ein Strich darin und
   malt unsichtbar. Gezeichnete Formen müssen deshalb größer sein (§6).
4. `regionAt(x, y)`: Startpunkt auf einer Linie → in quadratischen Ringen im Radius ≤ 27 Raster-px
   (18 @ Scale 1) die nächste Region suchen. Keine gefunden → Strich ungeclippt.
5. `buildMask(regionId)`: Region + Linienpixel, die in ≤ `DILATE` Schritten (9 @ Scale 1 → 14)
   über Linienpixel erreichbar sind — als Breitensuche, bit-gleich zur Prototyp-Schleife (Test),
   aber nur Box-Scan + nahe Linienpixel. Masken als Canvases in Box-Größe, Cache nach
   Gesamtfläche (6 MP).
6. Live-Strich auf Offscreen-Canvas, pro Frame `copy` + `destination-in` mit Maske auf den
   Live-Canvas — mit Clip-Rect auf Strich-Box ∩ Masken-Box; bei Pointerup auf den Paint-Canvas.

Labels werden pro Seite einmal berechnet und in IndexedDB gecacht (§5.5).

### 5.3 Eingabe

- Pointer Events (native Listener), `touch-action: none`, ein aktiver Pointer; weitere Finger
  werden ignoriert (Handballen!). Ausnahme: ein **Stift** übernimmt von einem Touch, der zuerst
  da war (Handballen vor dem Stift); ein abgebrochener Radierer-Strich bleibt als Op erhalten.
- Werkzeug, Farbe und Größe werden beim Pointerdown für den ganzen Strich eingefroren.
- `getCoalescedEvents()` mit Feature-Detection (leer → `[e]`, nur `clientX/Y` lesen — iOS 18.2),
  Punkte im Handler auf 0.5 gerundet, Duplikate verworfen; Rendering per `requestAnimationFrame`.
- `pointercancel` und `lostpointercapture` beenden den Strich wie `pointerup`.
- Rückgängig, Löschen und Seitenwechsel greifen nicht, solange ein Pointer unten ist.
- Stylus und Maus wie Finger. Kein Druck-Support im MVP.

### 5.4 Operation-Log (statt Bild-Snapshots)

```ts
type Op =
  | { t: "stroke"; color: string; size: number; region: number | null; pts: number[] }
  | { t: "erase"; size: number; pts: number[] }
  | { t: "fill"; color: string; region: number }
  | { t: "clear" };
```

- `pts` als flaches Array `[x0, y0, x1, y1, …]` in Dokument-Koordinaten, auf 0.5 gerundet.
  Live und Replay zeichnen **dieselben** Segmente mit denselben Funktionen (`render/draw.ts`)
  auf denselben Canvases → Undo und „Alles löschen → Rückgängig" sind pixelgleich.
- Undo = letzte Op entfernen und vom spätesten bekannten Zustand ≤ Ziel neu abspielen:
  Basisbild bei 0, leere Seite nach jedem `clear`, Checkpoints, die vor dem letzten `clear`
  gepinnte Malschicht. Ops, die ein späteres Füllen derselben Region komplett übermalt, werden
  übersprungen (exakt: Masken binär, Farben deckend).
- Checkpoints: Canvas-Kopien alle 25 Ops, die 4 höchsten bleiben. Ein Replay legt die
  Checkpoints, die es überquert, wieder an. Nach dem Laden aus einem Snapshot werden die
  fehlenden im Leerlauf nachgebaut. Kein Checkpoint wird persistiert.
- `clear` auf leerer Seite ist keine Op (Knopf deaktiviert).
- `region` wird beim Abspielen verwendet, nicht neu bestimmt → deterministisch.

### 5.5 Persistenz

IndexedDB `malbuch` (`src/lib/db/db.ts`), Bilder als PNG-`ArrayBuffer`:

| Store | Inhalt | geschrieben |
|---|---|---|
| `ops` | `{ id, labelsKey, ops, base? }` | 400 ms nach jeder Op |
| `previews` | `{ id, labelsKey, png, opCount, digest }`: Malschicht in voller Größe; als Snapshot nur gültig für dieselben Labels | nach 3 s Pause, bei Seitenwechsel, Bilderbuch und `visibilitychange: hidden`; beim Öffnen ohne passende Vorschau nach 3 s |
| `thumbs` | `{ id, thumb, digest }`: Thumbnail fürs Bilderbuch (seit DB v2; das Bilderbuch lädt keine Vollbilder) | mit der Vorschau, in einer Transaktion |
| `labels` | Labels RLE-kodiert + Boxen, Schlüssel `<seite>:<svg-hash>:v<schema>:s<scale>` | einmal pro Zeichnung |
| `settings` | Werkzeug, Farbe, Größe, letzte Seite | 300 ms nach Änderung |
| `progress` | eine Zeile: Maltage, je Seite bester Flächenanteil/Farben/Werkzeuge, Sticker (`earned`, `fresh`), geöffnete Überraschungs- und Saisonbilder, angekündigte Saisons (seit DB v3; neue Felder werden beim Lesen mit Defaults ergänzt) | 300 ms nach Änderung, bei `visibilitychange: hidden` |

- **Schneller Start:** der Snapshot wird nur gezeichnet, wenn sein `digest` dem der ersten
  `opCount` Ops entspricht (die Länge allein reicht nicht: Undo + neuer Strich = gleiche Länge);
  danach werden nur die übrigen Ops abgespielt.
- **Geänderte Zeichnung:** Region-IDs hängen an der Rasterung. Ändert sich der Label-Schlüssel
  einer Seite mit Ops, werden die alten Ops einmal mit den alten Labels gerendert; das Ergebnis
  wird `base`, das Log beginnt neu, die alten Labels werden gelöscht — erst wenn das neue Log
  gespeichert ist; sonst bleibt alles für den nächsten Versuch.
- Schreibfehler (Quota) werden geschluckt und geloggt, die App läuft weiter; ein fehlgeschlagener
  Op-Log-Schreibversuch wird beim nächsten Speichern wiederholt.
- Ein Lesefehler des Op-Logs ist **kein** leeres Log: einmal neu lesen, sonst öffnet die Seite
  nicht (ein leerer Start würde das gespeicherte Log beim nächsten Strich überschreiben).
- `flush()` liest die Malschicht, bevor es auf irgendetwas wartet: der Seitenwechsel darf sie
  gleich danach leeren.
- **Fortschritt nachholen:** fehlt die `progress`-Zeile (erster Start mit DB v3), wird sie aus
  den Op-Logs gefüllt — Seiten, Farben, Werkzeuge, als Maltag der Tag der letzten Änderung jedes
  bemalten Bilds. Der Flächenanteil folgt beim nächsten Öffnen der Seite (er braucht die Labels);
  so gewonnene Sticker kommen ohne Feier, nur mit Glitzer.
- Beim Start wird `navigator.storage.persist()` angefragt, damit der Browser die Bilder nicht
  verdrängt.

## 6. Ausmalbilder-Konvention

Jedes Bild ist `src/pages/<gruppe>/<id>.svg`, eingetragen in `src/pages/meta.ts`:

- `<svg xmlns=… viewBox="0 0 800 1000" width="800" height="1000">`, darin ein `<g fill="#fff"
  stroke="#1E2238" stroke-width="…" stroke-linejoin="round" stroke-linecap="round">`.
- Alle Flächen geschlossen; Formen mit `fill="#fff"`, in Malreihenfolge hinten → vorne; verdeckte
  Linien werden dadurch ausgeblendet. Offene Linien (Mund, Schnurrhaare) mit `fill="none"`,
  kleine dunkle Details (Pupillen) mit `fill="#1E2238"`.
- Text (Sprechblasen) als `<text>` mit `fill="#1E2238" stroke="none"`,
  `font-family="Arial, Helvetica, sans-serif"`, ≥ 15 % Luft in der Blase (Schriften variieren).
- Nur eigene Figuren – keine bekannten Charaktere, Marken, Logos.
- Überraschungsbilder tragen `unlockDay` (1–7) in `meta.ts`, je Gruppe genau eins pro Tag, und
  stehen hinter den übrigen Bildern ihrer Gruppe (§3.2).
- Saisonbilder tragen `season` statt `unlockDay`, liegen unter `src/pages/saison/<saison>/<id>.svg`
  (Strich und Flächen nach ihrer Gruppe), je Gruppe und Saison genau eins (§3.4).

Je Altersgruppe:

| Gruppe | Strich | Flächen | Kleinste Fläche (größtes eingeschriebenes Quadrat) |
|---|---|---|---|
| `klein` | 8 | ca. 6–15, große Formen, kein Text | ≥ 30 Dok-px |
| `mittel` | 7–8 | ca. 15–40, kleine Szene | ≥ 14 Dok-px |
| `gross` | 6–8 | ca. 30–90, Szenen, Comics, Mandala | ≥ 9 Dok-px (Buchstaben-Innenräume ausgenommen) |

Dazu hat jede gezeichnete Fläche (Stern, Wange, Blüte, Schnabel …) mindestens **150 Dok-px²**
Innenfläche: kleinere macht die Splitter-Regel (§5.2 Schritt 3) zu Linie — die Form lässt sich
dann nicht anmalen, ein Tipp darauf malt die Nachbarfläche. Winzige Deko lieber massiv
(`fill="#1E2238"`), Lücken zwischen Formen schließen.

`bun run check:pages` (auch als Test in CI) prüft viewBox, Größe, Strichstärke je Gruppe, Farben,
erlaubte Elemente (kein `<image>`, `<script>`, `<style>`, `<use>`, `href`, `url()`) und
`meta.ts` ↔ Dateien. Die Flächen prüft `/dev/seiten` (nur `bun run dev`): jede Seite durch die
echte Pipeline, Flächen eingefärbt, zu kleine rot, als Splitter verworfene orange, ein
JSON-Bericht für Skripte (`tooSmall`, `specks`). Orange dürfen nur Glanzlichter,
Buchstaben-Innenräume und dünne Splitter (< 30 Dok-px², höchstens ~5 px breit — die Masken der
Nachbarn decken sie) sein. Eine ausgelaufene Fläche zeigt sich als ein Farbton, der sich über
mehrere Flächen zieht.

**Bestand (42 Seiten + 12 Saisonbilder, §3.4):**

| Gruppe | Seiten |
|---|---|
| 3–4 | Fisch, Haus, Schmetterling, Ente, Auto, Eis |
| 5–6 | Drache (Prototyp), Zug, Krake im Meer, Schloss, Dino am Vulkan, Feuerwehrauto, Bauernhof |
| 7–8 | Roboter und Katze, Weltraum (beide Prototyp), Piratenschiff, Baumhaus, Dschungel, Mandala, Zirkus, Picknick-Comic |

Überraschungsbilder, nach Maltag (Thema):

| Tag | Thema | 3–4 | 5–6 | 7–8 |
|---|---|---|---|---|
| 1 | Tiere | Katze | Igel im Laub | Zoo |
| 2 | Fahrzeuge | Boot | Bagger | Bahnhof |
| 3 | Meer | Schildkröte | Leuchtturm | Korallenriff |
| 4 | Garten | Blume | Marienkäfer | Gemüsegarten |
| 5 | Fantasie | Einhorn | Zauberer | Zauberwald |
| 6 | Wetter | Sonne und Regenbogen | Schneemann | Vier Jahreszeiten |
| 7 | Feiern | Kuchen | Geschenke | Geburtstag |

## 7. Design

Wie im Prototyp: Himmelblau mit Punkteraster als Hintergrund, Ablage in tiefem Indigo, Farben als
unregelmäßige Kleckse, Auswahl = Sonnengelb + leichte Drehung. Papier immer weiß.
Die Palette sind App-Tokens im web-base-Seam `src/lib/ui/theme.css` (`--color-sky`, `-dots`,
`-tray`, `-tray-2`, `-sun`, `-paper`, `-shade`, `-on-tray`, `-line`); Light/Dark folgt dem
System über denselben Mechanismus wie die web-base-Tokens. Akzentfarbe der Flotte: 355 Himbeere
(`theme_color` `#a71f65`), sichtbar nur auf den web-base-Fehlerseiten.
Im Querformat ab 760 px Breite und auf jedem Handy im Querformat wandert die Ablage nach rechts
(`wide:`-Variante). Auf Handys (`compact:`, schmaler oder niedriger als 560 px) bekommt das Papier
den Platz: Knöpfe 48 px, engere Abstände, die Farben in **einer** Reihe, die seitlich scrollt
(die gewählte bleibt im Blick, ein weicher Rand zeigt „da ist noch mehr"); im Querformat sitzt die
Kopfleiste über der Ablage und das Papier nimmt die volle Höhe. Tablets bleiben unverändert.
Kopfleiste: Bilderbuch und Stickerheft links, rechts Rückgängig und Speichern, mit Abstand der
Papierkorb. Sticker sind gewellte Plaketten in der Farbe ihrer Reihe (Rosa, Türkis, Orange,
Hellgrün); „neu" ist ein sonnengelber Glitzerstern.
Kein Pinch-Zoom: `touch-action: none` auf `body` (iOS ignoriert `user-scalable=no`), nur
Scrollflächen erlauben `pan-x`/`pan-y`.
Farbkleckse 48–72 px, alle Bedienelemente ≥ 48 px. `prefers-reduced-motion` (Reset in
`tokens.css`; die Feier lässt dann zusätzlich Konfetti und Flug weg) und Safe-Area-Insets
beachten. App-Icon: `assets/icon.svg` → `public/icon-*.png`.

## 8. Performance-Budgets (Mittelklasse-Tablet, Scale 1.5)

| Messpunkt | Budget | Gemessen¹ |
|---|---|---|
| Labeling einer Seite (ohne Cache) | < 150 ms | 30–70 ms |
| Masken-Build einer Region | < 30 ms | ≤ 25 ms (größte Fläche), meist < 3 ms |
| Pointerdown → erstes Pixel (Maske gecacht) | < 16 ms | nächster Frame |
| Undo bei 200 Ops | < 100 ms | 53–86 ms; erstes Undo nach Neuladen 61 ms (Checkpoints im Leerlauf nachgebaut) |

¹ Headless-Chromium mit CPU-Rendering auf dem Entwicklungsrechner, 2026-10-20. Auf einem echten
Tablet noch zu messen.

## 9. Akzeptanzkriterien MVP

Mit ✓ markiert: automatisiert in Chromium geprüft (Playwright, 2026-10-20).

- [x] Strich, der im Drachenbauch beginnt und quer über das Bild gezogen wird, färbt nur den Bauch. ✓
- [ ] Zwischen Farbe und Linie bleiben keine weißen Ritzen sichtbar. (Maske reicht 9 Dok-px unter
      die Linien; auf dem Tablet anschauen)
- [x] Ein zweiter Finger während des Malens erzeugt keinen Strich. ✓
- [x] Farbeimer auf eine Linie getippt füllt die nächstgelegene Fläche. ✓
- [x] Radierer entfernt Farbe, Linien bleiben unverändert. ✓
- [x] „Alles löschen" → „Rückgängig" stellt das Bild exakt wieder her. ✓ (pixelgleich)
- [x] App neu laden / Seite wechseln → Bild ist unverändert da. ✓ (pixelgleich)
- [ ] Flugmodus: installierte App startet und funktioniert vollständig. (Chromium offline ✓;
      auf dem Tablet installiert prüfen)
- [x] Bild speichern liefert PNG mit Farbe und Linien. ✓
- [x] Alle Bedienelemente ≥ 48 px, alle mit deutschem `aria-label`. ✓

## 10. Offene Fragen

- Seitenpakete von einem Server nachladen? (Heute: 42 SVGs im JS-Bundle, die Saisonbilder als
  eigene Chunks, alle mit der App precacht.)
- Elternbereich: Ton aus, Fortschritt zurücksetzen, alle Überraschungen sofort öffnen?
- Stempel als Extra für 7–8?

## 11. Entscheidungslog

- _2026-10-20_ — Op-Log statt ImageData-Snapshots für Undo (Speicher, Replay-Feature).
- _2026-10-20_ — Radierer bewusst ungeclippt: Kinder wollen „überall wegmachen" können.
- _2026-10-20_ — Auf web-base aufgesetzt: oxlint + oxfmt statt Biome, Vitest statt `bun test`,
  `injectManifest` statt `generateSW`, `idb` statt `idb-keyval`, react-router mit einer Route.
  Die Shell der Basis bleibt ungenutzt (Text), Update-Hinweis als Icon.
- _2026-10-20_ — Drei Altersgruppen (3–4 / 5–6 / 7–8); beantwortet die Altersfrage. Die Ablage
  folgt der Gruppe des geöffneten Bildes statt eines eigenen Schalters.
- _2026-10-20_ — Bilderbuch-Übersicht statt Thumbnail-Leiste: 21 Seiten passen nicht in eine Zeile.
- _2026-10-20_ — Linien als SVG-Overlay (`multiply`) statt Linien-Canvas: scharf bei jeder
  Pixeldichte.
- _2026-10-20_ — Checkpoints als Canvas-Kopien statt `ImageBitmap` (synchron, ohne
  Allokation); Malschicht vor `clear` gepinnt; überdeckte Ops werden beim Replay übersprungen.
- _2026-10-20_ — Vorschau = Malschicht in voller Größe mit Op-Digest (Schnellstart) + Thumbnail;
  Labels nach SVG-Hash geschlüsselt, Ops auf geänderter Zeichnung werden zum Basisbild.
- _2026-10-20_ — Splitter-Flächen < 150 Dok-px² zählen als Linie.
- _2026-10-21_ — Splitter-Regel bleibt, aber gezeichnete Formen brauchen ≥ 150 Dok-px² (§6):
  9 Bilder hatten Sterne, Wangen, Blüten, Schnäbel … darunter — ein Tipp malte die Nachbarfläche.
  `/dev/seiten` zeigt verworfene Flächen jetzt orange; die Bilder sind angepasst.
- _2026-10-21_ — Handy-Layout (`compact:`): Farben in einer scrollenden Reihe statt Raster; das
  Papier wächst auf dem iPhone von ≈ 321 × 401 auf 370 × 463 px, auf 360er-Android von 150 × 188
  auf 340 × 425 px. Handys im Querformat bekommen die Seitenablage mit Kopfleiste.
- _2026-10-21_ — „Alles löschen" und „Bild speichern" per Gedrückthalten statt Tippen.
- _2026-10-21_ — Thumbnails in eigenem Store (DB v2); Op-Log-Lesefehler öffnen die Seite nicht
  statt leer; die Vorschau wird vor dem Warten aufs Op-Log gelesen.
- _2026-10-21_ — Überraschungsbilder und Sticker gegen Langeweile: 21 neue Bilder, je Maltag
  eins pro Altersgruppe. Gezählt werden **Maltage** statt Wochentage — kein Bild verschwindet,
  eine Pause kostet nichts, Uhr verstellen bringt nur einen neuen Tag.
- _2026-10-21_ — „Fertig" = ≥ 75 % der Flächen (Farbeimer oder geclippter Strich), Radierer
  ignoriert; bester Stand gemerkt, Sticker werden nie entzogen.
- _2026-10-21_ — Feier mit WebAudio-Melodie statt Audiodatei (nichts zu precachen); der Ton ist
  bis zu einem Elternbereich immer an. Fortschritt als eine Zeile im Store `progress` (DB v3),
  beim Upgrade aus den Op-Logs nachgeholt.
- _2026-10-22_ — Saisonbilder (Ostern, Sommer, Halloween, Weihnachten), je Gruppe eins, **nur in
  der Saison** sichtbar (Wunsch): danach verschwinden sie, Gemaltes bleibt und kommt mit der
  Saison wieder. Eigene Chunks statt Bundle — das ist das „Nachladen"; ein Seitenpaket vom Server
  bräuchte Laufzeit-Caching und bleibt offen (§10).
- _2026-10-20_ — Spec bleibt Deutsch (web-base empfiehlt Englisch für `docs/specs/`; in
  web-base 08 als Abweichung vermerkt).
