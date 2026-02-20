# Architecture for Südtirol Transit Skill

## Overview

**Architecture Pattern:** Modular CLI + Telegram Integration  
**Language:** Node.js 18+ (ES Modules)  
**Key Libraries:**
- `axios` - HTTP client
- `date-fns` - Date/time parsing
- `commander` or `minimist` - CLI parsing

---

## Module Structure

```
transit-suedtirol/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios wrapper with config
│   │   ├── stopfinder.js      # StopFinder endpoint
│   │   ├── trip.js            # TripRequest endpoint
│   │   └── departures.js      # DM endpoint
│   ├── commands/
│   │   ├── trip.js            # /trip command handler
│   │   ├── departures.js      # /departures handler
│   │   └── nlp.js             # Natural language parser
│   ├── utils/
│   │   ├── cache.js           # Simple memory cache
│   │   ├── format.js          # Output formatting (emoji, tables)
│   │   ├── time.js            # Time/date parser
│   │   └── fuzzy.js           # Stop matching wrapper
│   └── index.js               # Main entry (CLI exports)
├── bin/
│   ├── trip                   # CLI: trip command
│   └── departures             # CLI: departures command
├── package.json
└── README.md
```

---

## Data Flow

### Command Flow
```
User Input
    │
    ▼
[Parser] - Parse command/NL
    │
    ▼
[Stop Resolver] - Fuzzy match origin/destination
    │
    ▼
[API Client] - Call EFA endpoint
    │
    ▼
[Formatter] - Format response with emoji/tables
    │
    ▼
Output (Telegram or CLI)
```

### Natural Language Flow
```
"Wann fährt der Bus nach Meran?"
    │
    ▼
[NLP Parser]
  - Extract origin (current context or default)
  - Extract destination ("Meran")
  - Extract mode ("Bus")
  - Extract time ("next" → now)
    │
    ▼
Build: { command: 'trip', origin: 'Bozen', destination: 'Meran',
         modes: ['bus'], time: Date.now() }
```

---

## API Client Design

### Axios Configuration
```javascript
// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb',
  timeout: 10000,
  headers: { 'Accept': 'application/json' }
});

// Retry on timeout
client.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' && !error.config.__retry) {
      error.config.__retry = true;
      return client.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Caching Strategy
- **Stop searches:** 24 hours (stops rarely change)
- **Trip results:** 5 minutes (times change frequently)
- **Departures:** 1 minute (live data)
- **Cache key:** `endpoint:${JSON.stringify(params)}`

---

## Fuzzy Matching

### Approach
1. **First:** Check local cache for exact match
2. **Second:** Call EFA StopFinder API with search term
3. **Third:** Present top 3 results to user (Telegram inline buttons)
4. **Store:** Remember user's selection for session

### Example Flow
```
User: /trip Bozen Miran
Bot: [Search EFA for "Miran"]
     [Results: Merano, Meltina, Marlengo]
Bot: "Mehrere Treffer. Bitte wählen:"
     [Merano, Stazione di Merano] [Meltina] [Marlengo]
User: [Clicks Merano]
Bot: [Proceed with trip query using Merano ID]
```

---

## Time/Date Parsing

### Parser Implementation
```javascript
// src/utils/time.js
import { parse, format, addMinutes, addDays } from 'date-fns';

const PATTERNS = [
  { regex: /^(\d{1,2}):(\d{2})$/, parser: 'hh:mm' },
  { regex: /^in (\d+) min/, parser: 'relative_minutes' },
  { regex: /^tomorrow/, parser: 'tomorrow' },
  { regex: /^next (monday|tuesday|...)/, parser: 'next_day' },
  { regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, parser: 'dd.mm.yyyy' }
];

export function parseTime(input) {
  // Returns { time: 'HH:MM', date: 'YYYYMMDD' }
}
```

### Supported Formats
- `15:30` - Absolute time
- `3:30 PM` - AM/PM format
- `in 30 min` - Relative minutes
- `tomorrow` - Next day
- `next monday` - Day of week
- `22.02.2026` - German date
- `now` - Current time

---

## Output Formatting

### Telegram Format
```
🚂 Verbindung gefunden

R 17179 Treno regionale
20:01 — 20:44  (43 Min)

📍 Bolzano Stazione → Merano Stazione
🚉 Gleis 4 → Gleis 3

[Details anzeigen] [Alternative]
```

### CLI Format
```
$ trip Bozen Meran

R 17179 Treno regionale
  20:01  Bolzano, Stazione di Bolzano
  20:07  Bolzano Sud - Fiera
  ...
  20:44  Merano, Stazione di Merano

Duration: 43 minutes
Price: from €3.96
```

### Mode Emoji Map
| Mode | Emoji | German |
|------|-------|--------|
| train | 🚂 | Zug |
| bus | 🚌 | Bus |
| cable | 🚡 | Seilbahn |
| walk | 🚶 | Fußweg |

---

## Configuration

### Default Config (config.json)
```json
{
  "language": "de",
  "api": {
    "baseUrl": "https://efa.sta.bz.it/apb",
    "timeout": 10000
  },
  "cache": {
    "stops": 86400,
    "trips": 300,
    "departures": 60
  },
  "defaults": {
    "maxResults": 3,
    "maxDepartures": 5,
    "lineRestriction": 400
  }
}
```

---

## Error Handling

### Error Types & Responses
| Error | CLI Response | Telegram Response |
|-------|-------------|-------------------|
| API Timeout | "API nicht erreichbar. Bitte später erneut versuchen." | ⏱️ API Timeout. Retry? |
| Stop not found | "Haltestelle nicht gefunden. Verfügbare: [list]" | Inline buttons: Suggestions |
| No connections | "Keine Verbindungen für diese Zeit." | Try +30min? [Ja] [Nein] |
| Invalid params | Usage hint | Command format hint |

---

## Testing Strategy

### Unit Tests
- `utils/time.test.js` - Time parser
- `utils/fuzzy.test.js` - Stop matching
- `nlp/parser.test.js` - Natural language

### Integration Tests
- `api/client.test.js` - Mocked axios calls
- `commands/trip.test.js` - Full command flow

### Test Data
- Mock responses in `test/fixtures/`
- Sample stop lists
- Trip response examples

---

## CLI Integration

### Package.json Bin
```json
{
  "bin": {
    "sudtirol-trip": "./bin/trip",
    "sudtirol-departures": "./bin/departures"
  }
}
```

### Usage
```bash
$ sudtirol-trip "Bozen" "Meran" at 15:30
$ sudtirol-departures "Stazione di Bolzano" modes train
```

---

**Status:** Phase 2 Complete ✅  
**Next:** Phase 3 (Planning - subtask creation)

**Designed by:** ArchitectAgent  
**Date:** 2026-02-20
