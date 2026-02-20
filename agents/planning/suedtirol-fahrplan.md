# Phase 3: PLANNING - Südtirol Fahrplan

**Phase:** 3 - PLANNING  
**Date:** 2026-02-20  
**Status:** Complete ✅

---

## Subtask Breakdown

### Subtask 3.1: Project Structure
**Agent:** BackendAgent  
**Workspace:** workspace-backend  
**Files:**
- Create directory structure
- Initialize package.json
- Create README.md
- Setup Jest configuration

**Estimate:** 30 min

---

### Subtask 3.2: API Module
**Agent:** BackendAgent  
**Workspace:** workspace-backend  
**Files:**
- src/api/client.js - Axios with retry
- src/api/stopfinder.js - Stop search
- src/api/trip.js - Trip planning
- src/api/departures.js - DM service

**Tests:**
- test/api/client.test.js
- test/api/stopfinder.test.js (mocked)

**Estimate:** 60 min

---

### Subtask 3.3: Utils Module
**Agent:** BackendAgent  
**Workspace:** workspace-backend  
**Files:**
- src/utils/cache.js - Memory cache
- src/utils/time.js - Time parser
- src/utils/format.js - Output formatting
- src/utils/fuzzy.js - Stop matching

**Tests:**
- test/utils/cache.test.js
- test/utils/time.test.js
- test/utils/format.test.js

**Estimate:** 60 min

---

### Subtask 3.4: Commands Module
**Agent:** BackendAgent  
**Workspace:** workspace-backend  
**Files:**
- src/commands/trip.js - /trip handler
- src/commands/departures.js - /departures handler
- src/commands/nlp.js - Natural language parser

**Tests:**
- test/commands/trip.test.js (integration)
- test/commands/departures.test.js
- test/commands/nlp.test.js

**Estimate:** 90 min

---

### Subtask 3.5: CLI Integration
**Agent:** BackendAgent  
**Workspace:** workspace-backend  
**Files:**
- bin/suedtirol-trip - Trip CLI
- bin/suedtirol-departures - Departures CLI
- src/index.js - Main exports

**Estimate:** 30 min

---

## Task Dependencies

```
Subtask 3.1 (Structure)
    │
    ├───→ Subtask 3.2 (API)
    │     │
    │     ↓
    ├───→ Subtask 3.3 (Utils)
    │     │
    │     ↓
Subtask 3.4 (Commands)
    │
    ↓
Subtask 3.5 (CLI)
```

**Parallelization:**
- 3.2 and 3.3 can run in parallel after 3.1
- 3.4 depends on 3.2 and 3.3
- 3.5 depends on 3.4

---

## Implementation Order

1. **Sequential:** 3.1 → (3.2 + 3.3 parallel) → 3.4 → 3.5
2. **Total Estimate:** ~4 hours
3. **Agents Needed:** 1-2 BackendAgents

---

## Checklist Before Phase 4

- [x] Requirements documented
- [x] API analyzed
- [x] Architecture designed
- [x] Subtasks broken down
- [x] Estimates provided
- [x] Dependencies mapped

**Ready for Phase 4 (Implementation)**

---

## GitHub Issues

Track progress via GitHub issues:

1. #1: Setup project structure
2. #2: Implement API module
3. #3: Implement utils module  
4. #4: Implement commands
5. #5: CLI integration
6. #6: Tests and documentation

---

**Phase 3 Complete** ✅

Ready to spawn BackendAgents for Phase 4!

**Planned by:** DevOrchestrator  
**Date:** 2026-02-20
