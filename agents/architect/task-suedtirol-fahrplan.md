# ArchitectAgent Task: Südtirol Transit Architecture

## Project
**Name:** transit-suedtirol (suedtirol-fahrplan)  
**Phase:** 2 - DESIGN  
**Input:** 
- /home/ubuntu/.openclaw/workspace/REQUIREMENTS.md
- /home/ubuntu/.openclaw/workspace/specs/suedtirol-fahrplan/analysis.md

## Goal
Design the complete technical architecture. Define module structure, data flow, error handling, and CLI/Telegram interfaces.

**IMPORTANT: No caching in v1.0** - Keep it simple. API has no rate limits, responses are fast. Add later if needed.

## Critical Findings (Update Analysis!)
**Bilingual Support is FULLY WORKING:**
- Parameter `odvSugMacro=true` is **REQUIRED** for all StopFinder searches
- Without it: returns empty (both languages fail)
- With it: German names work perfectly ("Brixen" → quality 905!)
- API returns bilingual names: "Bahnhof Brixen / Stazione Bressanone"

## Deliverable
Write architecture docs to: `/home/ubuntu/.openclaw/workspace/specs/suedtirol-fahrplan/architecture.md`

## Design Tasks

### 1. Module Structure
```
suedtirol-fahrplan/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios + retry
│   │   ├── stopfinder.js      # Stop search (WITH odvSugMacro=true!)
│   │   ├── trip.js            # Route planning
│   │   └── departures.js      # DM request
│   ├── commands/
│   │   ├── trip.js
│   │   ├── departures.js
│   │   └── nlp.js             # Natural language parser
│   ├── utils/
│   │   ├── format.js          # Output formatting
│   │   └── time.js            # Time/date parsing
│   │   # Note: cache.js optional (v1.0 keeps it simple, no caching)
│   └── index.js
├── bin/
│   ├── suedtirol-trip
│   └── suedtirol-departures
├── package.json
└── SKILL.md
```

### 2. Bilingual Name Handling
- Accept both German AND Italian input
- Store preferred language in config.json
- Output matches input language (German → German names)
- Fallback: show both names

### 3. API Client Design
- Base URL: https://efa.sta.bz.it/apb/
- Timeout: 10000ms
- Retry: 1x on timeout
- Always use `outputFormat=json`
- **CRITICAL:** StopFinder MUST include `odvSugMacro=true`

### 4. Caching (Optional / Future Enhancement)
**Decision: No caching in v1.0** (YAGNI principle)

Rationale:
- API has no strict rate limits
- Response times are acceptable (74-550ms)
- Real-time data (delays) would become stale
- Simpler code = fewer bugs, faster implementation

If needed later:
| Data | TTL | Rationale |
|------|-----|-----------|
| Stop lookups | 24h | Static reference |
| Trip results | 5min | Schedule-based |
| Departures | ❌ never | Real-time only |

### 5. Command Interface

#### CLI
```bash
# Trip search
suedtirol-trip "Brixen" "Bozen"
suedtirol-trip Brixen Bozen at 15:30
suedtirol-trip Brixen Bozen modes train
suedtirol-trip Brixen Bozen exclude bus

# Departures
suedtirol-departures "Brixen"
suedtirol-departures Brixen at 18:00 modes bus
```

#### Telegram
```
/trip Brixen Bozen
/trip Brixen Bozen at 15:30 tomorrow
/departures Brixen
```

### 6. Output Format
Use emoji + markdown:
- 🚂 Train/RJ/EC/R
- 🚌 Bus
- 🚡 Cable car
- ⏱️ Duration
- 🚨 Delay (if rtValid)
- 📍 Platform

### 7. Error Handling
| Scenario | Response |
|----------|----------|
| Stop not found | Suggest alternatives with inline buttons |
| No connections | "Keine Verbindungen. Andere Zeit prüfen." |
| API timeout | Retry 1x, then "API nicht erreichbar" |
| Ambiguous stop | Present top 3 matches |

### 8. Configuration
```json
{
  "language": "de",
  "api": {
    "baseUrl": "https://efa.sta.bz.it/apb",
    "timeout": 10000
  }
  # Note: caching config omitted in v1.0 (not needed)
}
```

## Success Criteria
- [ ] Module structure defined (no cache module in v1.0)
- [ ] Bilingual support documented
- [ ] API client pattern with retry
- [ ] CLI command structure
- [ ] Telegram formatting rules
- [ ] Error handling matrix
- [ ] architecture.md written to specs folder

Start work immediately. Reference the corrected bilingual findings!
