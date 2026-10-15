# Changelog

## 1.0.5 — 2026-10-15

- Repository cleanup: editable `src/` sources now match the current 13-entity distribution.
- Maintenance supplies are consistently represented as belt, fuser, drum and laser throughout source, editor, demo and documentation.
- Updated tests for all 13 entity fields and unit handling.
- Restored GitHub Actions checks and tag-based release publishing.
- Updated README, HACS instructions and validation notes to match the published repository.
- No configuration migration is required.

## 1.0.2 — 2026-10-05

- Added optional remaining-life displays for belt unit, fuser unit and laser alongside the existing drum display.
- Added a dedicated maintenance-supplies section to the visual editor.
- Maintenance values retain their sensor units, such as percentages or remaining pages.
- Page-counter values are displayed without redundant units.

## 1.0.1 — 2026-10-05

- Erkannte Statusmeldungen werden nur einmal angezeigt; die zusätzliche Rohtextzeile entfällt.
- Englische Sensoreinheiten `page`/`pages` erscheinen auf Deutsch als „Seiten“.

## 1.0.0 — 2026-10-05

- Generic printer card with ten optional entity assignments and a visual editor.
- Vertical CMYK cartridges, configurable toner warning and print animations.
- Configurable status and tray patterns with German/English defaults.
- Theme-aware layout, entity detail events and reduced-motion support.
- HACS-ready distribution, build, tests, demo and GitHub workflows.

> Note: GitHub releases v1.0.3 and v1.0.4 exist in the release history. This changelog records the user-facing changes that are documented in the repository and release notes.
