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

**⚠️ Workspace-Regeln (KRITISCH):**
- **NUR in `.openclaw/workspace-*` entwickeln** – nie in Home, /tmp, oder außerhalb
- **Projekt-Code gehört ins ` workspace/` (Main) oder Agent-Workspace**
- Agenten dürfen **NIE** in fremde Workspaces schreiben
- `workspace-*-agent` (mit Suffix) = temporär → ignorieren/löschen
- **GitHub ist Source of Truth** – lokale Änderungen müssen sofort gepusht werden
- Nach Agent-Completion: `git status` prüfen ob alle Files committed wurden

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

### GitHub Projects (Optional)
- **Views:** Board (Kanban), Table, Roadmap
- **Spalten:** Backlog → Ready → In Progress → In Review → Done
- **Custom Fields:** Priority, Size, Sprint, Agent
- **Automatisierung:** Issue opened → Backlog | PR opened → In Review | PR merged → Done

*Hinweis: Einfaches Issue-Listing ohne Projects reicht aus.*

### Branching, PR & Merge Prozess (KRITISCH)

**Agenten dürfen NIEMALS direkt auf main pushen!**

```
main (protected)
  ↑
  feature/issue-#-description  ← Agent erstellt Branch
  ↑
  git push -u origin feature/...  ← Agent pusht Branch
  ↑
  gh pr create --title "..."     ← Agent erstellt PR
  ↑
  Code Review (QAAgent/DevOrchestrator)
  ↑
  gh pr merge --squash           ← DevOrchestrator merged
  ↑
  git branch -d feature/...      ← Branch löschen
```

**Pflicht-Schritte für Agents:**
1. `git checkout -b feature/issue-#-description` (von main)
2. Code implementieren + testen
3. `git add -A && git commit -m "feat: ..."`
4. `git push -u origin feature/issue-#-description`
5. `gh pr create --title "type: description" --body "Closes #issue"`
6. **Warten auf Review** – nicht selbst mergen!

**DevOrchestrator merged nach:**
- ✅ Review durch QAAgent oder sich selbst
- ✅ Alle Tests grün
- ✅ Keine Konflikte
- ✅ PR Beschreibung vollständig

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

## 🩺 Agent Health Checks (NEU)

**Nach JEDER Agent-Completion:**

### 1. Output Verification
```bash
# Prüfe ob Agent tatsächlich geliefert hat
git status  # Zeigt uncommitted changes
git log --oneline -3  # Letzte Commits anzeigen
git branch -a  # Zeigt alle Branches
gh pr list  # Zeigt offene PRs
```

### 2. File Existence Check
```bash
# Agent behauptet er hat X erstellt – prüfen!
ls -la src/bot/commands.js 2>/dev/null || echo "❌ FEHLEND!"
ls -la specs/architecture.md 2>/dev/null || echo "❌ FEHLEND!"
```

### 3. PR Verification
```bash
# PR muss existieren und offen sein
gh pr view <nummer>  # PR Details prüfen
gh pr diff <nummer>  # Änderungen ansehen
```

### 4. Heartbeat: "Hat der Agent überhaupt etwas getan?"
- **Wenn Output leer** → Agent neu spawnen
- **Wenn Files fehlen** → Manuell nachholen
- **Wenn PR nicht erstellt** → `gh pr create` ausführen

**Red Flags:**
- ❌ Agent sagt "Fertig" aber `git status` zeigt nichts
- ❌ Kein Branch im Repo
- ❌ Kein PR auf GitHub
- ❌ Files fehlen trotz "Erfolg"

---

## 🔄 GitHub = Source of Truth (KRITISCH)

**Wahrheit lebt auf GitHub, nicht lokal!**

| Was | Wo | Warum |
|-----|-----|-------|
| **Code** | GitHub Repo | Andere Agents brauchen Zugriff |
| **Issues** | GitHub Issues | Tracking und Zuordnung |
| **Doku** | GitHub README/specs | Zentrale Quelle |
| **Planning** | GitHub Projects | Status-Übersicht |

