# Malbuch

Ausmalen ohne Übermalen: eine Malbuch-App für Kinder von 3 bis 8 Jahren. Kinder wählen eine
Farbe und eine Stiftgröße und malen Comic-Figuren aus — ein Strich bleibt in der Fläche, in der
er angefangen hat, nichts läuft über die Linien. Läuft offline auf dem Tablet.

**App:** <https://malbuch.daniel-rck.workers.dev>

## Was sie kann

- **21 Ausmalbilder in drei Altersgruppen** — 3–4 Jahre (große, einfache Formen), 5–6 Jahre
  (kleine Szenen), 7–8 Jahre (detaillierte Bilder, Comics, ein Mandala). Das Bilderbuch oben
  links zeigt alle Bilder mit dem, was schon gemalt ist.
- **Stift, Farbeimer, Radiergummi.** Die Ablage passt sich dem Bild an: für die Kleinsten zehn
  Farben und nur dicke Stifte, für die Großen alle 16 Farben und vier Stiftgrößen.
- **Rückgängig ohne Ende**, auch nach „Alles wegmachen".
- **Speichert von selbst** — jedes Bild, auf dem Gerät. Nichts verlässt das Tablet.
- **Bild speichern** (für Eltern): als PNG teilen oder herunterladen.
- **Ohne Lesen bedienbar**: nur Bilder, Farbkleckse und Icons.

## Auf dem Tablet installieren

Seite im Browser öffnen, dann *Zum Home-Bildschirm* (Safari: Teilen-Menü) bzw. *App
installieren* (Chrome). Danach startet Malbuch im Vollbild und funktioniert auch im Flugmodus.

## Entwicklung

```bash
bun install
bun run dev          # http://localhost:5173 — /dev/seiten zeigt die Flächen aller Bilder
bun run lint && bun run typecheck && bun run test && bun run check:pages && bun run build
```

Spec: [`docs/specs/malbuch.md`](./docs/specs/malbuch.md). Aufgesetzt auf
[web-base](https://github.com/daniel-rck/web-base).

## Lizenz

MIT © daniel-rck
