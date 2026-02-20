# REQUIREMENTS.md - Südtirol Transit Skill

## Project Overview
**Name:** transit-suedtirol  
**Type:** OpenClaw Skill  
**Language:** German/Italian/English  
**Version:** 1.0.0

## Purpose
A Telegram/CLI skill for querying public transport in South Tyrol (Südtirol/Alto Adige) using the EFA XML-API. Provides real-time connections, departures, and route details via natural language or structured commands.

---

## Core Features

### 1. Trip Search (/trip)
Find connections between two stops.

```
/trip "Bozen" "Meran"
/trip Bozen Meran at 15:30 tomorrow
/trip "Stazione Bolzano" "Brixen" modes train
/trip Bozen to Meran exclude bus longdistance
```

**Parameters:**
- `origin` (required): starting stop (fuzzy matched)
- `destination` (required): destination stop (fuzzy matched)
- `at` (optional): departure time (e.g., "15:30", "in 30min", "now")
- `on` (optional): date (e.g., "tomorrow", "22.02.2026", "next monday")
- `modes` (optional): include only specific modes [bus, train, cable]
- `exclude` (optional): exclude specific modes [bus, train, cable]
- `longdistance` (optional): include long-distance trains (lineRestriction 401)

**Output:**
- List of connections (up to 3)
- For each connection: departure time, arrival time, duration, changes, transport mode
- Detailed view: intermediate stops, platform numbers, real-time delays

---

### 2. Departures Monitor (/departures)
Show upcoming departures at a specific stop.

```
/departures "Stazione di Bolzano"
/departures Bozen at 18:00 modes train
/departures Ospedale in 15min
```

**Parameters:**
- `stop` (required): stop name (fuzzy matched)
- `at` (optional): time offset (default: now)
- `on` (optional): date
- `modes` (optional): filter by mode
- `limit` (optional): number of results (default: 5, max: 10)

**Output:**
- List of next departures
- Line number, destination, scheduled time, platform, real-time status

---

### 3. Natural Language Queries
Parse informal queries without explicit commands.

**Examples:**
- "Wann fährt der nächste Bus nach Meran?"
- "Wie komme ich von Bozen nach Brixen?"
- "Nächste Verbindung nach Terlan um 15 Uhr"
- "Abfahrten von Stazione di Bolzano"
- "Zug von Bolzano nach Meran morgen früh"

**Parsing logic:**
- Extract origin/destination from context (von/von...nach/from...to)
- Detect time expressions (jetzt, um X Uhr, in Y Minuten, morgen)
- Detect mode preferences (Bus, Zug, Bahn, Seilbahn)

---

### 4. Fuzzy Stop Matching
When exact stop name not found:

1. Search via EFA StopFinder API
2. Return top 3 matches
3. Present inline buttons for selection
4. Remember user's choice for session

**Example:**
```
User: /trip Bozen Miran
Bot: "Miran" nicht gefunden. Meinst du:
     [1] Merano, Stazione di Merano
     [2] Meltina, Paese
     [3] Marlengo, Paese
```

---

### 5. Real-time Information
Display live data when available:
- ⏱️ Actual departure/arrival times
- 🚨 Delays and cancellations
- 🚉 Platform changes
- 📍 Current vehicle position (if available)
- 🔄 Alternative routes on disruption

---

## API Integration

**Base URL:** `https://efa.sta.bz.it/apb/`

**Endpoints:**
1. **StopFinder** - `XML_STOPFINDER_REQUEST`
   - Purpose: Fuzzy search for stops
   - Output: JSON

2. **Trip** - `XML_TRIP_REQUEST2`
   - Purpose: Route planning
   - Parameters: origin, destination, time, date, modes, lineRestriction
   - Output: JSON

3. **Departure Monitor (DM)** - `XML_DM_REQUEST`
   - Purpose: Live departures
   - Parameters: stop, limit, time
   - Output: JSON

---

## Data Format

