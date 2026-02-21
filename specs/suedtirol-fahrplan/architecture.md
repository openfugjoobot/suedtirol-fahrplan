# Südtirol Transit Skill - Architecture Document

**Project:** transit-suedtirol  
**Phase:** 2 - DESIGN  
**Version:** 1.0.0 (NO CACHE)  
**Date:** 2026-02-21  

---

## 1. Overview

This document defines the complete technical architecture for the Südtirol Transit Skill, enabling real-time public transport queries via CLI and Telegram using the STA (Strutture Trasporto Alto Adige) EFA API.

### Key Design Principles
- **NO CACHING:** Every API call goes directly to EFA - real-time data is always fresh
- **Bilingual First:** Native support for German/Italian input and output
- **Simple:** No cache layer, no TTL logic, no memory management
- **Resilient:** Retry logic for transient failures
- **User-Friendly:** Fuzzy matching and natural language parsing

### Why No Caching in V1.0?
1. **API has no rate limits detected** - Safe to call directly every time
2. **Response times acceptable** - StopFinder: 74ms, Trip: 550ms, Departures: 175ms
3. **Real-time data must be fresh** - Delays, platform changes, cancellations
4. **Simpler code = fewer bugs** - No cache invalidation issues
5. **Faster MVP** - Can add caching in v2.0 if needed

---

## 2. Module Structure (NO CACHE)

```
suedtirol-fahrplan/
├── src/
│   ├── api/
│   │   ├── client.js          # Simple axios instance (NO cache)
│   │   ├── stopfinder.js      # Direct StopFinder calls
│   │   ├── trip.js            # Direct Trip calls
│   │   └── departures.js      # Direct DM calls
│   ├── commands/
│   │   ├── trip.js            # /trip command handler
│   │   ├── departures.js      # /departures command handler
│   │   └── nlp.js             # Natural language query parser
│   ├── utils/
│   │   ├── format.js          # Output formatting (emoji + markdown)
│   │   └── time.js            # Time/date parsing utilities
│   ├── config/
│   │   └── defaults.js        # Default configuration
│   └── index.js               # Main entry point
├── bin/
│   ├── suedtirol-trip         # CLI: trip search
│   └── suedtirol-departures   # CLI: departures monitor
├── package.json
└── SKILL.md                   # User documentation
```

**NOTE:** No `cache/` directory, no `utils/cache.js`, no TTL logic.

---

## 3. Bilingual Name Handling

### 3.1 Core Strategy

The API returns **bilingual names by default** when using `odvSugMacro=true`:
```
"Bahnhof Brixen / Stazione Bressanone"
"Bozen Bahnhof / Bolzano Stazione"
```

### 3.2 Input Processing Pipeline

```
User Input (de/it)
      ↓
[Language Detection]
      ↓
[StopFinder with odvSugMacro=true]  ← DIRECT API CALL
      ↓
[Match Quality Scoring]
      ↓
[Return Bilingual Result]
      ↓
[Language-Specific Output]
```

### 3.3 Name Matching Logic

```javascript
// The API accepts BOTH languages with odvSugMacro=true
// "Brixen" → quality 905 ✓
// "Bressanone" → quality 905 ✓
// "Bozen" → quality 957 ✓
// "Bolzano" → quality 957 ✓

// Implementation pattern:
async function findStop(query, preferredLang = 'de') {
  const params = {
    name_sf: query,
    odvSugMacro: 'true',  // CRITICAL: Required for German names!
    outputFormat: 'json'
  };
  
  // Direct API call - no caching
  const response = await apiClient.get('XML_STOPFINDER_REQUEST', { params });
  return parseStopFinderResponse(response.data);
}
```

### 3.4 Output Formatting by Language

| Preferred Language | Output Format | Example |
|-------------------|---------------|---------|
| German (de) | German-first | "Brixen Bahnhof" |
| Italian (it) | Italian-first | "Stazione Bressanone" |
| Both | Full bilingual | "Brixen / Bressanone" |

### 3.5 Name Parser Utility

```javascript
// Parse bilingual names into components
function parseBilingualName(name) {
  // Pattern: "German Name / Italian Name"
  const parts = name.split('/').map(p => p.trim());
  return {
    full: name,
    de: parts[0] || name,
    it: parts[1] || parts[0] || name,
    hasBoth: parts.length >= 2
  };
}
```

---

## 4. API Client Architecture (NO CACHE)

### 4.1 Simple Client Configuration

```javascript
// src/api/client.js
const axios = require('axios');

const API_CONFIG = {
  baseURL: 'https://efa.sta.bz.it/apb/',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'OpenClaw/suedtirol-transit/1.0'
  }
};

// Simple axios instance - NO cache interceptors
const client = axios.create(API_CONFIG);

// Simple retry on transient errors
client.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // Only retry once on timeout or network errors
    if (!config.__retryCount && isRetryableError(error)) {
      config.__retryCount = 1;
      await new Promise(r => setTimeout(r, 1000)); // 1s delay
      return client.request(config);
    }
    
    return Promise.reject(error);
  }
);

function isRetryableError(error) {
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    (error.response && error.response.status >= 500)
  );
}

module.exports = client;
```

