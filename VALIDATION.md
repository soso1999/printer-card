# Validierung

## Repository cleanup — 2026-10-15

Für v1.0.5 wurden Repository-Struktur und Quellstand konsolidiert:

- `src/` bildet jetzt dieselben 13 optionalen Entitäten ab wie die aktuelle Distribution:
  Status, Cyan, Magenta, Gelb, Schwarz, Bandeinheit, Fixiereinheit, Trommel, Laser, Gesamtseiten, Farbseiten, S/W-Seiten und Duplex.
- Die vier Wartungs-/Verbrauchskomponenten `belt`, `fuser`, `drum` und `laser` werden im Visual Editor separat als Restlebensdauer geführt.
- `dist/printer-card.js` und die Root-Datei `printer-card.js` werden aus demselben Source-Stand erzeugt.
- README, Demo, Tests, Changelog und Versionsnummer wurden auf denselben Funktionsstand gebracht.
- GitHub-Workflows für Checks und Releases wurden ergänzt.
- Das öffentliche GitHub-Repository und Releases sind vorhanden; die HACS-Installation als benutzerdefiniertes Dashboard-Repository ist dokumentiert.

## Automatisierte Checks

`npm run check` führt aus:

- Node-Logiktests,
- Build von `dist/printer-card.js`,
- JavaScript-Syntaxprüfung der gebauten Distribution.

Die Tests decken Statusprioritäten, DE/EN-Muster, Fach 1/2, Ersatzmuster und leere Kategorien, exakte/Wildcard-Erkennung, Prozentwerte, Konfigurationsvalidierung, HTML-Escaping, alle 13 Entitätsschlüssel sowie Einheitenbehandlung ab.

Der optionale Playwright-Browsertest prüft zusätzlich die gebaute Karte, 13 Editorfelder, vier Wartungskomponenten, Änderungen im Visual Editor, Entity-Auswahl/-Entfernung, Muster, fehlende Werte, HTML-Escaping, Klickereignisse, mobile Darstellung, dunkles Theme und reduzierte Bewegung.

## Bereits zuvor geprüft

- Die gebaute Distribution wurde in lokalem Chrome mit Playwright geladen; frühere Browserprüfungen liefen ohne JavaScript-Browserfehler.
- Statuswechsel, Druckanimation, Tonerwarnung, Papierfehler/Fach-Erkennung, Detail-Ereignisse und Sprachwechsel wurden in der Demo geprüft.
- Die aktuelle Karte unterstützt optionale Wartungswerte mit vorhandener Einheit, etwa Prozent oder Restseiten.

## Noch nicht als Teil dieses Cleanup-Schritts behauptet

Dieses Cleanup dokumentiert und synchronisiert den Repository-Stand. Es behauptet keinen neuen Hardware-, Drucker-, HACS-Upgrade- oder vollständigen Home-Assistant-End-to-End-Test. Die interaktive Demo ersetzt keinen Integrationstest mit einer realen Home-Assistant-Instanz.
