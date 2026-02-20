# Research Task: Südtirol Transit Skill

**Project:** transit-suedtirol  
**Phase:** 1 - ANALYSIS  
**Agent:** ResearchAgent  
**Created:** 2026-02-20

## Task

Analyze the EFA XML-API for South Tyrol public transport and document findings in `analysis.md`.

## Scope

1. **API Endpoints**
   - XML_STOPFINDER_REQUEST (stop search)
   - XML_TRIP_REQUEST2 (trip planning)
   - XML_DM_REQUEST (departure monitor)

2. **Test Cases**
   - Search for "Bolzano" stops
   - Trip: Bolzano → Merano
   - Departures at "Stazione di Bolzano"

3. **Data Analysis**
   - Response structure (JSON/XML)
   - Required parameters
   - Optional parameters
   - Error codes

4. **Output**
   - Create `/home/ubuntu/.openclaw/workspace/specs/transit-suedtirol/analysis.md`
   - Document API quirks, limitations
   - Note rate limits if any
   - Provide code examples

## Resources

- REQUIREMENTS.md (in workspace root)
- EFA API URL: https://efa.sta.bz.it/apb/
- Reference: docs/transit/efa-xml-docs.md (if exists)

## Success Criteria

- [ ] analysis.md created with API documentation
- [ ] At least 3 test queries documented with responses
- [ ] Known limitations noted
- [ ] Recommended Node.js client approach