### 4.2 Endpoint Wrappers

#### StopFinder (CRITICAL: Always use odvSugMacro=true!)

```javascript
// src/api/stopfinder.js
const client = require('./client');

/**
 * Search for stops - DIRECT API CALL, NO CACHING
 * @param {string} query - Stop name to search
 * @param {object} options - Optional parameters
 * @returns {Promise<Array>} Array of matching stops
 */
async function searchStops(query, options = {}) {
  const params = {
    name_sf: query,
    odvSugMacro: 'true',     // REQUIRED for bilingual support!
    outputFormat: 'json',
    ...options
  };
  
  // DIRECT call to EFA API - no cache layer
  const response = await client.get('XML_STOPFINDER_REQUEST', { params });
  return parseStopFinderResponse(response.data);
}

function parseStopFinderResponse(data) {
  const points = data?.stopFinder?.points;
  if (!points) return [];
  
  // Single result comes as object, multiple as array
  const pointsArray = Array.isArray(points) ? points : [points];
  
  return pointsArray.map(point => ({
    id: point.stateless || point.ref?.id,
    name: point.name,
    place: point.ref?.place,
    quality: parseInt(point.quality, 10),
    type: point.anyType,
    modes: point.modes?.split(',').map(Number) || [],
    coords: point.ref?.coords
  }));
}

module.exports = { searchStops };
```

#### Trip Request

```javascript
// src/api/trip.js
const client = require('./client');
const { buildTripOptions, buildTimeParams } = require('../utils/time');

/**
 * Plan a trip between two stops - DIRECT API CALL
 * @param {string} origin - Origin stop ID or name
 * @param {string} destination - Destination stop ID or name
 * @param {object} options - Trip options (time, date, modes, etc.)
 * @returns {Promise<Array>} Array of trip options
 */
async function planTrip(origin, destination, options = {}) {
  const params = {
    name_origin: origin,
    type_origin: 'any',
    name_destination: destination,
    type_destination: 'any',
    calcNumberOfTrips: options.limit || 3,
    outputFormat: 'json',
    ...buildTimeParams(options),
    ...buildTripOptions(options)
  };
  
  // DIRECT call - no caching
  const response = await client.get('XML_TRIP_REQUEST2', { params });
  return parseTripResponse(response.data);
}

function parseTripResponse(data) {
  const trips = data?.tripRoutes?.trips;
  if (!trips) return [];
  
  const tripsArray = Array.isArray(trips) ? trips : [trips];
  
  return tripsArray.map(trip => ({
    duration: trip.duration,
    distance: parseInt(trip.distance, 10),
    interchanges: parseInt(trip.interchange, 10),
    legs: parseLegs(trip.legs),
    fare: parseFare(trip.itdFare)
  }));
}

function parseLegs(legs) {
  if (!legs) return [];
  const legsArray = Array.isArray(legs) ? legs : [legs];
  
  return legsArray.map(leg => ({
    mode: leg.mode?.product,
    line: leg.mode?.number,
    direction: leg.mode?.destination,
    departure: {
      time: leg.departure?.time,
      date: leg.departure?.date,
      stop: leg.departure?.stop?.name,
      platform: leg.departure?.platform
    },
    arrival: {
      time: leg.arrival?.time,
      date: leg.arrival?.date,
      stop: leg.arrival?.stop?.name,
      platform: leg.arrival?.platform
    },
    delay: leg.delay?.minutes ? parseInt(leg.delay.minutes, 10) : null
  }));
}

function parseFare(fare) {
  if (!fare) return null;
  return {
    currency: fare.currency,
    standard: fare.standard,
    reduced: fare.reduced
  };
}

module.exports = { planTrip };
```

#### Departures Monitor

```javascript
// src/api/departures.js
const client = require('./client');
const { buildTimeParams } = require('../utils/time');

/**
 * Get departures for a stop - DIRECT API CALL, NO CACHING
 * Real-time data - must be fresh every call
 * @param {string} stopId - Stop ID or name
 * @param {object} options - Options (time, limit, modes)
 * @returns {Promise<Array>} Array of departures
 */
async function getDepartures(stopId, options = {}) {
  const params = {
    name_dm: stopId,
    type_dm: 'stop',
    limit: options.limit || 8,
    outputFormat: 'json',
    ...buildTimeParams(options)
  };
  
  // DIRECT call - real-time data, NO caching
  const response = await client.get('XML_DM_REQUEST', { params });
  return parseDeparturesResponse(response.data);
}

function parseDeparturesResponse(data) {
  const departures = data?.dm?.departureList;
  if (!departures) return [];
  
  const depsArray = Array.isArray(departures) ? departures : [departures];
  
  return depsArray.map(dep => ({
    line: dep.mode?.number,
    lineName: dep.mode?.name,
    product: dep.mode?.product,
    direction: dep.mode?.destination,
    scheduledTime: dep.depDateTime?.time,
    scheduledDate: dep.depDateTime?.date,
    platform: dep.depPlatform,
    delay: dep.delay?.minutes ? parseInt(dep.delay.minutes, 10) : null,
    realTime: dep.rtValid ? true : false
  }));
}

module.exports = { getDepartures };
```

### 4.3 Transport Mode Mapping