**Regeln:**
- ✅ Code sofort pushen (`git push` nach jedem Commit)
- ✅ Issues sofort schließen (`gh issue close #n`)
- ✅ PRs sofort erstellen (`gh pr create`)
- ✅ Nie lokal hoarden ("ich committe später")
- ❌ Keine "fast fertig" Branches auf dem Rechner

**Nach Agent-Completion Pflicht:**
1. `git push` – Code auf GitHub?
2. `gh pr list` – PR existiert?
3. `gh issue list` – Issues aktualisiert?
4. `du -sh ~/.openclaw/workspace-*` – Nichts vergessen?

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

## 💡 Lessons Learned aus suedtirol-events (NEU)

### Common Pitfalls & Fixes

#### 1. Circular Dependencies (KRITISCH)
**Problem:**
```javascript
// repositories/index.js
const EventRepository = require('./events');
module.exports = { EventRepository };

// repositories/events.js
const { getDatabase } = require('./index'); // ❌ Zirkel!
```

**Lösung:**
```javascript
// repositories/events.js
const { getDatabase } = require('../connection'); // ✅ Eigene Datei
```

**Prävention:**
- Separate `connection.js` für Database-Singleton
- Keine require() Loops zwischen Dateien
- Repositories dürfen nicht auf `./index` dependen

#### 2. Agent Output Verification
**Was schiefgelaufen ist:**
- Agent meldet "Erfolg" aber keine Files auf Disk
- Code im falschen Verzeichnis (~/repos/ statt ~/.openclaw/)
- PR nicht erstellt trotz "Fertig"

**Fix:**
```bash
# Nach Agent immer:
subagents list  # Status prüfen
ls -la src/     # Files existieren?
git status      # Änderungen da?
gh pr list      # PR erstellt?
```

#### 3. Pfad-Probleme
**Falsch:**
```javascript
const logger = require('../utils/logger'); // ❌ aus src/db/repositories/
const db = require('./index').getDatabase(); // ❌ Zirkel
```

**Richtig:**
```javascript
const logger = require('../../utils/logger'); // ✅ Relativ zur Datei
const { getDatabase } = require('../connection'); // ✅ Separate Modul
```

#### 4. Telegram Bot Konflikt
**Problem:** Token 409 Conflict (bereits in Verwendung)  
**Lösung:** Integration in OpenClaw Session statt separatem Prozess  
**Outcome:** Ich bin jetzt der Bot – Commands funktionieren über Chat

#### 5. Database Connection
**Problem:** Mehrere connection-Instanzen, WAL-Mode Fehler  
**Fix:** Singleton Pattern in `connection.js`, alle Repositories nutzen diese

---

## 🤖 Autonomous Mode (NEU)

### Konzept
- **Autonomous = SELBSTSTÄNDIG, aber SEQUENZIELL**
- Agenten arbeiten allein, aber **NICHT parallel**
- Ein Agent nach dem anderen, nicht gleichzeitig Backend + Frontend

### Warum sequentiell?
- **Konflikte vermeiden**: Keine Race Conditions bei Git
- **Überblick behalten**: Ich weiß immer wer was macht
- **Probleme früh erkennen**: Wenn einer hängt, merke ich es sofort
- **Ressourcen schonen**: Nicht 5 Agenten gleichzeitig = weniger RAM/CPU

### Modi

#### 1. Assisted Mode (Standard)
```
Ich mache alles selbst
→ Code schreiben
→ Git commands
→ PR erstellen
→ Review
```

#### 2. Autonomous Mode (Sequenziell)
```
1. BackendAgent: "Mache Issue #1-4" → läuft allein
   [WARTEN bis fertig]
   
2. FrontendAgent: "Mache Issue #5-8" → läuft allein  
   [WARTEN bis fertig]
   
3. QAAgent: "Review PRs" → läuft allein
   [WARTEN bis fertig]
   
4. DocsAgent: "README" → läuft allein
```

