# Analysis for Südtirol Transit Skill

## API Overview
**Provider:** Südtiroler Automobilgesellschaft / SASA
**Technology:** EFA XML System (Elektronische Fahrplan-Auskunft)
**Base URL:** https://efa.sta.bz.it/apb/

---

## Endpoints Analysis

### 1. StopFinder Request
**URL:** `https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST`
**Purpose:** Search for stops/stations by name (fuzzy matching)

**Key Parameters:**
- `name_sf` - Search text (e.g., "Bozen", "Bolzano")
- `odvSugMacro=true` - Enable suggestions
- `outputFormat=json` - Get JSON instead of XML

**Response Structure:**
```json
{
  "parameters": [...],
  "stopFinder": {
    "points": [
      {
        "name": "Bolzano, Stazione di Bolzano",
        "stateless": "66000468",
        "anyType": "stop",
        "quality": "954",
        "coords": "680972.00,348068.00",
        "ref": { "id": "66000468", "gid": "it:22021:468" }
      }
    ]
  }
}
```

**Important Fields:**
- `stateless` or `ref.id` - Unique stop ID for trip queries
- `quality` - Match confidence (higher = better)
- `anyType` - "stop" for actual stops, "street" for addresses

---

### 2. Trip Request
**URL:** `https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2`
**Purpose:** Find connections between two stops

**Key Parameters:**
- `name_origin` - Starting stop name
- `type_origin=any` - Search any matching stop
- `name_destination` - Destination stop name  
- `type_destination=any` - Search any matching stop
- `calcNumberOfTrips` - Number of alternative routes (1-5)
- `itdTime` - Departure time (HH:MM)
- `itdDate` - Date (YYYYMMDD)
- `outputFormat=json` - JSON response
- `lineRestriction` - 400 (regional only) or 401 (include long-distance)

**Transport Mode Filtering:**
```
includedMeans: 8 means
- Zug (0)
- S-Bahn (1)  
- U-Bahn (2)
- Stadtbahn (3)
- Straßen-/Trambahn (4)
- Stadtbus (5)
- Regionalbus (6)
- Schnellbus (7)
- Seil-/Zahnradbahn (8)
- Schiff (9)
```

**Response Structure:**
```json
{
  "trips": [
    {
      "duration": "00:43",
      "interchange": "0",
      "legs": [{
        "mode": {
          "name": "R 17179 Treno regionale",
          "number": "17179",
          "product": "Treno regionale",
          "type": "6"
        },
        "points": [
          { "name": "Bolzano, Stazione", "dateTime": { "time": "20:01" } },
          { "name": "Merano, Stazione", "dateTime": { "time": "20:44" } }
        ]
      }]
    }
  ]
}
```

**Mode Type Mapping:**
| Type | Mode | German |
|------|------|--------|
| 0 | train | Zug |
| 3 | city_train | Stadtbahn |
| 5 | city_bus | Stadtbus |
| 6 | regional_bus | Regionalbus |
| 7 | express_bus | Schnellbus |
| 8 | cable_car | Seilbahn |

---

### 3. Departure Monitor (DM)
**URL:** `https://efa.sta.bz.it/apb/XML_DM_REQUEST`
**Purpose:** Show upcoming departures at a specific stop

**Key Parameters:**
- `name_dm` - Stop name
- `type_dm=stop` - Search type
- `limit` - Number of results (default: 10)
- `language=de` - Response language
- `outputFormat=json` - JSON response

---

## Real-time Data

**Availability:** The API provides real-time data via these fields:
- `rtTime` / `rtTimeSec` - Real-time departure/arrival
- `arrDelay` / `depDelay` - Delay in minutes
- `arrValid` / `depValid` - Whether real-time data is available (1=yes)

**Fallback:** When `rtValid=0`, use scheduled times (`time`, `timeSec`)

---

## Error Codes

| Code | Description |
|------|-------------|
| -8011 | No suggestions found |
| -10015 | Partial results (warning) |
| -8010 | Stop found but possibly ambiguous |

---

## Limits & Constraints

1. **Rate Limiting:** Not documented, but recommended to cache results
2. **Timeout:** API responses can take 500ms-2s
3. **Coverage:** Südtirol + parts of Trentino, Alto Adige transport
4. **Languages:** de, it, en supported

---

## Recommended Implementation

### Node.js Client Pattern
```javascript
const axios = require('axios');

const baseUrl = 'https://efa.sta.bz.it/apb';

async function searchStops(query) {
  const response = await axios.get(`${baseUrl}/XML_STOPFINDER_REQUEST`, {
    params: {
      name_sf: query,
      odvSugMacro: true,
      outputFormat: 'json'
    },
    timeout: 10000
  });
  return response.data.stopFinder?.points || [];
}
```

### Key Implementation Notes

1. **Coordinate System:** APBV (Azienda Provinciale Bolzano/VBZ) projected coordinates
2. **Stop IDs:** Can change, prefer `gid` over `stateless` for stability
3. **Caching:** Cache stop searches for 24h, trip results for 5min
4. **Platform Info:** Available as `platformName` or via separate platform endpoint

---

**Status:** Phase 1 Complete ✅  
**Next:** Phase 2 (Architecture)

**Analyzed by:** ResearchAgent  
**Date:** 2026-02-20
