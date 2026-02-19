# WORKFLOW.md - AI Team Development Workflow

_8-Agent-Team, 8-Phasen-Workflow. Ein Repo = Ein Project._

---

## 🏗️ Agenten & Workspaces

| Agent | Rolle | Workspace | Phase |
|-------|-------|-----------|-------|
| **DevOrchestrator** | Koordination | `workspace` | 0-8 |
| **ResearchAgent** | Tech-Research | `workspace-research` | 1 |
| **ArchitectAgent** | System-Design | `workspace-architect` | 2 |
| **BackendAgent** | Backend | `workspace-backend` | 4 |
| **FrontendAgent** | Frontend/Bot | `workspace-frontend` | 4 |
| **QAAgent** | Review | `workspace-qa` | 5 |
| **DocsAgent** | Dokumentation | `workspace-docs` | 6 |
| **DevOpsAgent** | Deploy | `workspace-devops` | 7 |

### Workspace-Regeln (KRITISCH)
- **NUR in `.openclaw/workspace-*` entwickeln** – nie in Home oder /tmp
- **GitHub ist Source of Truth** – Code sofort pushen (`git push` nach jedem Commit)
- Nach Agent-Completion: `git status` prüfen

---

## 📋 8-Phasen-Workflow

| Phase | Owner | Output | Wichtig |
|-------|-------|--------|---------|
| **0. REQUIREMENTS** 🔴 | DevOrchestrator + User | `REQUIREMENTS.md` | User muss **schriftlich** bestätigen |
| **1. ANALYSIS** | ResearchAgent | `specs/analysis.md` | API, Datenquellen |
| **2. DESIGN** | ArchitectAgent | `specs/architecture.md` | Tech Stack, DB Schema |
| **3. PLANNING** | DevOrchestrator | GitHub Issues | Subtasks mit Abhängigkeiten |
| **4. IMPLEMENTATION** | Backend + Frontend | Code + Tests | **Sequentiell**, nicht parallel! |
| **5. REVIEW** | QAAgent | Review-Report | `gh pr review` |
| **6. DOCUMENTATION** | DocsAgent | README, SKILL.md | PR ergänzen |
| **7. DEPLOYMENT** | DevOrchestrator | Bot läuft | Integration in Session |
| **8. CLOSURE** | DevOrchestrator | Retro + Cleanup | `~/.openclaw/workspace/memory/RETROSPECTIVE-*.md` |

---

## 🔗 GitHub Workflow (KRITISCH)

### Sprache / Language (KRITISCH)
**Alle Outputs für GitHub AUSSCHLIESSLICH auf Englisch:**
- Issues → Englisch
- PR Titel & Beschreibungen → Englisch  
- Commit Messages → Englisch
- Code Kommentare → Englisch
- Dokumentation (README, docs) → Englisch

*Kommunikation im Chat (Telegram) bleibt auf Deutsch wie vom User gewünscht.*

### PR-Prozess
```
main (protected)
  ↑
  feature/issue-#-description  ← git checkout -b feature/...
  ↑
  git push -u origin feature/...
  ↑
  gh pr create --title "type: desc" --body "Closes #issue"
  ↑
  [WARTEN auf Review]
  ↑
  gh pr merge --squash
  ↑
  git branch -d feature/...
```

**Agenten dürfen NIEMALS selbst mergen!**

### Labels
- **Type:** `bug`, `feature`, `documentation`
- **Priority:** `p0-critical`, `p1-high`, `p2-medium`
- **Size:** `xs`, `s`, `m`, `l`, `xl`

---

## 🩺 Agent Health Checks

**Nach JEDER Agent-Completion:**

```bash
git status              # Files committed?
ls -la src/             # Erwartete Files da?
gh pr list              # PR erstellt?
git log --oneline -3    # Letzte Commits
```

**Red Flags:**
- ❌ "Fertig" aber keine Dateien
- ❌ Code im falschen Verzeichnis (~/repos/ statt ~/.openclaw/)
- ❌ Kein PR auf GitHub

---

## 🤖 Autonomous Mode

### Sequentiell, nicht parallel!

**Assisted (Default):** Ich mache alles selbst.

**Autonomous:** Agent übernimmt → Warten → Ergebnis prüfen → Nächster Agent.

```
❌ Backend + Frontend gleichzeitig starten
❌ Mehrere Agenten parallel aktiv
✅ Ein Agent nach dem anderen
```

**Toggle:** `Arbeite autonom` / `Autonomous mode an` / `Autonomous mode aus`

---

## 🧹 Post-Project Cleanup (Phase 8)

```bash
# Temp-Dateien
rm -rf ~/.openclaw/workspace-*/node_modules
rm -rf ~/.openclaw/*/.cache
rm -rf ~/repos/*

# Caches
rm -rf ~/.npm/_cacache
rm -rf ~/.cache/pip

# Verify
du -sh ~/.openclaw/* | sort -h | tail -5
du -sh ~ | head -1
```

**Ziel:** ~2 GB frei nach jedem Projekt

---

## 💡 Lessons Learned

### 1. Circular Dependencies
**Falsch:** `const db = require('./index').getDatabase()`

**Richtig:** Separate `connection.js`, dann `require('../connection')`

### 2. Pfad-Probleme
**Falsch:** `require('../utils/logger')` aus `src/db/repositories/`

**Richtig:** `require('../../utils/logger')` (relativ zur Datei)

### 3. Agent Output
**Problem:** Agent sagt "Erfolg", aber keine Files.

**Fix:** Immer `git status` + `ls -la` nach Agent prüfen.

### 4. Telegram Bot 409
**Fix:** Integration in OpenClaw Session (Ich bin der Bot), nicht separater Prozess.

---

## ⚙️ Entscheidungen

| Situation | Aktion |
|-----------|--------|
| Bugfixes, Refactoring <50 LOC | ✅ Auto |
| Architektur-Änderungen, neue Dependencies | ⚠️ INFO |
| Breaking Changes, Security, DB-Migrationen | 🛑 FRAG |

---

*Version: 2026-02-19 | Workspace-Isolation | Sequentiell | GitHub = Source of Truth*
