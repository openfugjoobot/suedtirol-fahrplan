# FrontendAgent Task: Telegram Integration

## Project
**Name:** suedtirol-fahrplan  
**Phase:** 3 - PLANNING → 4 - IMPLEMENTATION  
**Deliverable:** `skills/suedtirol-fahrplan/SKILL.md` + command handlers

## Overview
Telegram skill that wraps the CLI functionality. No complex NLP needed for MVP - simple command parsing.

## SKILL.md Structure
```markdown
# suedtirol-fahrplan Skill

## Commands

### /trip
Find connections between two stops.

**Usage:**
```
/trip <origin> <destination>
/trip Brixen Bozen
/trip Brixen Bozen at 15:30
/trip Brixen Bozen modes train
```

### /departures
Show upcoming departures at a stop.

**Usage:**
```
/departures <stop>
/departures Brixen
/departures Brixen at 18:00
```

## Configuration
```json
{
  "language": "de"
}
```

## Implementation
Uses src/api/ modules directly.
```

## Command Handlers

Create `src/commands/trip.js`:
```javascript
import { findTrips } from '../api/trip.js';
import { resolveStop } from '../api/stopfinder.js';
import { formatTripTelegram } from '../utils/format.js';

export async function tripCommand(bot, msg, args) {
  // Parse: /trip Brixen Bozen at 15:30
  // 1. Extract origin, destination, options
  // 2. Resolve stops with fuzzy matching
  // 3. If ambiguous: show inline keyboard
  // 4. Call findTrips()
  // 5. Send formatted message
}
```

Create `src/commands/departures.js`:
```javascript
import { getDepartures } from '../api/departures.js';

export async function departuresCommand(bot, msg, args) {
  // Parse: /departures Brixen
  // Resolve stop, get departures, send formatted list
}
```

## Inline Keyboard for Fuzzy Matches
When stop not found:
```
"Brix" nicht gefunden. Meinst du:
[
  [Brixen, Bahnhof Brixen],
  [Brixen, Busbahnhof],
  [Brixen, Krankenhaus]
]
```

## Telegram Output Format
```
🚂 3 Verbindungen: Brixen → Bozen

1️⃣ R 17179
   20:01 — 20:44 (43 min) • 0 Umstiege
   📍 Gleis 4 → Gleis 3

[Details] [Andere Zeit]
```

## Success Criteria
- [ ] SKILL.md with /trip and /departures commands
- [ ] src/commands/trip.js handler
- [ ] src/commands/departures.js handler
- [ ] Telegram emoji + markdown formatting
- [ ] Inline keyboard for fuzzy stop matching
- [ ] German responses

Return 'FRONTEND_COMPLETE' when done.
