# WORKFLOW.md - AI Team Development Workflow

_8-Agent-Team mit GitHub Projects Integration. Ein Repo = Ein Project._

---

## 🎯 Überblick

**Prinzipien:**
- **8-Phasen-Workflow** (strikte Qualitätsgates, REQUIREMENTS niemals überspringen)
- **Ein Repo = Ein Project** (GitHub Issues + Projects = Single Source of Truth)
- **8 spezialisierte Agenten** (parallel arbeitend, eigene Workspaces)
- **Tool-Wiederverwendung** (bestehende Skills suchen und nutzen)

**User:** user (Sprache nach Präferenz)  
**Organisation:** https://github.com/openfugjoobot

---

## 🏗️ 8-Agent-Team

| Agent | Rolle | Workspace | Phase |
|-------|-------|-----------|-------|
| **DevOrchestrator** | Koordination, Management | `workspace` | 0-8 |
| **ResearchAgent** | Tech-Research, PoCs | `workspace-research` | 1 |
| **ArchitectAgent** | System-Design, APIs | `workspace-architect` | 2 |
| **BackendAgent** | Server, APIs, DB | `workspace-backend` | 4 |
| **FrontendAgent** | UI/UX, Components | `workspace-frontend` | 4 |
| **QAAgent** | Tests, Code-Review | `workspace-qa` | 5 |
| **DocsAgent** | Dokumentation | `workspace-docs` | 6 |
| **DevOpsAgent** | CI/CD, Deploy | `workspace-devops` | 7 |

**⚠️ Workspace-Regeln:**
- Nur diese 8 Workspaces sind gültig
- `workspace-*-agent` (mit Suffix) = temporär → ignorieren/löschen
- Agenten arbeiten nur in ihrem Workspace

---

## 📋 8-Phasen-Workflow

| Phase | Owner | Output | GitHub Aktion |
|-------|-------|--------|---------------|
| **0. REQUIREMENTS** 🔴 | DevOrchestrator + user | `REQUIREMENTS.md` | Issue erstellen, Label `requirements`, Project: "Backlog" |
| **1. ANALYSIS** | ResearchAgent | `specs/analysis.md` | Status: `in progress`, Kommentar mit Ergebnissen |
| **2. DESIGN** | ArchitectAgent | `specs/architecture.md` | Status: `in progress`, Specs verlinken |
| **3. PLANNING** | DevOrchestrator | Subtasks mit Abhängigkeiten | Issues für Subtasks, Labels, Milestone, Project: "Ready" |
| **4. IMPLEMENTATION** | Backend + Frontend (parallel) | Code + Tests | **PR-Workflow**, Branch `feature/xyz`, Project: "In Progress" → "In Review" |
| **5. REVIEW** | QAAgent | Review-Report | PR Review (inline), Label `qa-approved` oder `qa-changes-requested` |
| **6. DOCUMENTATION** | DocsAgent | README, API-Docs | Docs im PR ergänzen |
| **7. DEPLOYMENT** | DevOpsAgent | Live App | Release `v1.0.0`, Deployment-Status kommentieren |
| **8. CLOSURE** | DevOrchestrator | Memory-Update | Issue `closed`, Project: "Done", Retro |

**Phase 0 (REQUIREMENTS) ist Pflicht:**
- Projekt-Ziel (1 Satz), User Stories (3-5), Tech Stack, Deliverables, Exclusions, Success Criteria
- **⚠️ User muss schriftlich bestätigen bevor Phase 1 startet!**

---

## 🔗 GitHub Integration

### Repository-Struktur
```
openfugjoobot/
├── project-a/          # Ein Repo = Ein Project
├── project-b/
└── project-c/
```

### Labels
- **Type:** `bug`, `feature`, `enhancement`, `documentation`
- **Priority:** `p0-critical`, `p1-high`, `p2-medium`, `p3-low`
- **Size:** `xs`, `s`, `m`, `l`, `xl`
- **Status:** `blocked`, `needs-review`, `qa-approved`

### GitHub Projects (pro Repo)
- **Views:** Board (Kanban), Table, Roadmap
- **Spalten:** Backlog → Ready → In Progress → In Review → Done
- **Custom Fields:** Priority, Size, Sprint, Agent
- **Automatisierung:** Issue opened → Backlog | PR opened → In Review | PR merged → Done

### Branching & PR
```
main (protected)
  ↑
  ├── feature/xyz    # Feature-Branches
  └── hotfix/xyz     # Emergency fixes
```

**Regeln:**
- Keine direkten Commits auf `main`
- Jeder PR braucht 1 Approval (QAAgent)
- CI muss grün sein
- Nach Merge: Branch löschen

---

## 🛠️ Tooling & Setup

### Wiederverwendungspflicht

**VOR dem Projektstart:**
1. 🔍 **Suche nach vorhandenen Skills** in `~/.openclaw/workspace/skills/`
2. 🔍 **Prüfe TOOLS.md** auf bestehende Konfigurationen
3. ✅ **Verwende existierende Tools** statt neue zu bauen
4. ❌ **Nicht neu erfinden** was bereits existiert

**Wenn Skill fehlt:**
- `clawhub search <keyword>` → Skill suchen
- `clawhub install <skill>` → Installieren
- Nur wenn wirklich nötig: Neuen Skill erstellen

