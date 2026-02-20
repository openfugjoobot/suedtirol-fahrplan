# Phase 2: ARCHITECTURE - Südtirol Fahrplan

**Agent:** ArchitectAgent  
**Phase:** 2 - DESIGN  
**Date:** 2026-02-20  
**Status:** Complete ✅

---

## Overview

**Architecture Pattern:** Modular CLI + Telegram Skill  
**Language:** Node.js 18+ (ES Modules)  
**Package Manager:** npm  

**Key Dependencies:**
- `axios` - HTTP client
- `date-fns` - Date/time parsing
- `fuse.js` - Fuzzy matching (optional, use API first)

---

## Module Structure

```
suedtirol-fahrplan/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios instance with retry
│   │   ├── stopfinder.js      # StopFinder API wrapper
│   │   ├── trip.js            # TripRequest API wrapper
│   │   └── departures.js      # DM API wrapper
│   ├── commands/
│   │   ├── trip.js            # /trip command logic
│   │   ├── departures.js      # /departures logic  
│   │   └── nlp.js             # Natural language parser
│   ├── utils/
│   │   ├── cache.js           # Simple memory cache
│   │   ├── format.js          # Telegram/CLI formatting
│   │   ├── time.js            # Time/date parsing
│   │   └── fuzzy.js           # Stop matching
│   ├── config/
│   │   └── default.json       # Default configuration
│   └── index.js               # Main entry (exports)
├── bin/
│   ├── suedtirol-trip         # CLI: trip command
│   └── suedtirol-departures   # CLI: departures command
├── test/
│   ├── fixtures/              # Mock API responses
│   └── *.test.js              # Test files
├── package.json
└── README.md
```

---

## Component Design

### 1. API Client (src/api/client.js)
```javascript
// Singleton axios instance
const api = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb',
  timeout: 10000,
  headers: { 'Accept': 'application/json' }
});

// Retry interceptor for timeouts
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' && !error.config.__retry) {
      error.config.__retry = true;
      return api.request(error.config);
    }
    throw error;
  }
);
```

**Responsibilities:**
- HTTP configuration
- Retry logic
- Error transformation
- Response validation

---

### 2. StopFinder Module (src/api/stopfinder.js)
```javascript
// Find stops by partial name
export async function findStop(query, limit = 3) {
  // 1. Check cache first
  // 2. Call API if not cached
  // 3. Cache results for 24h
  // 4. Return array of matches
}

// Get stop ID from name
export async function resolveStop(name) {
  // Returns { id, name, quality }
  // Handles fuzzy matching, user selection
}
```

**Key Functions:**
- `findStop(query)` - Search stops
- `resolveStop(name)` - Get single best match

---

### 3. Trip Module (src/api/trip.js)
```javascript
// Search connections
export async function findTrip(options) {
  // options: { origin, destination, time, date, modes, exclude, longdistance }
  // Returns trip array
}
```

**Parameters:**
- `origin` - Start stop ID
- `destination` - End stop ID
- `time` - Departure time (optional)
- `date` - Date (optional)
- `modes` - Include modes array
- `exclude` - Exclude modes array
- `longdistance` - Include long-distance trains

---

### 4. Command Handlers

#### Trip Command (src/commands/trip.js)
```javascript
export async function tripCommand(args, options) {
  // 1. Parse origin/destination
  // 2. Parse time/date
  // 3. Parse modes
  // 4. Resolve stops (fuzzy)
  // 5. Call API
  // 6. Format output
}
```

#### Departures Command (src/commands/departures.js)
```javascript
export async function departuresCommand(stop, options) {
  // 1. Resolve stop
  // 2. Call DM API
  // 3. Format departures list
}
```

#### NLP Parser (src/commands/nlp.js)
```javascript
export function parseNaturalLanguage(text) {
  // Extract: origin, destination, time, modes
  // Return: { command, params }
}

// Patterns:
// "Wann fährt der Bus nach Meran?" → { command: 'trip', modes: ['bus'] }
// "Abfahrten von Bolzano" → { command: 'departures', stop: 'Bolzano' }
```

---

### 5. Utils