```javascript
// src/config/defaults.js - included in config

const MODE_CODES = {
  train: [0, 1, 11, 15],      // Rail, S-Bahn, Regional Train
  bus: [3, 5, 6, 17],         // Bus, Regional Bus, City Bus, SASA
  cable: [7, 8],              // Cable Car, Ropeway
  tram: [4],
  ferry: [9]
};

const MODE_NAMES = {
  de: { train: 'Zug', bus: 'Bus', cable: 'Seilbahn' },
  it: { train: 'Treno', bus: 'Autobus', cable: 'Funivia' }
};

/**
 * Build excludedMeans parameter for API
 * @param {string[]} include - Modes to include ['train', 'bus']
 * @param {string[]} exclude - Modes to exclude ['cable']
 * @returns {string} Comma-separated exclusions
 */
function buildExcludedMeans(include = [], exclude = []) {
  const allModes = ['train', 'bus', 'cable', 'tram', 'ferry'];
  
  // If include specified, exclude everything else
  let excluded = exclude;
  if (include.length > 0) {
    excluded = allModes.filter(m => !include.includes(m));
  }
  
  // Map to EFA codes
  const codes = excluded.flatMap(mode => MODE_CODES[mode] || []);
  
  return codes.length > 0 ? codes.join(',') : undefined;
}

module.exports = { MODE_CODES, MODE_NAMES, buildExcludedMeans };
```

---

## 5. Utility Modules

### 5.1 Time Utilities (NO CACHE - NO TIME CACHE EITHER)

```javascript
// src/utils/time.js

/**
 * Parse natural language time expressions
 * @param {string} timeStr - Time expression ("15:30", "in 30 min", "jetzt")
 * @returns {object} { hours, minutes, absolute }
 */
function parseTime(timeStr) {
  if (!timeStr || timeStr === 'now' || timeStr === 'jetzt') {
    return { type: 'now' };
  }
  
  // "15:30" or "15.30"
  const timeMatch = timeStr.match(/^(\d{1,2})[:\.](\d{2})$/);
  if (timeMatch) {
    return {
      type: 'absolute',
      hours: parseInt(timeMatch[1], 10),
      minutes: parseInt(timeMatch[2], 10)
    };
  }
  
  // "in 30 min" or "in 30 Minuten"
  const relativeMatch = timeStr.match(/in\s+(\d+)\s*(?:min|minutes?|Minuten?)/i);
  if (relativeMatch) {
    return {
      type: 'relative',
      minutes: parseInt(relativeMatch[1], 10)
    };
  }
  
  return { type: 'now' };
}

/**
 * Parse natural language date expressions
 * @param {string} dateStr - Date expression ("tomorrow", "22.02.2026")
 * @returns {object} { day, month, year }
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'today' || dateStr === 'heute') {
    return { type: 'today' };
  }
  
  if (dateStr === 'tomorrow' || dateStr === 'morgen') {
    return { type: 'tomorrow' };
  }
  
  // "22.02.2026" or "22/02/2026"
  const dateMatch = dateStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})$/);
  if (dateMatch) {
    return {
      type: 'absolute',
      day: parseInt(dateMatch[1], 10),
      month: parseInt(dateMatch[2], 10),
      year: parseInt(dateMatch[3], 10)
    };
  }
  
  return { type: 'today' };
}

/**
 * Build API time parameters
 * @param {object} options - { at: timeStr, on: dateStr }
 * @returns {object} { itdTime, itdDate }
 */
function buildTimeParams(options = {}) {
  const params = {};
  const now = new Date();
  
  if (options.at) {
    const time = parseTime(options.at);
    if (time.type === 'absolute') {
      params.itdTime = `${String(time.hours).padStart(2, '0')}${String(time.minutes).padStart(2, '0')}`;
    } else if (time.type === 'relative') {
      const future = new Date(now.getTime() + time.minutes * 60000);
      params.itdTime = `${String(future.getHours()).padStart(2, '0')}${String(future.getMinutes()).padStart(2, '0')}`;
    }
  }
  
  if (options.on) {
    const date = parseDate(options.on);
    if (date.type === 'tomorrow') {
      const tomorrow = new Date(now.getTime() + 86400000);
      params.itdDate = formatApiDate(tomorrow);
    } else if (date.type === 'absolute') {
      params.itdDate = `${date.year}${String(date.month).padStart(2, '0')}${String(date.day).padStart(2, '0')}`;
    }
  }
  
  return params;
}

function formatApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Build trip-specific options
 */
function buildTripOptions(options = {}) {
  const params = {};
  
  // Mode filtering
  const excludedMeans = buildExcludedMeansFunc(options.modes, options.exclude);
  if (excludedMeans) {
    params.excludedMeans = excludedMeans;
  }
  
  // Long-distance trains
  if (options.longdistance) {
    params.lineRestriction = 401; // Include ICE, EC, RJ
  } else {
    params.lineRestriction = 400; // Regional only
  }
  
  return params;
}

// Helper in this file
function buildExcludedMeansFunc(include, exclude) {
  const MODE_CODES = {
    train: [0, 1, 11, 15],
    bus: [3, 5, 6, 17],
    cable: [7, 8]
  };
  
  const allModes = ['train', 'bus', 'cable'];
  let excluded = exclude || [];
  
  if (include && include.length > 0) {
    excluded = allModes.filter(m => !include.includes(m));
  }
  
  const codes = excluded.flatMap(mode => MODE_CODES[mode] || []);
  return codes.length > 0 ? codes.join(',') : undefined;
}

module.exports = { parseTime, parseDate, buildTimeParams, buildTripOptions };
```