### Standard-Tools (immer prüfen)
| Tool | Verwendung |
|------|------------|
| `gh` | GitHub CLI für alle Git-Operationen |
| `blogwatcher` | RSS/Atom Feed-Monitoring |
| `weather` | Wetterdaten (wttr.in) |
| `gog` | Google Workspace (Gmail, Calendar, Drive) |
| `qmd` | Lokale Suche/Indexing |
| `clawhub` | Skill-Management |
| `mcporter` | MCP Server Integration |

### API Keys
Liegern in `~/.openclaw/credentials/.env`:
```bash
BRAVE_SEARCH_API_KEY      # Web-Suche
OPENROUTER_API_KEY        # LLM-Models
GOG_CLIENT_ID/SECRET      # Google Workspace
GITHUB_TOKEN              # API-Zugriff (falls nötig)
```

---

## 📚 Best Practices

### Architektur
- **Ein Repo pro Projekt** (keine Mono-Repos)
- **PR-Workflow** mit Reviews (keine direkten main-Commits)
- **Labels** nach Type/Priority/Size (nicht nach Agent)
- **GitHub Projects** statt externer PM-Tools
- **YAGNI:** Ordner/Dateien erst erstellen wenn Inhalt existiert

### Code-Qualität
- REQUIREMENTS-Phase niemals überspringen
- Kein Code ohne Tests
- Kein Deploy ohne grüne CI
- Keine Secrets in Commits (nur Env-Vars)
- `trash` > `rm` (wiederherstellbar ist besser als weg)

### API-Integration
- Offizielle APIs bevorzugen
- Rate-Limiting & Error-Handling implementieren
- Fallback-Mechanismen für kritische Abhängigkeiten
- Caching für häufige Anfragen

---

## 🔄 Kontinuierliche Überwachung (24/7)

**Kontinuierliche Checks:**
1. 🚫 Blocked Tickets (>2h keine Aktivität)
2. 📋 GitHub Project Board für Phasen-Änderungen
3. 📝 Open Reviews (pending >24h → Erinnerung)
4. 🎫 Neue Issues in Repositories
5. 🔍 Memory Maintenance (REVIEWED → MEMORY.md)
6. 🧹 Cleanup (temp Dateien, orphaned Prozesse)
7. 💾 Git Check (uncommitted changes committen)

**Phase-Transition Automatisierung:**
| Von | Nach | Aktion |
|-----|------|--------|
| REQUIREMENTS | ANALYSIS | ResearchAgent spawnen |
| ANALYSIS | DESIGN | ArchitectAgent spawnen |
| DESIGN | PLANNING | Subtasks erstellen |
| PLANNING | IMPLEMENTATION | Backend + Frontend parallel |
| IMPLEMENTATION | REVIEW | QAAgent spawnen |
| REVIEW | DOCUMENTATION | DocsAgent spawnen |
| DOCUMENTATION | DEPLOYMENT | DevOpsAgent spawnen |
| DEPLOYMENT | CLOSURE | Retro + Cleanup |

---

## ✅ Entscheidungs-Matrix

| Situation | Aktion |
|-----------|--------|
| Tech Stack <€10/Monat | ✅ Auto |
| Refactoring <50 LOC | ✅ Auto |
| Bugfixes | ✅ Auto |
| Agent spawn/retry | ✅ Auto |
| Architektur-Änderungen | ⚠️ INFO an user |
| Neue Dependencies | ⚠️ INFO an user |
| Budget-Impact | ⚠️ INFO an user |
| Agent-Timeouts | ⚠️ INFO an user |
| Security-relevant | 🛑 FRAG user |
| Breaking Changes | 🛑 FRAG user |
| Kosten >€50 | 🛑 FRAG user |
| DB-Migrationen | 🛑 FRAG user |
| Unklare Requirements | 🛑 FRAG user |

---

## 📝 Memory Management

**Dateien:**
```
~/.openclaw/workspace/
├── MEMORY.md              # Long-term Memory (Main Session only)
├── memory/YYYY-MM-DD.md   # Daily notes
├── DECISION_LOG.md        # Architektur-Entscheidungen
└── LEARNINGS.md           # Retro-Erkenntnisse
```

**Regeln:**
- MEMORY.md nur in Main Session laden (private Daten)
- Daily notes = raw logs
- MEMORY.md = kuratierte Erkenntnisse
- Projekt-Status ist in GitHub Projects (keine PROJECT_STATE.md)

---

## 🚀 Setup Checklist

- [ ] **Skills prüfen:** Vorhandene Tools in `skills/` und `TOOLS.md` suchen
- [ ] **Repo erstellen:** Ein Repo pro Projekt
- [ ] **GitHub Project:** Board + Views + Automatisierungen einrichten
- [ ] **Labels:** Type, Priority, Size konfigurieren
- [ ] **Branch-Protection:** main protected, CI required
- [ ] **Workspaces:** 8 Agent-Workspaces einrichten
- [ ] **PR-Template:** Erstellen
- [ ] **Test-Run:** Erstes Ticket durchlaufen

**Aufwand:** 3-4 Stunden

---

**Zusammenfassung:** Striktes 8-Phasen-Modell + 8 Agenten + GitHub Best Practice (Ein Repo = Ein Project) + Tool-Wiederverwendung = Qualitativ hochwertige Software.

---

*Version: 2026-02-19*  
*Ein Project pro Repository | Tool-Wiederverwendung | 24/7 Development*
