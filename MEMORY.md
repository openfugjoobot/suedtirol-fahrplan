# MEMORY.md - Long-term Memory

## 🎛️ OpenFugjooBot - Dev Orchestrator

### Core Identity
- **Name:** OpenFugjooBot
- **Role:** DevOrchestrator (8-Agent Team Koordination)
- **Workspace:** Main (`workspace`)
- **Human:** Ivan (Deutsch bevorzugt)

---

## 🎯 8-Phasen Development Workflow

**WICHTIG: Bei jedem Session-Start WORKFLOW.md lesen!**

### Agenten-Team
| Agent | Workspace | Phase |
|-------|-----------|-------|
| DevOrchestrator (ich) | `workspace` | 0-8 |
| ResearchAgent | `workspace-research` | 1 |
| ArchitectAgent | `workspace-architect` | 2 |
| BackendAgent | `workspace-backend` | 4 |
| FrontendAgent | `workspace-frontend` | 4 |
| QAAgent | `workspace-qa` | 5 |
| DocsAgent | `workspace-docs` | 6 |
| DevOpsAgent | `workspace-devops` | 7 |

### Phasen (Strikt einhalten!)
1. **0. REQUIREMENTS** 🔴 - Pflicht! User-Bestätigung nötig!
2. **1. ANALYSIS** - ResearchAgent
3. **2. DESIGN** - ArchitectAgent
4. **3. PLANNING** - Subtasks erstellen
5. **4. IMPLEMENTATION** - Backend + Frontend parallel
6. **5. REVIEW** - QAAgent
7. **6. DOCUMENTATION** - DocsAgent
8. **7. DEPLOYMENT** - DevOpsAgent
9. **8. CLOSURE** - Memory-Update

### Regeln
- **Ein Repo = Ein Project** (GitHub Projects)
- **Phase 0 niemals überspringen!**
- **Tool-Wiederverwendung prüfen** vor Projektstart
- **Workspace-Regel:** Nur `workspace-*` (ohne Suffix) = gültig
- **📄 Alle Dokumente auf Englisch** (REQUIREMENTS, analysis, architecture, etc.)
- **📋 Project Board Status aktualisieren:** Backlog → Ready → In Progress → In Review → Done
- **🔴 CRITICAL: Bei jedem Issue-Status-Wechsel GitHub Project Board updaten!**

---

## ⚙️ Konfigurierte Skills

### Aktiv & Bereit
| Skill | Status | Bemerkung |
|-------|--------|-----------|
| `blogwatcher` | ✅ | 8 Südtirol RSS-Feeds |
| `tavily-search` | ✅ | Mit API Key |
| `github` | ✅ | Als `openfugjoobot` authed |
| `gog` | ✅ | Google Workspace ready |
| `weather` | ✅ | wttr.in |
| `healthcheck` | ✅ | Tägliche Cron-Jobs aktiv |
| `clawhub` | ✅ | Skill-Manager |
| `mcporter` | ✅ | MCP Server |

### Cron-Jobs (Healthcheck)
- **09:00** - Security-Audit
- **10:00** - Update-Check

---

## 🛠️ Tooling-Präferenzen

**Vor Projektstart immer:**
1. `skills/` prüfen
2. `TOOLS.md` prüfen
3. `clawhub search <keyword>`
4. Existierende Tools wiederverwenden!

**Wichtige Pfade:**
- `~/.openclaw/workspace/skills/`
- `~/.openclaw/credentials/`
- `~/.local/bin/blogwatcher`

---

## 📝 Session-Start Checklist

- [ ] SOUL.md lesen
- [ ] USER.md lesen
- [ ] WORKFLOW.md lesen (**Pflicht!**)
- [ ] MEMORY.md lesen (nur Main Session)
- [ ] `memory/YYYY-MM-DD.md` prüfen
- [ ] Aktive Cron-Jobs verifizieren

---

## 🔗 GitHub Organisation
- **URL:** https://github.com/openfugjoobot
- **Prinzip:** Ein Repo = Ein Project
- **Branch-Protection:** main protected
- **CI:** Required

---

## 🎯 Abgeschlossene Projekte

### 2026-02-19: Crypto Skill v1.1.0 — RSS-only News Aggregation
**Issue:** #25 (CryptoPanic API Key fehlt)  
**Lösung:** CryptoPanic entfernt, 5 RSS-Feeds implementiert  
**Agent Team:** ResearchAgent, ArchitectAgent, BackendAgent (×4), QAAgent, DocsAgent  
**Zeit:** ~34 Minuten (Phasen 0-8)  
**Ergebnis:**
- ✅ 3 neue RSS-Feeds: Decrypt, CryptoSlate, AMBCrypto
- ✅ URL-Canonicalization für Deduplizierung
- ✅ 92 Artikel/Abfrage (vorher ~30)
- ✅ Keine Auth-Key Abhängigkeit mehr
- **Retro:** `memory/RETRO-2026-02-19-crypto-rss.md`

---

*Last updated: 2026-02-19*
*Workflow v1.0 | 8-Agent System | GitHub Projects*
