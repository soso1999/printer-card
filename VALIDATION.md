# Validierung — 2026-10-05

## Erfolgreich geprüft

- Sieben automatisierte Logiktests: Statusprioritäten, DE/EN-Muster, Fach 1/2, Ersatzmuster und leere Kategorien, exakte/Wildcard-Erkennung, Prozentwerte, Konfigurationsvalidierung und HTML-Escaping.
- Distribution gebaut und JavaScript-Syntax geprüft.
- Die tatsächliche gebaute Distribution wurde in lokalem Chrome mit Playwright geladen. Keine JavaScript-Browserfehler.
- Vier Kartuschen, niedriger Tonerstand, zehn Editorfelder und Entitätsvorschläge.
- Statuswechsel, Druckanimation und Abschalten der Animation.
- Papierfehler Fach 2, individuelle Statusmuster und Zurücksetzen.
- Löschen/Wiederzuweisen einer Entität, fehlende Entität und unavailable-Wert.
- Detail-Ereignis mit korrekter Entitäts-ID.
- HTML in einem Kartentitel wird als Text angezeigt.
- Sprachwechsel, 320-Pixel-Ansicht, dunkles Theme und reduzierte Bewegung.

## Noch nicht live geprüft

Es war keine echte Home-Assistant-Instanz und kein veröffentlichtes GitHub-Repository mit diesem Projekt verbunden. Daher sind HA-Kartenauswahl, Konfiguration speichern/neu laden, echte Detaildialoge, Sections-Layout, HACS-Installation/Upgrade sowie die GitHub-Workflows noch nicht im Zielsystem getestet. Die Demo stellt das `hass`-Objekt und die Konfigurationsereignisse nach; sie ersetzt keinen Integrationstest mit Home Assistant.

Vor der ersten öffentlichen Freigabe in einer HA-Testinstallation: JS-Ressource laden, Karte über die Kartenauswahl hinzufügen, alle benötigten Felder zuweisen, Muster ändern, speichern, neu laden und anschließend Installation/Upgrade über ein HACS-Custom-Repository testen. Safari/Firefox wurden nicht separat getestet; die Entitätsvorschläge verwenden das native HTML-datalist-Element.