### 5.2 Format Utilities

```javascript
// src/utils/format.js

const EMOJI = {
  train: '🚂',
  bus: '🚌',
  cable: '🚡',
  walk: '🚶',
  delay: '🚨',
  platform: '📍',
  transfer: '🔄',
  duration: '⏱️',
  money: '💶',
  warning: '⚠️',
  info: 'ℹ️'
};

const MODE_NAMES = {
  de: { train: 'Zug', bus: 'Bus', cable: 'Seilbahn' },
  it: { train: 'Treno', bus: 'Autobus', cable: 'Funivia' }
};

/**
 * Format trip summary for output
 */
function formatTripSummary(trips, lang = 'de') {
  const header = `${EMOJI.train} ${trips.length} Verbindungen gefunden\n\n`;
  
  const body = trips.map((trip, i) => {
    const num = ['1️⃣', '2️⃣', '3️⃣'][i] || '•';
    const primaryLeg = trip.legs[0];
    const mode = getModeEmoji(primaryLeg?.mode);
    const line = primaryLeg?.line || '';
    const delay = trip.legs.some(l => l.delay) ? ` ${EMOJI.delay} +${Math.max(...trip.legs.map(l => l.delay || 0))} Min` : '';
    
    return `${num} ${mode} ${line}${delay}
   ${primaryLeg?.departure?.time} — ${trip.legs[trip.legs.length - 1]?.arrival?.time}  (${trip.duration})  •  ${trip.interchanges} Umstiege
   ${primaryLeg?.departure?.stop} → ${trip.legs[trip.legs.length - 1]?.arrival?.stop}`;
  }).join('\n\n');
  
  return header + body;
}

/**
 * Format detailed trip
 */
function formatTripDetail(trip, lang = 'de') {
  const primaryLeg = trip.legs[0];
  const mode = getModeEmoji(primaryLeg?.mode);
  
  let output = `${mode} ${primaryLeg?.lineName || primaryLeg?.line || ' Verbindung'}\n`;
  output += `${EMOJI.duration} Dauer: ${trip.duration} | ${EMOJI.transfer} ${trip.interchanges} Umstiege\n\n`;
  
  for (const leg of trip.legs) {
    const depTime = leg.departure?.time || '';
    const depStop = leg.departure?.stop || '';
    const platform = leg.departure?.platform ? ` [Gleis ${leg.departure?.platform}]` : '';
    const delay = leg.delay ? ` ${EMOJI.delay} +${leg.delay} Min` : '';
    
    output += `${depTime}  ${depStop}${platform}${delay}\n`;
  }
  
  // Last arrival
  const lastLeg = trip.legs[trip.legs.length - 1];
  output += `${lastLeg?.arrival?.time}  ${lastLeg?.arrival?.stop}\n`;
  
  // Fare
  if (trip.fare?.standard) {
    output += `\n${EMOJI.money} Ab €${trip.fare.standard}`;
    if (trip.fare.reduced) {
      output += ` (Standard) / €${trip.fare.reduced} (Abo)`;
    }
  }
  
  return output;
}

/**
 * Format departures board
 */
function formatDeparturesBoard(departures, stopName, lang = 'de') {
  const header = `${EMOJI.bus} Abfahrten: ${stopName}\n\n`;
  
  const body = departures.map(dep => {
    const mode = getModeEmoji(dep.product);
    const time = dep.scheduledTime || '';
    const line = dep.line || '';
    const direction = dep.direction || '';
    const platform = dep.platform ? ` [Steig ${dep.platform}]` : '';
    const delay = dep.delay ? ` ${EMOJI.delay} +${dep.delay}` : '';
    
    return `• ${time}  ${mode} ${line} → ${direction}${platform}${delay}`;
  }).join('\n');
  
  return header + body;
}

function getModeEmoji(mode) {
  if (!mode) return '🚌';
  const modeLower = mode.toLowerCase();
  if (modeLower.includes('train') || modeLower.includes('zug') || modeLower.includes('treno')) return EMOJI.train;
  if (modeLower.includes('bus') || modeLower.includes('autobus')) return EMOJI.bus;
  if (modeLower.includes('cable') || modeLower.includes('seil') || modeLower.includes('funivia')) return EMOJI.cable;
  return EMOJI.bus;
}

/**
 * Format stop suggestions (for fuzzy matching)
 */
function formatStopSuggestions(query, stops, lang = 'de') {
  const header = `"${query}" nicht gefunden. Meinst du:\n\n`;
  
  const body = stops.map((stop, i) => {
    const num = i + 1;
    const quality = stop.quality ? ` (Qualität: ${stop.quality})` : '';
    return `[${num}] ${stop.name}${quality}`;
  }).join('\n');
  
  return header + body;
}

module.exports = {
  EMOJI,
  MODE_NAMES,
  formatTripSummary,
  formatTripDetail,
  formatDeparturesBoard,
  formatStopSuggestions,
  getModeEmoji
};
```

