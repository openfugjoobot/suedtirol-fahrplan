# ArchitectAgent Task: Südtirol Transit Architecture (REVISED)

## Project
**Name:** transit-suedtirol (suedtirol-fahrplan)  
**Phase:** 2 - DESIGN (REVISION: NO CACHING)  
**Input:** 
- /home/ubuntu/.openclaw/workspace/REQUIREMENTS.md
- /home/ubuntu/.openclaw/workspace/specs/suedtirol-fahrplan/analysis.md

## CRITICAL CONSTRAINT: NO CACHING IN V1.0
**Absolutely no caching layer.** Every request goes directly to the API.

Rationale:
- API has no rate limits detected
- Response times acceptable (under 1s)
- Real-time data must be fresh (delays, platform changes)
- Simpler code = fewer bugs, faster MVP
- Can add caching in v2.0 if needed

## Goal
Design the complete technical architecture. NO caching. Direct API calls only.

## Deliverable
Write architecture docs to: `/home/ubuntu/.openclaw/workspace/specs/suedtirol-fahrplan/architecture.md` (OVERWRITE existing)

## Module Structure (NO CACHE)
```
suedtirol-fahrplan/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios + retry (NO cache)
│   │   ├── stopfinder.js      # Direct API calls only
│   │   ├── trip.js            # Direct API calls only
│   │   └── departures.js      # Direct API calls only
│   ├── commands/
│   │   ├── trip.js
│   │   ├── departures.js
│   │   └── nlp.js
│   ├── utils/
│   │   ├── format.js          # Output formatting only
│   │   └── time.js            # Time/date parsing
│   └── index.js
├── bin/
│   ├── suedtirol-trip
│   └── suedtirol-departures
├── package.json
└── SKILL.md
```

## NO CACHE UTILITIES
- No cache.js file
- No TTL logic
- No memory maps for caching
- Simple direct API calls with axios

## Bilingual Support (Same as before)
- Parameter `odvSugMacro=true` REQUIRED for StopFinder
- Accept German AND Italian input
- Language preference in config

## API Client (NO CACHE)
```javascript
// Simple axios instance, no cache interceptors
const api = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb/',
  timeout: 10000
});
```

## Configuration (NO CACHE)
```json
{
  "language": "de",
  "api": {
    "baseUrl": "https://efa.sta.bz.it/apb",
    "timeout": 10000
  }
}
```

## Success Criteria
- [ ] Module structure defined WITHOUT cache.js
- [ ] API client documented (direct calls only)
- [ ] NO caching strategy section
- [ ] NO cache utilities
- [ ] architecture.md written (overwrites old version)

**REMEMBER: NO CACHING WHATSOEVER IN V1.0**
