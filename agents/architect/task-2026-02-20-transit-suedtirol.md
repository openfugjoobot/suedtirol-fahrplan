# Architecture Task: Südtirol Transit Skill

**Project:** transit-suedtirol  
**Phase:** 2 - DESIGN  
**Agent:** ArchitectAgent  
**Created:** 2026-02-20

## Task

Create architecture.md with the technical design for the transit skill.

## Input

- REQUIREMENTS.md (root)
- specs/transit-suedtirol/analysis.md
- ResearchAgent findings

## Output

Create `specs/transit-suedtirol/architecture.md` with:

### Sections Required

1. **Overview**
   - Tech stack (Node.js)
   - Architecture approach (Modular CLI + Telegram)

2. **Module Structure**
   ```
   src/
   ├── api/
   │   ├── client.js          # Axios wrapper
   │   ├── stopfinder.js      # Stop search
   │   ├── trip.js            # Trip planning
   │   └── departures.js      # DM endpoint
   ├── commands/
   │   ├── trip.js            # /trip handler
   │   ├── departures.js      # /departures handler
   │   └── parser.js          # Natural language parsing
   ├── utils/
   │   ├── fuzzymatch.js      # Stop matching
   │   ├── time.js            # Date/time parsing
   │   └── formatter.js       # Output formatting
   └── cli.js                 # CLI entry
   ```

3. **Data Flow**
   - Command parsing → Stop resolution → API call → Response formatting
   - Natural language: Input → Regex extraction → Command construction

4. **API Client Design**
   - Axios config with timeout, retries
   - Error handling strategy
   - Response caching (24h for stops, 5min for trips)

5. **Fuzzy Matching**
   - Algorithm: EFA StopFinder API (server-side)
   - Local cache: Simple object map for session
   - Inline button selection via Telegram

6. **Time/Date Parsing**
   - Support: "15:30", "3:30 PM", "in 30min", "tomorrow", "next monday"
   - Library recommendation: date-fns

7. **Output Formatting**
   - Telegram: Emoji + Markdown
   - CLI: Table (simple-columnar) or plain text
   - Detailed view: Expandable sections

8. **Configuration**
   - Default language (de/it/en)
   - API base URL
   - Cache TTL values

9. **Error Handling Strategy**
   - API timeout → Retry once, then graceful error
   - Stop not found → Suggest alternatives
   - No connections → Alternative times suggestion

10. **Testing Approach**
    - Unit tests for parsers
    - Integration tests for API calls (mocked)
    - CLI command tests

## Success Criteria

- [ ] architecture.md created with all sections
- [ ] Module structure defined
- [ ] Data flow documented
- [ ] Technology choices justified
- [ ] Example code snippets for key modules