---

## 6. CLI Interface

### 6.1 Command Structure

```bash
# Trip search
suedtirol-trip <origin> <destination> [options]
suedtirol-trip "Bozen" "Meran"
suedtirol-trip Brixen Brenner at 15:30
suedtirol-trip Bozen Meran modes train exclude bus

# Departures monitor
suedtirol-departures <stop> [options]
suedtirol-departures "Bozen"
suedtirol-departures Bolzano at 18:00 modes bus
```

### 6.2 CLI Entry Points

```javascript
#!/usr/bin/env node
// bin/suedtirol-trip

const minimist = require('minimist');
const { planTrip } = require('../src/api/trip');
const { searchStops } = require('../src/api/stopfinder');
const { formatTripSummary, formatStopSuggestions } = require('../src/utils/format');
const { buildTimeParams, buildTripOptions } = require('../src/utils/time');

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['at', 'on', 'modes', 'exclude'],
    boolean: ['longdistance', 'help'],
    alias: {
      a: 'at',
      d: 'on',
      m: 'modes',
      e: 'exclude',
      l: 'longdistance',
      h: 'help'
    }
  });

  if (argv.help || argv._.length < 2) {
    console.log(`
Usage: suedtirol-trip <origin> <destination> [options]

Options:
  --at, -a <time>      Departure time (e.g., "15:30", "in 30min")
  --on, -d <date>      Date (e.g., "tomorrow", "22.02.2026")
  --modes, -m <modes>  Include only these modes (train,bus,cable)
  --exclude, -e <modes> Exclude these modes
  --longdistance, -l   Include long-distance trains (ICE, EC, RJ)
  --help, -h           Show this help
`);
    process.exit(0);
  }

  const origin = argv._[0];
  const destination = argv._[1];
  
  const options = {
    at: argv.at,
    on: argv.on,
    modes: argv.modes?.split(','),
    exclude: argv.exclude?.split(','),
    longdistance: argv.longdistance,
    limit: 3
  };

  try {
    // Resolve stops (DIRECT API calls)
    const originStop = await resolveStop(origin);
    if (!originStop) {
      const suggestions = await searchStops(origin);
      console.log(formatStopSuggestions(origin, suggestions.slice(0, 3)));
      process.exit(1);
    }

    const destStop = await resolveStop(destination);
    if (!destStop) {
      const suggestions = await searchStops(destination);
      console.log(formatStopSuggestions(destination, suggestions.slice(0, 3)));
      process.exit(1);
    }

    // Plan trip (DIRECT API call)
    const trips = await planTrip(originStop.id, destStop.id, options);
    
    if (trips.length === 0) {
      console.log('Keine Verbindungen gefunden. Bitte andere Zeit oder andere Haltestellen prüfen.');
      process.exit(1);
    }

    console.log(formatTripSummary(trips));
  } catch (error) {
    console.error('Fehler:', error.message);
    process.exit(1);
  }
}

async function resolveStop(query) {
  const stops = await searchStops(query);
  if (stops.length > 0 && stops[0].quality >= 900) {
    return stops[0];
  }
  return null;
}

main();
```

---

## 7. Telegram Interface

### 7.1 Command Handlers

```javascript
// src/commands/trip.js
const { searchStops } = require('../api/stopfinder');
const { planTrip } = require('../api/trip');
const { formatTripSummary, formatTripDetail, formatStopSuggestions, EMOJI } = require('../utils/format');

/**
 * Handle /trip command - DIRECT API calls, NO caching
 */
async function handleTripCommand(ctx) {
  const args = parseTripArgs(ctx.message.text);
  
  if (!args.origin || !args.destination) {
    return ctx.reply(
      'Usage: /trip <von> <nach> [um <Zeit>] [am <Datum>] [modes <Modi>]\n' +
      'Beispiel: /trip Bozen Meran um 15:30'
    );
  }

  try {
    // Resolve origin - DIRECT API call
    const originStops = await searchStops(args.origin);
    if (!originStops.length || originStops[0].quality < 900) {
      return ctx.reply(
        formatStopSuggestions(args.origin, originStops.slice(0, 3)),
        { parse_mode: 'Markdown' }
      );
    }
    
    // Resolve destination - DIRECT API call
    const destStops = await searchStops(args.destination);
    if (!destStops.length || destStops[0].quality < 900) {
      return ctx.reply(
        formatStopSuggestions(args.destination, destStops.slice(0, 3)),
        { parse_mode: 'Markdown' }
      );
    }

    const origin = originStops[0];
    const dest = destStops[0];

    // Plan trip - DIRECT API call (real-time data)
    const trips = await planTrip(origin.id, dest.id, {
      at: args.time,
      on: args.date,
      modes: args.modes,
      longdistance: args.longdistance,
      limit: 3
    });

    if (trips.length === 0) {
      return ctx.reply(
        `${EMOJI.warning} Keine Verbindungen gefunden.\n` +
        `Versuche eine andere Zeit oder andere Haltestellen.`
      );
    }

    const message = formatTripSummary(trips);
    return ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Trip command error:', error);
    return ctx.reply(`${EMOJI.warning} Fehler bei der Verbindungssuche. Bitte später erneut versuchen.`);
  }
}

function parseTripArgs(text) {
  // Remove /trip prefix
  const cleaned = text.replace(/^\/trip\s+/i, '');
  
  // Pattern: "Bozen Meran um 15:30 am morgen modes train"
  const parts = cleaned.split(/\s+/);
  const args = {
    origin: null,
    destination: null,
    time: null,
    date: null,
    modes: null,
    longdistance: false
  };
  
  let collectingDest = true;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    if (part === 'um' && parts[i + 1]) {
      args.time = parts[++i];
      collectingDest = false;
    } else if (part === 'am' && parts[i + 1]) {
      args.date = parts[++i];
      collectingDest = false;
    } else if (part === 'modes' && parts[i + 1]) {
      args.modes = parts[++i].split(',');
      collectingDest = false;
    } else if (part === 'longdistance' || part === '-l') {
      args.longdistance = true;
      collectingDest = false;
    } else if (!args.origin) {
      args.origin = parts[i];
    } else if (collectingDest && !args.destination) {
      args.destination = args.destination 
        ? `${args.destination} ${parts[i]}` 
        : parts[i];
    } else if (collectingDest) {
      args.destination = `${args.destination} ${parts[i]}`;
    }
  }
  
  // Handle multi-word destinations
  if (args.destination && args.destination.includes(' ')) {
    // Keep as-is for fuzzy matching
  }
  
  return args;
}

module.exports = { handleTripCommand };
```

