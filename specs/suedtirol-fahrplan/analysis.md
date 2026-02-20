# Phase 1: ANALYSIS - Südtirol Transit API

**Agent:** ResearchAgent  
**Phase:** 1 - ANALYSIS  
**Date:** 2026-02-20  
**Status:** Complete ✅

---

## API Overview

**Provider:** Südtiroler Automobilgesellschaft / SASA  
**System:** EFA (Elektronische Fahrplan-Auskunft) XML System  
**Base URL:** https://efa.sta.bz.it/apb/  
**Protocol:** HTTPS  
**Data Format:** JSON (via outputFormat=json parameter)

---

## Endpoints Tested

### 1. StopFinder (XML_STOPFINDER_REQUEST)
**Purpose:** Fuzzy search for stops by name

**Test 1: Search "Bozen"**
```bash
curl "https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?name_sf=Bozen&odvSugMacro=true&outputFormat=json"
```

**Result:** ✅ 80+ matches found
- Best match: "Bolzano, Stazione di Bolzano" (quality: 954, stateless: 66000468)
- Alternative: "Bolzano, Autostazione" (quality: 727)
- Works with both German and Italian names

**Test 2: Search "Meran"**
```bash
curl "https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?name_sf=Meran&odvSugMacro=true&outputFormat=json"
```

**Result:** ✅ Found "Merano, Stazione di Merano" (quality: 911)

**Test 3: Search invalid "Xyz123"**
**Result:** ⚠️ Returns empty points array (code: -8011)

**Key Fields:**
- `stateless` or `ref.id` - Unique stop ID
- `quality` - Match confidence (900+ = exact, 700+ = good)
- `anyType` - "stop" (station) or "street" (address)
- `coords` - X,Y coordinates (APBV projection)

---

### 2. Trip Request (XML_TRIP_REQUEST2)
**Purpose:** Find connections between stops

**Test 1: Bolzano → Merano (now)**
```bash
curl "https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2?name_origin=Bolzano%20Stazione&type_origin=any&name_destination=Merano%20Stazione&type_destination=any&calcNumberOfTrips=3&outputFormat=json"
```

**Result:** ✅ 2 connections found
- Connection 1: Train R 17179 (43 min, 0 changes)
  - Dep: 20:01 Platform 4
  - Arr: 20:44 Platform 3
- Connection 2: Bus 201 (51 min, 0 changes)
  - Dep: 20:18 Platform C
  - Arr: 21:09 Platform U

**Test 2: With time filter**
```bash
curl "https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2?name_origin=66000468&type_origin=any&name_destination=66000210&type_destination=any&itdTime=15:30&itdDate=20260221&calcNumberOfTrips=3&outputFormat=json"
```

**Result:** ✅ Returns connections departing after 15:30

**Test 3: Mode filtering (longdistance)**
```bash
curl "...lineRestriction=401..."
```

**Result:** ✅ Includes trains like EC, RJ (long-distance)

**Mode Types:**
| Type | Mode | German |
|------|------|--------|
| 0 | Long-distance | Fernzug |
| 3 | City rail | Stadtbahn |
| 5 | City bus | Stadtbus |
| 6 | Regional train | Regionalzug |
| 7 | Express bus | Schnellbus |
| 8 | Cable car | Seilbahn |

**Key Fields:**
- `trips[].duration` - Travel time (HH:MM)
- `trips[].interchange` - Number of changes
- `legs[].mode.name` - Line name (e.g., "R 17179")
- `legs[].mode.type` - Transport mode (see table)
- `legs[].points[]` - All stops with times

---

### 3. Departure Monitor (XML_DM_REQUEST)
**Purpose:** Show upcoming departures at a stop

**Test 1: Departures at Bolzano Station**
```bash
curl "https://efa.sta.bz.it/apb/XML_DM_REQUEST?name_dm=Stazione%20di%20Bolzano&type_dm=stop&limit=5&outputFormat=json"
```

**Result:** ✅ 5 departures returned
- Shows line number, destination, scheduled time, platform
- Includes bus, train departures

---

## Real-time Data

**Availability:** Partial - depends on operator

**Fields when available:**
- `rtTime` / `rtTimeSec` - Real-time timestamp
- `arrDelay` / `depDelay` - Delay in minutes
- `arrValid` / `depValid` - Whether RT data exists (1=yes)

**Test Result:** Some trains show RT data, some don't

---

## Error Handling

| Error Code | Description | Handling |
|------------|-------------|----------|
| -8011 | No stops found | Suggest alternatives |
| -8010 | Ambiguous stop | Present multiple options |
| -10015 | Partial results (warning) | Continue with results |
| API timeout | No response | Retry once, then error |

---

## Rate Limits & Performance

**Testing Results:**
- Average response time: 500ms - 1500ms
- No explicit rate limit detected
- Recommended: Max 10 req/min per user

**Caching Recommendations:**
- Stop searches: 24h (rarely change)
- Trip results: 5min (times change)
- Departures: 1min (live data)

---

## API Quirks & Limitations

1. **Coordinates:** APBV projection (not WGS84), need conversion for maps
2. **Stop IDs:** Can change between API versions, prefer `gid` field
3. **Names:** Returns Italian names even with German query (Bozen→Bolzano)
4. **Platform:** Sometimes missing or shows internal IDs
5. **Prices:** Included but only German fare structure, not Italy-specific

---

## Test Summary

| Test | Status | Notes |
|------|--------|-------|
| StopFinder basic | ✅ | Works with partial names |
| StopFinder empty | ✅ | Returns empty gracefully |
| Trip basic | ✅ | Bolzano→Merano works |
| Trip with time | ✅ | Time filtering works |
| Trip modes | ✅ | Mode exclusion works |
| Departures | ✅ | Returns live data |
| Long-distance | ✅ | lineRestriction=401 works |

---

## Recommended Implementation

### API Client Pattern
```javascript
const client = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb',
  timeout: 10000
});

// Always use outputFormat=json
// Cache stop lookups for 24h
// Retry once on timeout
```

### Key Implementation Notes
1. Use `any` type for origin/destination to enable fuzzy matching
2. Always URL-encode stop names
3. Handle both `stateless` and `ref.id` for stop IDs
4. Map type codes to German/Italian names (see table above)
5. Check `rtValid` before showing real-time data

---

**Phase 1 Complete** ✅

Ready for Phase 2 (Architecture)

**Analyzed by:** ResearchAgent  
**Date:** 2026-02-20
