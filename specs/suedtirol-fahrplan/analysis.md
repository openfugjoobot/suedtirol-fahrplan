# Südtirol Transit Skill - API Analysis Document

## Executive Summary

This document presents a comprehensive analysis of the Südtirol EFA (Elektronische Fahrplan Auskunft) API for the `suedtirol-fahrplan` skill. The API is operated by STA (Strutture Trasporto Alto Adige) and provides real-time transit information for the South Tyrol region.

**Base URL:** `https://efa.sta.bz.it/apb/`

---

## 1. API Endpoints

### 1.1 StopFinder (XML_STOPFINDER_REQUEST)
Searches for stops, stations, and addresses.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `name_sf` | Search query | `Bozen`, `Meran` |
| `odvSugMacro` | Enable suggestions | `true` |
| `outputFormat` | Response format | `json` |

**Example URL:**
```
https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?name_sf=Bozen&odvSugMacro=true&outputFormat=json
```

### 1.2 Trip Request (XML_TRIP_REQUEST2)
Calculates routes between origin and destination.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `name_origin` | Origin stop ID or name | `Bolzano%20Stazione` |
| `type_origin` | Origin type | `any` |
| `name_destination` | Destination stop ID or name | `Merano%20Stazione` |
| `type_destination` | Destination type | `any` |
| `calcNumberOfTrips` | Number of alternatives | `3` |
| `excludedMeans` | Exclude transport modes | `0,1,2` |
| `itdTime` | Departure time (HH:mm) | `14:00` |
| `itdDate` | Departure date (YYYYMMDD) | `20260221` |

**Example URL:**
```
https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2?name_origin=Bolzano%20Stazione&type_origin=any&name_destination=Merano%20Stazione&type_destination=any&calcNumberOfTrips=3&outputFormat=json
```

### 1.3 Departures (XML_DM_REQUEST)
Returns upcoming departures for a specific stop.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `name_dm` | Stop ID or name | `66000468` |
| `type_dm` | Type | `stop` |
| `limit` | Maximum results | `8` |

**Example URL:**
```
https://efa.sta.bz.it/apb/XML_DM_REQUEST?name_dm=Bolzano%20Stazione&type_dm=stop&limit=8&outputFormat=json
```

---

## 2. Test Results

### 2.1 StopFinder Tests

**Bozen Search:**
- ✅ Returns Bolzano Stazione di Bolzano (ID: 66000468)
- ✅ Includes quality score (957 for exact match)
- ✅ Returns modes: 0,5,6,7,17 (various transport types)
- ✅ Coordinates format: `680972.00,348068.00` (Gauss-Krüger projection)

**Meran Search:**
- ✅ Returns Merano Stazione di Merano (ID: 66000210)
- ✅ Quality score: 930
- ✅ Multiple stops returned with varying quality scores

**Brixen (German name) Search:**
- ❌ No results with "Brixen"
- ✅ Works with "Bressanone" (Italian name)
- ℹ️ **Finding:** API uses Italian place names primarily

**Invalid Search:**
- ✅ Returns valid JSON with empty `points: null`
- ✅ No HTTP error, graceful handling

### 2.2 Trip Request Tests

**Bozen → Meran:**
- ✅ Returns multiple route alternatives
- ✅ Direct bus routes available (Bus 201)
- ✅ Duration: 59 minutes direct
- ✅ Includes fare information (EUR pricing)

**Bressanone → Sterzing (by Stop ID):**
- ✅ Successfully routes using numeric IDs
- Stop IDs: 66000998 (Bressanone) → 66001392 (Vipiteno)

**Mode Filtering:**
- ✅ `excludedMeans` parameter works
- Can filter to bus-only, train-only, etc.

### 2.3 Departures Tests

**Departures from Bolzano Stazione:**
- ✅ Returns real-time departure board
- ✅ Includes line numbers, destinations, platforms
- ✅ Delay information included (if available)

---

## 3. Data Mapping Tables

### 3.1 Transport Mode Codes

| Code | Mode Type |
|------|-----------|
| 0 | Train (Rail) |
| 1 | S-Bahn |
| 2 | U-Bahn (Subway) |
| 3 | Bus |
| 4 | Tram |
| 5 | Regional Bus |
| 6 | City Bus |
| 7 | Cable Car / Funicular |
| 8 | Ropeway |
| 9 | Ferry |
| 10 | Train Shuttle Service |
| 11 | Regional Train |
| 14 | Long-distance Bus |
| 15 | Other |
| 16 | On-demand transport |
| 17 | Regional Bus (SASA) |

### 3.2 Key Stop IDs

