# BackendAgent Task 3: CLI Commands

## Project
**Name:** suedtirol-fahrplan  
**Phase:** 3 - PLANNING → 4 - IMPLEMENTATION

## Deliverable
Create CLI binaries:
- `skills/suedtirol-fahrplan/bin/suedtirol-trip`
- `skills/suedtirol-fahrplan/bin/suedtirol-departures`

Both need `chmod +x` and shebang line.

## suedtirol-trip
```javascript
#!/usr/bin/env node
import { findTrips } from '../src/api/trip.js';
import { resolveStop } from '../src/api/stopfinder.js';
import { formatTripCLI } from '../src/utils/format.js';

// Parse args with minimist or simple regex
// trip Brixen Bozen
// trip Brixen Bozen at 15:30
// trip Brixen Bozen modes train
// trip Brixen Bozen exclude bus

async function main() {
  const args = process.argv.slice(2);
  
  // Parse: origin, destination, time, modes, etc.
  // 1. Resolve stops (fuzzy)
  // 2. Call findTrips()
  // 3. Format output
  // 4. Print to stdout
}

main().catch(console.error);
```

## suedtirol-departures
```javascript
#!/usr/bin/env node
import { getDepartures } from '../src/api/departures.js';
import { resolveStop } from '../src/api/stopfinder.js';

// departures Brixen
// departures Brixen at 18:00
// departures Brixen modes bus

async function main() {
  const args = process.argv.slice(2);
  // 1. Resolve stop
  // 2. Call getDepartures()
  // 3. Format as table/list
  // 4. Print to stdout
}
```

## CLI Output Format
```
🚂 3 Verbindungen gefunden: Brixen → Bozen

1️⃣ R 17179 Treno regionale
   20:01 — 20:44  (43 Min)  •  0 Umstiege
   Brixen Bahnhof  →  Bozen Stazione

2️⃣ Bus 201 ...
```

## package.json scripts
```json
{
  "bin": {
    "suedtirol-trip": "./bin/suedtirol-trip",
    "suedtirol-departures": "./bin/suedtirol-departures"
  }
}
```

## Manual Testing
```bash
cd skills/suedtirol-fahrplan
npm link  # Makes commands available globally

# Test
trip Brixen Bozen
trip Brixen Bozen at 15:30
departures Brixen
```

## Success Criteria
- [ ] suedtirol-trip CLI working
- [ ] suedtirol-departures CLI working
- [ ] Shebang + executable bits set
- [ ] Argument parsing (origin, dest, time, modes)
- [ ] Error messages in German
- [ ] npm link works globally

Return 'TASK3_COMPLETE' when done.
