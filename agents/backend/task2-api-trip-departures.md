# BackendAgent Task 2: Trip & Departures API

## Project
**Name:** suedtirol-fahrplan  
**Phase:** 3 - PLANNING → 4 - IMPLEMENTATION

## Deliverable
Create in `skills/suedtirol-fahrplan/src/api/`:
- `trip.js` - Trip/Route planning
- `departures.js` - Departure board

## Requirements

### trip.js
```javascript
import api from './client.js';

/**
 * Find routes between stops
 * @param {Object} options
 * @param {string} options.origin - Stop ID
 * @param {string} options.destination - Stop ID
 * @param {string} [options.time] - HH:MM format
 * @param {string} [options.date] - YYYYMMDD format
 * @param {string[]} [options.modes] - Include: ['bus', 'train', 'cable']
 * @param {string[]} [options.exclude] - Exclude: ['bus', 'train', 'cable']
 * @param {boolean} [options.longdistance] - Include ICE/EC
 * @param {number} [options.limit=3] - Max connections
 */
export async function findTrips(options) {
  const params = {
    name_origin: options.origin,
    type_origin: 'any',
    name_destination: options.destination,
    type_destination: 'any',
    calcNumberOfTrips: options.limit || 3,
    outputFormat: 'json'
  };
  
  // Optional params
  if (options.time) params.itdTime = options.time;
  if (options.date) params.itdDate = options.date;
  if (options.longdistance) params.lineRestriction = 401;
  
  // Mode filtering (map to EFA codes)
  // 0=longdistance, 3=cityrail, 5=citybus, 6=regional, 7=express, 8=cable
  
  const response = await api.get('/XML_TRIP_REQUEST2', { params });
  // Parse trips array
}

// Mode mapping
const MODE_MAP = {
  train: [0, 6, 15, 16],
  bus: [3, 5, 6, 7],
  cable: [8]
};
```

### departures.js
```javascript
import api from './client.js';

/**
 * Get departures at a stop
 * @param {string} stopId - Stop ID
 * @param {Object} options
 * @param {number} [options.limit=5] - Number of departures
 * @param {string} [options.time] - Time offset
 * @param {string[]} [options.modes] - Filter by mode
 */
export async function getDepartures(stopId, options = {}) {
  const params = {
    name_dm: stopId,
    type_dm: 'stop',
    limit: options.limit || 5,
    outputFormat: 'json'
  };
  
  // Add time/duration if needed
  
  const response = await api.get('/XML_DM_REQUEST', { params });
  // Parse departures array
}
```

## Trip Object Format
```javascript
{
  id: "1",
  duration: "43",        // minutes
  interchange: 0,        // number of changes
  departure: {
    time: "20:01",
    date: "20260221",
    stop: "Bolzano Stazione",
    platform: "4"
  },
  arrival: {
    time: "20:44",
    stop: "Merano Stazione", 
    platform: "3"
  },
  legs: [
    {
      mode: "train",     // mapped from type
      line: "R 17179",
      name: "Treno regionale",
      direction: "Merano",
      departure: {...},
      arrival: {...}
    }
  ],
  fare: {
    amount: "3.96",
    currency: "EUR"
  }
}
```

## Success Criteria
- [ ] trip.js with findTrips()
- [ ] departures.js with getDepartures()
- [ ] Mode filtering works (include/exclude)
- [ ] Long-distance option works (lineRestriction=401)
- [ ] Real-time delay parsing (rtTime, rtDate fields)
- [ ] Manual tests: Brixen→Bozen, departures at Brixen

Return 'TASK2_COMPLETE' when done.