### 7.2 Departures Command

```javascript
// src/commands/departures.js
const { searchStops } = require('../api/stopfinder');
const { getDepartures } = require('../api/departures');
const { formatDeparturesBoard, formatStopSuggestions, EMOJI } = require('../utils/format');

/**
 * Handle /departures command - DIRECT API call for REAL-TIME data
 */
async function handleDeparturesCommand(ctx) {
  const args = parseDeparturesArgs(ctx.message.text);
  
  if (!args.stop) {
    return ctx.reply(
      'Usage: /departures <Haltestelle> [um <Zeit>]\n' +
      'Beispiel: /departures Bozen um 18:00'
    );
  }

  try {
    // Resolve stop - DIRECT API call
    const stops = await searchStops(args.stop);
    
    if (!stops.length || stops[0].quality < 900) {
      return ctx.reply(
        formatStopSuggestions(args.stop, stops.slice(0, 3)),
        { parse_mode: 'Markdown' }
      );
    }

    const stop = stops[0];

    // Get departures - DIRECT API call (real-time, NO caching!)
    const departures = await getDepartures(stop.id, {
      at: args.time,
      limit: 8
    });

    if (departures.length === 0) {
      return ctx.reply(`${EMOJI.warning} Keine Abfahrten gefunden.`);
    }

    const message = formatDeparturesBoard(departures, stop.name);
    return ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Departures command error:', error);
    return ctx.reply(`${EMOJI.warning} Fehler beim Abrufen der Abfahrten.`);
  }
}

function parseDeparturesArgs(text) {
  const cleaned = text.replace(/^\/departures\s+/i, '');
  const parts = cleaned.split(/\s+/);
  
  const args = { stop: null, time: null };
  let stopParts = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    if (part === 'um' && parts[i + 1]) {
      args.time = parts[++i];
    } else {
      stopParts.push(parts[i]);
    }
  }
  
  args.stop = stopParts.join(' ');
  return args;
}

module.exports = { handleDeparturesCommand };
```

### 7.3 NLP Handler