**NICHT so:**
```
❌ Backend + Frontend parallel (gleichzeitig starten)
❌ Alle Agents auf einmal spawnen
```

### Toggle
| Befehl | Modus |
|--------|-------|
| "Arbeite autonom" | Agenten übernehmenTasks sequentiell |
| "Autonomous mode an" | Agenten dürfen selbst arbeiten |
| "Autonomous mode aus" | Ich mache alles selbst (default) |
| "Ich will das selbst machen" | Assisted mode |

**Red Flags im Autonomous Mode:**
- ❌ Mehrere Agenten gleichzeitig aktiv
- ❌ Agent startet ohne meine Bestätigung
- ❌ Parallel PRs von verschiedenen Agents
- ❌ Keine Health Checks zwischen Agents

**Best Practice:**
```
1. Agent spawnen
2. "Erledigt?" abwarten
3. Ergebnis prüfen (Health Check)
4. Erst dann nächster Agent
```

---

## 🧹 Post-Project Cleanup (NEU)

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

---

## 🧹 Post-Project Cleanup (NEU)

**Nach jedem Projekt (Phase 8):**

### Local Cleanup
```bash
# Temp-Dateien löschen
rm -rf ~/.openclaw/workspace-*/node_modules  # Alte node_modules
rm -rf ~/.openclaw/*/.cache                     # Caches
rm -rf ~/.openclaw/*/.log                       # Log-Dateien
rm -rf ~/.openclaw/*/tmp                        # Temp-Verzeichnisse

# Duplikate entfernen
rm -rf ~/repos/*                                # Falsche Pfade
rm -rf ~/.openclaw/workspace-*-*/               # Temp Agent-Workspaces

# Git aufräumen
git branch | grep -v "main\|master" | xargs git branch -d  # Alte Branches
```

### npm/pip Caches
```bash
# npm Cache
npm cache clean --force
rm -rf ~/.npm/_cacache

# pip Cache
pip cache purge
rm -rf ~/.cache/pip
```

### System Cleanup
```bash
# Alte Docker Images (falls verwendet)
docker system prune -f 2>/dev/null || true

# Papierkorb leeren
rm -rf ~/.local/share/Trash/*
```

### Verify
```bash
# Speicher prüfen
du -sh ~/.openclaw/* | sort -h | tail -10
du -sh ~ | head -1  # Gesamtspeicher
```

**Ziel:** ~2-3 GB frei nach jedem Projekt

---

## 🚀 Setup Checklist

- [ ] **Skills prüfen:** Vorhandene Tools in `skills/` und `TOOLS.md` suchen
- [ ] **Repo erstellen:** Ein Repo pro Projekt
- [ ] **GitHub Project:** Board + Views (OPTIONAL)
- [ ] **Labels:** Type, Priority, Size konfigurieren
- [ ] **Branch-Protection:** main protected, CI required
- [ ] **Workspaces:** 8 Agent-Workspaces einrichten
- [ ] **PR-Template:** Erstellen
- [ ] **Cleanup-Script:** Post-Project Cleanup einrichten
- [ ] **Test-Run:** Erstes Ticket durchlaufen

**Aufwand:** 3-4 Stunden

---

**Zusammenfassung:** Striktes 8-Phasen-Modell + 8 Agenten + GitHub Best Practice (Ein Repo = Ein Project) + Tool-Wiederverwendung + Health Checks + Post-Project Cleanup = Qualitativ hochwertige Software.

---

*Version: 2026-02-19*  
*Updates: Workspace-Isolation, PR-Prozess, Agent Health Checks, Lessons Learned, Autonomous Mode, Post-Project Cleanup*  
*Ein Project pro Repository | Tool-Wiederverwendung | 24/7 Development | GitHub = Source of Truth | Autonomous Sequentiell*