### Modes Mapping
| Mode | EFA Type | German | Italian |
|------|----------|--------|---------|
| bus | 3, 5, 6, 7 | Bus | Autobus |
| train | 0, 6, 15 | Zug/Bahn | Treno |
| cable | 8 | Seilbahn | Funivia |

### Line Restriction
- `400` - Regional transport only (default)
- `401` - Include long-distance (ICE, EC, RJ)

---

## Output Format

### Trip Summary
```
🚂 3 Verbindungen gefunden

1️⃣ R 17179 Treno regionale
   20:01 — 20:44  (43 Min)  •  0 Umstiege
   Bolzano Stazione  →  Merano Stazione

[Details] [Alternativen]
```

### Detailed Trip
```
🚂 R 17179 Treno regionale
⏱️ Dauer: 43 Minuten | 📍 0 Umstiege

20:01  Bolzano, Stazione di Bolzano    [Gleis 4]
20:07  Bolzano Sud - Fiera             🚨 +2 Min
20:10  Bolzano Casanova
20:44  Merano, Stazione di Merano      [Gleis 3, Plan: 20:42]

💶 Ab €3.96 (Standard) / €0.00 (Abo)
```

### Departures
```
🚌 Abfahrten: Bolzano, Stazione di Bolzano

• 20:18  Bus 201 → Merano Stazione   [Steig C]
• 20:21  Bus 10A → Gries            [Steig B]
• 20:25  R 17183 → Brennero         [Gleis 2A]
```

---

## Technical Requirements

### Language
- **Backend:** Node.js (JavaScript/TypeScript)
- **CLI Tool:** Node.js script with shebang
- **Telegram:** Direct integration via OpenClaw message tool

### Dependencies
- `axios` - HTTP requests
- `minimist` or `yargs` - CLI argument parsing
- `fuse.js` or custom fuzzy matching
- `date-fns` or `dayjs` - Date/time handling

### Configuration
```json
{
  "defaultLanguage": "de",
  "api": {
    "baseUrl": "https://efa.sta.bz.it/apb",
    "timeout": 10000
  },
  "limits": {
    "maxResults": 3,
    "maxDepartures": 10
  }
}
```

---

## CLI Usage

```bash
# Install
cd ~/.openclaw/workspace/skills/transit-suedtirol
npm link

# Commands
trip Bozen Meran
trip "Bolzano Stazione" "Merano Stazione" at 15:30
departures Bozen
departures "Stazione di Bolzano" at 18:00 modes train
```

---

## Error Handling

| Error | Response |
|-------|----------|
| Stop not found | "Haltestelle 'X' nicht gefunden. Meinst du: [...]" |
| No connections | "Keine Verbindungen gefunden. Bitte andere Zeit prüfen." |
| API timeout | "API antwortet nicht. Bitte später erneut versuchen." |
| Invalid time | "Zeitformat nicht erkannt. Versuch: '15:30' oder 'in 30min'" |

---

## Future Enhancements (v2.0)
- [ ] Saved favorite routes
- [ ] Morning cron: daily commute check
- [ ] Price comparison (SASA vs Trenitalia)
- [ ] Bike transport info
- [ ] Accessibility info (wheelchair access)
- [ ] Multimodal (bike + bus, car + train)

---

## Acceptance Criteria

- [ ] `/trip` finds connections between any two stops in Südtirol
- [ ] `/departures` shows live data with delays
- [ ] Fuzzy matching suggests stops when exact match fails
- [ ] Natural language queries work for common patterns
- [ ] Time/date filters work correctly
- [ ] Include/exclude modes filter correctly
- [ ] Long-distance mode includes/excludes ICE/EC trains
- [ ] CLI tool installable via npm link
- [ ] Telegram responses formatted with emoji
- [ ] Real-time delays shown when available

---

**Status:** ✅ Phase 0 Complete → Ready for Phase 1 (Analysis)

**Created:** 2026-02-20  
**Author:** OpenFugjooBot (DevOrchestrator)