```javascript
// src/commands/nlp.js
const { searchStops } = require('../api/stopfinder');
const { planTrip } = require('../api/trip');
const { getDepartures } = require('../api/departures');
const { formatTripSummary, formatDeparturesBoard, EMOJI } = require('../utils/format');

const PATTERNS = {
  trip: [
    /(?:von|from)\s+(.+?)\s+(?:nach|to)\s+(.+?)(?:\s+(?:um|at|in|morgen|heute)|$)/i,
    /(?:verbindung|connection)\s+(?:von|from)?\s*(.+?)\s+(?:nach|to)\s+(.+)/i
  ],
  departures: [
    /(?:abfahrten?|departures?)\s+(?:von|from|ab)?\s*(.+)/i,
    /(?:wann fährt|when does)\s+(?:der|die|das)?\s*(?:nächste|next)?\s*.+\s+(?:von|from)\s*(.+)/i
  ],
  time: /(?:um|at)\s+(\d{1,2})[:\.](\d{2})/i,
  date: /(?:am|on)\s+(morgen|tomorrow|heute|today)/i
};

/**
 * Handle natural language queries - ALL calls DIRECT
 */
async function handleNaturalLanguage(ctx) {
  const text = ctx.message.text;
  
  // Detect intent
  const intent = detectIntent(text);
  
  switch (intent.type) {
    case 'trip':
      return await handleTripQuery(ctx, intent.entities);
    case 'departures':
      return await handleDeparturesQuery(ctx, intent.entities);
    default:
      return ctx.reply(
        'Ich verstehe die Anfrage nicht.\n\n' +
        'Beispiele:\n' +
        '• Von Bozen nach Meran\n' +
        '• Abfahrten von Bolzano Stazione\n' +
        '• Verbindung Bozen nach Brixen um 15:30'
      );
  }
}

function detectIntent(text) {
  // Try trip patterns
  for (const pattern of PATTERNS.trip) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'trip',
        entities: {
          origin: match[1].trim(),
          destination: match[2].trim(),
          time: extractTime(text),
          date: extractDate(text)
        }
      };
    }
  }
  
  // Try departure patterns
  for (const pattern of PATTERNS.departures) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'departures',
        entities: {
          stop: match[1].trim(),
          time: extractTime(text)
        }
      };
    }
  }
  
  return { type: 'unknown', entities: {} };
}

function extractTime(text) {
  const match = text.match(PATTERNS.time);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return null;
}

function extractDate(text) {
  const match = text.match(PATTERNS.date);
  if (match) {
    return match[1].toLowerCase();
  }
  return null;
}

async function handleTripQuery(ctx, entities) {
  // Resolve and plan - DIRECT API calls
  const originStops = await searchStops(entities.origin);
  const destStops = await searchStops(entities.destination);
  
  if (!originStops.length || !destStops.length) {
    return ctx.reply(`${EMOJI.warning} Haltestelle nicht gefunden.`);
  }
  
  const trips = await planTrip(originStops[0].id, destStops[0].id, {
    at: entities.time,
    limit: 3
  });
  
  if (!trips.length) {
    return ctx.reply(`${EMOJI.warning} Keine Verbindungen gefunden.`);
  }
  
  return ctx.reply(formatTripSummary(trips), { parse_mode: 'Markdown' });
}

async function handleDeparturesQuery(ctx, entities) {
  const stops = await searchStops(entities.stop);
  
  if (!stops.length) {
    return ctx.reply(`${EMOJI.warning} Haltestelle nicht gefunden.`);
  }
  
  const departures = await getDepartures(stops[0].id, {
    at: entities.time,
    limit: 8
  });
  
  return ctx.reply(
    formatDeparturesBoard(departures, stops[0].name),
    { parse_mode: 'Markdown' }
  );
}

module.exports = { handleNaturalLanguage, detectIntent };
```

---

## 8. Configuration

### 8.1 Default Configuration (NO CACHE SETTINGS)

```javascript
// src/config/defaults.js

module.exports = {
  // Language preference: 'de', 'it', or 'auto'
  language: 'de',
  
  // API settings (NO CACHE CONFIG)
  api: {
    baseUrl: 'https://efa.sta.bz.it/apb',
    timeout: 10000,
    retryAttempts: 1,
    retryDelay: 1000
  },
  
  // Output settings
  output: {
    maxTrips: 3,
    maxDepartures: 10,
    showAlternatives: true,
    includeFares: true,
    emojiEnabled: true
  },
  
  // Mode preferences
  modes: {
    default: ['train', 'bus', 'cable'],
    longDistance: false
  },
  
  // Telegram-specific
  telegram: {
    parseMode: 'Markdown',
    disableWebPagePreview: true
  }
  
  // NOTE: NO cache configuration - every call is direct
};
```

### 8.2 Package.json

```json
{
  "name": "suedtirol-fahrplan",
  "version": "1.0.0",
  "description": "Südtirol transit skill for OpenClaw - NO CACHING",
  "main": "src/index.js",
  "bin": {
    "suedtirol-trip": "./bin/suedtirol-trip",
    "suedtirol-departures": "./bin/suedtirol-departures"
  },
  "scripts": {
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "minimist": "^1.2.8"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**NOTE:** No `node-cache` or any caching library in dependencies!

---

## 9. Error Handling

### 9.1 Error Types and Responses

| Error Code | Trigger | User Message (DE) | Action |
|------------|---------|-------------------|--------|
| **STOP_NOT_FOUND** | Empty StopFinder results | "Haltestelle 'X' nicht gefunden. Meinst du:" | Show suggestions |
| **NO_CONNECTIONS** | Empty trip results | "Keine Verbindungen gefunden." | Suggest alternatives |
| **API_TIMEOUT** | > 10s response | "API antwortet nicht. Bitte später versuchen." | Retry 1x |
| **API_ERROR** | HTTP 5xx | "Fehler beim Abrufen der Daten." | Log and fail |
| **INVALID_TIME** | Unparseable time | "Zeitformat nicht erkannt." | Show examples |
| **SAME_STOP** | Origin = Destination | "Abfahrts- und Zielort sind identisch." | Re-prompt |

### 9.2 Simple Error Handler

```javascript
// Direct error handling - NO cache recovery
class TransitError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function handleApiError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    throw new TransitError('API_TIMEOUT', 'API antwortet nicht. Bitte später erneut versuchen.');
  }
  
  if (error.response?.status >= 500) {
    throw new TransitError('API_ERROR', 'Fehler beim Abrufen der Daten.');
  }
  
  throw new TransitError('UNKNOWN', 'Ein unerwarteter Fehler ist aufgetreten.');
}
```

---

## 10. Data Flow Diagrams (SIMPLIFIED - NO CACHE)

### 10.1 Trip Search Flow

```
User Input: "/trip Bozen Meran um 15:00"
        ↓
