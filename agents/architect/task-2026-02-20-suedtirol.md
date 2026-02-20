Phase 2: DESIGN - Südtirol Fahrplan

**Agent:** ArchitectAgent  
**Task:** Create comprehensive architecture.md

## Module Structure
```
src/
├── api/
│   ├── client.js              # Axios wrapper
│   ├── stopfinder.js          # StopFinder endpoint
│   ├── trip.js                # Trip planning
│   └── departures.js          # DM endpoint
├── commands/
│   ├── trip.js                # /trip handler
│   ├── departures.js          # /departures handler
│   └── nlp.js                 # Natural language parser
├── utils/
│   ├── cache.js               # In-memory cache
│   ├── format.js              # Output formatting
│   ├── time.js                # Time/date parser
│   └── fuzzy.js               # Stop matching
├── config/
│   └── default.json
└── index.js                   # Main entry
```

## Data Flow
1. Parse input (command or NL)
2. Resolve stops (fuzzy match)
3. Call API
4. Format output
5. Send response

## Key Design Decisions
- Use ES modules (ES2022)
- Axios with retry interceptor
- Simple memory cache (no Redis needed)
- Date-fns for time parsing
- Table formatting with cli-table3 (optional)

## Error Strategy
- API timeout: Retry once
- Stop not found: Suggest alternatives
- No connections: Suggest different time

## Testing
- Jest for unit tests
- Mock API responses
- CLI command tests
