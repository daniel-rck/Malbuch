# Malbuch — Hinweise für Claude Code

Ausmal-App für Kinder (3–8 Jahre), PWA, offline. Aufgesetzt auf
[web-base](https://github.com/daniel-rck/web-base) (Stempel `webBase.version` in `package.json`).

## Leseordnung

1. `docs/specs/malbuch.md` — die Spec. **Quelle der Wahrheit**; Code folgt der Spec. Ändert sich
   das Design, die Spec im selben Commit anpassen (Entscheidungslog §11).
2. `PLAN.md` — Phasen mit Checkboxen und Gate (Workflow: `.claude/commands/phase.md`).
3. `docs/reference/prototype.html` — der Prototyp, nur als Algorithmus-Referenz.
4. web-base-Konventionen: `web-base/docs/specs/07-conventions.md`; Malbuchs Abweichungen
   stehen in `web-base/docs/specs/08-app-migrations.md` („Malbuch — text-free kids' paint surface").

## Gates (nach jeder Änderung)

```bash
bun run lint && bun run typecheck && bun run test && bun run check:pages && bun run build
bunx github:daniel-rck/web-base#v0.6.0 check --strict
```

## Regeln

- **web-base-Dateien nicht anfassen**, die `check` als *owned* führt (`src/lib/ui/*` außer
  `theme.css`/`index.ts`, `src/lib/db/{open,mutations,useLiveQuery}.ts`, `src/lib/routing/*`,
  `src/lib/pwa/*`, `src/sw/base.ts`, `worker/base.ts`, `src/test/setup.ts`, …). Änderungen dort
  gehören nach web-base. Eigene Tokens nur im Seam `src/lib/ui/theme.css`.
- Die Shell der Basis (`AppShell`, `UpdatePrompt`, `ThemeToggle`, …) ist nur für
  `check --strict` installiert und wird **nicht** importiert: sie zeigt Text, Malbuch nicht.
- UI ohne Text: Icons, Kleckse, Punktgrößen; deutscher Text nur in `aria-label`. Bedienelemente
  ≥ 48 px. Code, Kommentare und Commits auf Englisch (Conventional Commits).
- `src/features/paint/engine/` und `src/features/rewards/engine/` bleiben reines TS ohne DOM und
  vollständig getestet.
- Live-Zeichnen und Replay gehen durch dieselben Funktionen in `render/draw.ts` — sonst ist
  Undo nicht mehr pixelgleich.
- Neue Ausmalbilder: Konvention in Spec §6, `src/pages/meta.ts` ergänzen (Überraschungsbilder
  mit `unlockDay`, je Gruppe eins pro Tag 1–7),
  `bun run check:pages`, dann Flächen auf `/dev/seiten?seite=<id>` (Dev-Server) prüfen.
  Saisonbilder (`season` statt `unlockDay`) liegen unter `src/pages/saison/<saison>/`, je Gruppe
  und Saison genau eins (Spec §3.4).