| Location | Stop ID | Coordinates |
|----------|---------|-------------|
| Bolzano Stazione | 66000468 | 680918.00,348073.00 |
| Merano Stazione | 66000210 | 664457.00,328969.00 |
| Bressanone Stazione | 66000998 | 702552.00,323652.00 |
| Vipiteno Stazione | 66001392 | (to be confirmed) |
| Dobbiaco Stazione | 66001219 | 746464.00,320362.00 |
| Brunico Stazione | 66001194 | 723596.00,313505.00 |
| Fortezza Stazione | 66001170 | 699229.00,314987.00 |

### 3.3 Coordinate System

- **System:** Gauss-Krüger (EPSG:3045 or similar)
- **Format:** `X.00,Y.00` (easting,northing)
- **Transformation:** Required for standard GIS display (WGS84)

---

## 4. Response Format Analysis

### 4.1 StopFinder Response Structure
```json
{
  "parameters": [...],
  "stopFinder": {
    "input": {...},
    "points": [
      {
        "usage": "sf",
        "type": "any",
        "name": "Bolzano, Stazione di Bolzano",
        "stateless": "66000468",
        "anyType": "stop",
        "quality": "957",
        "modes": "0,5,6,7,17",
        "ref": {
          "id": "66000468",
          "gid": "it:22021:468",
          "place": "Bolzano",
          "coords": "680972.00,348068.00"
        }
      }
    ]
  }
}
```

### 4.2 Trip Response Structure
```json
{
  "parameters": [...],
  "tripRoutes": {
    "trips": [
      {
        "distance": "30601",
        "duration": "00:59",
        "interchange": "0",
        "legs": [...],
        "itdFare": {...}
      }
    ]
  }
}
```

### 4.3 Departures Response Structure
```json
{
  "parameters": [...],
  "dm": {
    "departureList": [
      {
        "mode": {
          "name": "Bus 201",
          "number": "201",
          "destination": "Merano Stazione"
        },
        "depDateTime": {...}
      }
    ]
  }
}
```

---

## 5. Error Codes and Edge Cases

### 5.1 Error Scenarios

| Scenario | Response | Handling |
|----------|----------|----------|
| Invalid stop name | `points: null` | Return "No stops found" |
| No routes available | Empty trips array | Return "No connections found" |
| Invalid date/time | Error in response | Validate before request |
| Service unavailable | HTTP error | Retry with exponential backoff |

### 5.2 Edge Cases Identified

1. **Language Sensitivity:** API returns better results for Italian place names
2. **Umlauts:** German umlauts (ä, ö, ü) may not match correctly
3. **Stop vs. Address:** Need to distinguish between stop types
4. **Real-time Data:** Delays reported but not all services provide real-time

---

## 6. Performance Benchmarks

### 6.1 Response Times (measured 2026-02-21)

| Endpoint | Min | Max | Avg |
|----------|-----|-----|-----|
| StopFinder | 70ms | 77ms | 74ms |
| Trip | 505ms | 576ms | 550ms |
| Departures | 151ms | 198ms | 175ms |

### 6.2 Recommendations

- **StopFinder:** Cache results for 24 hours (stop data changes infrequently)
- **Trip:** Cache for 5 minutes (connections change regularly)
- **Departures:** Do not cache (real-time data)

---

## 7. Implementation Recommendations

### 7.1 Caching Strategy

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Stop ID mappings | 24h | Static reference data |
| Route calculations | 5min | Schedule-based, semi-dynamic |
| Departure boards | 0s | Real-time data |
| Service alerts | 15min | Important but stable |

### 7.2 Error Handling

- Implement timeout handling (30s max)
- Retry failed requests (3 attempts max)
- Fallback to cached data for non-critical operations
- Graceful degradation when API unavailable

### 7.3 Language Handling

- Accept both German and Italian place names
- Map common German names to Italian equivalents:
  - Bozen → Bolzano
  - Meran → Merano
  - Brixen → Bressanone
  - Sterzen → Vipiteno
  - Bruneck → Brunico

---

## 8. Limitations and Known Issues

1. **No street addresses:** StopFinder addresses only, no routing to arbitrary addresses
2. **Limited multimodal options:** Heavy bus focus, limited S-Bahn integration
3. **Coordinate transformation:** Need conversion from Gauss-Krüger to WGS84
4. **Response size:** Large JSON responses for complex trips
5. **Rate limiting:** No documented rate limits observed, but prudent to limit requests

---

## 9. Security Considerations

- HTTPS only (✓)
- No authentication required for basic queries
- Consider proxying API calls to hide internal endpoint
- Validate all inputs to prevent injection attacks

---

## 10. Testing Checklist

- [x] StopFinder with valid name
- [x] StopFinder with invalid name
- [x] Trip with stop names
- [x] Trip with stop IDs
- [x] Trip with mode filtering
- [x] Departures board
- [x] Unicode/umlaut handling
- [x] Multi-leg journeys
- [x] Error response handling
- [x] Performance measurement

---

*Analysis completed: 2026-02-21*
*API Version: EFA02 (serverID from responses)*
*Test Environment: Production API*