┌─────────────────────────────────────┐
│ 1. NLP Parser                        │
│    - Extract: origin=Bozen, dest=Meran│
│    - Time: 15:00, Date: today       │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 2. Stop Resolution                   │
│    - StopFinder API call (DIRECT)   │
│    - NO cache check                  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 3. Trip API Request (DIRECT)        │
│    - XML_TRIP_REQUEST2              │
│    - NO cache storage                │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 4. Response Processing               │
│    - Parse trip legs                 │
│    - Extract fare info               │
│    - Check real-time delays          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 5. Format & Send                     │
│    - Apply language preference       │
│    - Add emoji formatting            │
│    - Send via Telegram               │
└─────────────────────────────────────┘
```

### 10.2 Departures Flow

```
User Input: "/departures Bozen"
        ↓
┌─────────────────────────────────────┐
│ 1. Parse Stop Name                   │
│    - Extract: stop="Bozen"           │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 2. Resolve Stop ID (DIRECT)         │
│    - StopFinder API call             │
│    - NO caching                       │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 3. DM Request (DIRECT)              │
│    - XML_DM_REQUEST                  │
│    - Real-time data, always fresh    │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 4. Parse & Format                    │
│    - Sort by time                    │
│    - Add delay indicators            │
│    - Send to user                    │
└─────────────────────────────────────┘
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```javascript
// tests/api/stopfinder.test.js
const { searchStops } = require('../../src/api/stopfinder');

describe('StopFinder', () => {
  test('finds Bolzano station', async () => {
    const result = await searchStops('Bozen');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('66000468');
  });
  
  test('finds Merano station', async () => {
    const result = await searchStops('Meran');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toContain('Merano');
  });
  
  test('handles German names with odvSugMacro', async () => {
    const result = await searchStops('Brixen');
    expect(result.length).toBeGreaterThan(0);
  });
  
  test('returns empty for invalid stop', async () => {
    const result = await searchStops('XYZNONEXISTENT123');
    expect(result).toEqual([]);
  });
});
```

### 11.2 Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Trip: Bozen → Meran | Returns 1-3 connections |
| Departures: Bolzano Stazione | Returns departure board |
| Fuzzy: "Bozn" | Suggests "Bolzano Stazione" |
| Invalid: "XYZ123" | Returns empty, suggests nothing |
| Delayed train | Shows 🚨 indicator |

**NOTE:** No cache-related tests needed!

---

## 12. Deployment

### 12.1 CLI Installation

```bash
cd ~/.openclaw/workspace/skills/suedtirol-fahrplan
npm install
npm link
suedtirol-trip --version  # Verify install
```

### 12.2 Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] API timeout handling verified
- [ ] Error messages in German/Italian
- [ ] NO cache files present (verify no cache.js)

---

## 13. Future Enhancements (v2.0)

Consider adding these in v2.0 IF performance becomes an issue:

1. **Optional caching layer** - Only if rate limits detected
2. **Saved routes** - User preferences (not API caching)
3. **Morning cron** - Daily commute notifications
4. **Price comparison** - SASA vs Trenitalia
5. **Bike transport info** - Show bike-friendly routes

---

## 14. Key Design Decisions (NO CACHE VERSION)

| Decision | Rationale |
|----------|-----------|
| **NO caching** | API has no rate limits, real-time data must be fresh |
| **Always use `odvSugMacro=true`** | Required for bilingual German/Italian support |
| **Retry 1x on timeout** | Balance resilience vs. API load |
| **Simple axios client** | No complexity, easy to maintain |
| **Emoji output default on** | Visual appeal, space-efficient |
| **Fuzzy matching with quality threshold** | Handle typos gracefully (quality ≥ 900 = exact) |
| **Bilingual names returned as-is** | Show both languages, let user decide |
| **NLP for natural queries** | Lower barrier to entry for casual users |

---

## Appendix A: Transport Mode Reference

| EFA Code | Description | German | Italian |
|----------|-------------|--------|---------|
| 0 | Train | Zug | Treno |
| 1 | S-Bahn | S-Bahn | S-Bahn |
| 3 | Bus | Bus | Autobus |
| 5 | Regional Bus | Regionalbus | Bus regionale |
| 6 | City Bus | Stadtbus | Bus urbano |
| 7 | Cable Car | Seilbahn | Funivia |
| 8 | Ropeway | Gondel | Cabinovia |
| 11 | Regional Train | Regionalzug | Treno regionale |
| 17 | SASA Bus | SASA-Bus | Bus SASA |

---

## Appendix B: API Response Times (NO CACHE BENCHMARKS)

| Endpoint | Avg Response Time | Max Acceptable |
|----------|-------------------|----------------|
| StopFinder | 74ms | 500ms |
| Trip | 550ms | 2000ms |
| Departures | 175ms | 1000ms |

With NO caching, all responses are consistent and real-time.

---

*Architecture Version: 1.0.0 (NO CACHE)*  
*Last Updated: 2026-02-21*  
*Status: Ready for Implementation*  
*NOTE: This architecture contains NO caching layer - all API calls are direct*