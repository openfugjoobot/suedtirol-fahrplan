# GitHub Projects Skill — Requirements

## Vision
Ein zentrales Master-Board für alle OpenFugjooBot-Repositories mit automatischer Status-Synchronisation basierend auf Labels und Phasen.

## Goals
1. **Single Source of Truth**: Ein Board zeigt alle Issues aus allen Repos
2. **Automatisierte Workflows**: Issue-Status → Board-Column ohne manuelles Ziehen
3. **8-Phasen-Integration**: Unser Workflow (0-8) als Custom Field auf dem Board
4. **Zero-Friction**: Keine manuellen Board-Updates mehr nötig

## Functional Requirements

### FR1: Master Board
- Ein GitHub Project (Organization-level) aggregiert Issues aus allen Repos
- Auto-add: Neue Issues in beliebigem Repo landen automatisch auf dem Board
- Unterstützung für private und public Repos

### FR2: Auto-Status-Sync
- Label "ready" → Column "Ready"
- Label "in-progress" → Column "In Progress"
- Label "in-review" → Column "In Review"
- Label "done" → Column "Done"
- Archivierte/Closed Issues → Column "Closed"

### FR3: Phase-Tracking
- Custom Field "Phase" (0-8) auf dem Board
- Auto-set basierend auf Labels oder Issue-Content
- Filter-View: "Alle Issues in Phase 4"

### FR4: CLI-Integration
- `gh projects list` — alle Projekte anzeigen
- `gh projects item-move <issue> <column>` — manuelles Verschieben
- `gh projects sync` — manuelle Status-Synchronisation

### FR5: OpenClaw Integration
- DevOrchestrator kann Board-Status per Skill abfragen
- Agent-Completion → Auto-Update des Issue-Status
- Heartbeat-Check: Sind alle Issues im richtigen Status?

## Non-Functional Requirements

### NFR1: Echtzeit
- Webhook-basiert: Updates innerhalb von Sekunden
- Fallback: Polling alle 5 Minuten

### NFR2: Robustheit
- Rate-Limit-Handling (GitHub API)
- Retry-Logik bei Fehlern
- Idempotenz: Doppelte Events verarbeiten ohne Chaos

### NFR3: Sicherheit
- Nur Repo-Admin kann Board konfigurieren
- Keine Exfiltration privater Issue-Daten

## Out of Scope (v1)
- Multi-Org Support (nur openfugjoobot)
- Externe Repos (nur eigene)
- Komplexe Regel-Engine (nur Label→Column)

## Success Metrics
- 100% der Issues auf dem Master Board sichtbar
- 0 manuelle Board-Updates nötig
- <5s Latenz für Status-Änderungen

## References
- GitHub Projects v2 GraphQL API: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
- Auto-add workflows: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-projects/auto-archiving-items

---
**Status:** Phase 0 — Requirements Defined  
**Next:** Phase 1 — Analysis (ResearchAgent)