#### Cache (src/utils/cache.js)
```javascript
// Simple in-memory cache with TTL
const cache = new Map();

export function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

export function set(key, value, ttlSeconds) {
  cache.set(key, { value, expiry: Date.now() + (ttlSeconds * 1000) });
}

// TTL: stops=24h, trips=5min, departures=1min
```

#### Time Parser (src/utils/time.js)
```javascript
// Parse various time formats
export function parseTime(input) {
  // Supports:
  // - "15:30" (absolute)
  // - "in 30min" (relative)
  // - "tomorrow" (date)
  // - "next monday"
  // Returns: { time: 'HH:MM', date: 'YYYYMMDD' }
}
```

#### Formatter (src/utils/format.js)
```javascript
// Format for Telegram
export function formatTripTelegram(trip) {
  // Return emoji + markdown string
}

// Format for CLI
export function formatTripCLI(trip) {
  // Return plain text / table
}

// Mode emoji map
const MODE_EMOJI = {
  train: '🚂',
  bus: '🚌',
  cable: '🚡'
};
```

---

## Data Flow

### Trip Command Flow
```
User Input
    │
    ▼
[Parser] ────┐
             │
    ┌────────┘
    ▼
[Resolve Stops] → Call StopFinder API → Cache result
    │
    ▼
[Trip API] → Call TripRequest → Parse response
    │
    ▼
[Formatter] → Apply emoji + markdown
    │
    ▼
Output to Telegram/CLI
```

### Natural Language Flow
```
Raw Text → Regex Match → Extract Entities → Build Command → Execute

Example: "Wann fährt der Bus nach Meran um 15 Uhr?"
  → Origin: current/default
  → Destination: Meran
  → Mode: bus
  → Time: 15:00
  → Command: /trip --modes bus at 15:00 "Bozen" "Meran"
```

---

## Configuration (src/config/default.json)

```json
{
  "api": {
    "baseUrl": "https://efa.sta.bz.it/apb",
    "timeout": 10000,
    "retries": 1
  },
  "cache": {
    "stops": 86400,
    "trips": 300,
    "departures": 60
  },
  "limits": {
    "stopResults": 3,
    "tripResults": 3,
    "departureResults": 5
  },
  "defaults": {
    "language": "de",
    "lineRestriction": 400,
    "maxChanges": 9
  }
}
```

---

## CLI Design

### Installation
```bash
npm install -g suedtirol-fahrplan
# or
npm link  # from source
```

### Commands
```bash
# Trip search
suedtirol-trip "Bozen" "Meran"
suedtirol-trip Bozen Meran at 15:30
suedtirol-trip from Bozen to Meran tomorrow modes bus
suedtirol-trip Bozen Meran exclude train

# Departures
suedtirol-departures "Bozen"
suedtirol-departures Bolzano at 18:00 modes train
```

---

## Error Handling Strategy

| Scenario | Action | Response |
|----------|--------|----------|
| API Timeout | Retry once, then error | "API nicht erreichbar" |
| Stop not found | Suggest alternatives | "Meinst du: ..." |
| Ambiguous stop | Present options | Inline buttons |
| No connections | Suggest different time | "Keine Verbindung, versuche später" |
| Invalid params | Show usage | "Usage: trip \u003corigin\u003e \u003cdestination\u003e" |

---

## Testing Strategy

### Unit Tests
- `utils/time.test.js` - Time parser
- `utils/fuzzy.test.js` - Stop matching
- `commands/nlp.test.js` - NLP parser

### Integration Tests
- `api/client.test.js` - Mocked axios
- `commands/trip.test.js` - Full flow

### Mock Data
```javascript
// test/fixtures/stop-finder.json
// test/fixtures/trip-response.json
// test/fixtures/departures.json
```

---

## Security Considerations

- No API key required (public API)
- Input validation (URL encoding)
- Rate limiting recommendation (max 10 req/min)
- No user data stored

---

## Performance Targets

- API response: < 2s
- Stop resolution: < 500ms (with cache)
- CLI startup: < 100ms
- Memory usage: < 50MB

---

**Phase 2 Complete** ✅

Ready for Phase 3 (Planning)

**Designed by:** ArchitectAgent  
**Date:** 2026-02-20
