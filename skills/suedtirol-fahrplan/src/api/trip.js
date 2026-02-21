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
  const trips = [];
  
  if (response.data && response.data.trips) {
    for (const tripData of response.data.trips) {
      const trip = parseTrip(tripData);
      
      // Apply mode filtering if specified
      if (options.modes && options.modes.length > 0) {
        if (filterTripByModes(trip, options.modes, true)) {
          trips.push(trip);
        }
      } else if (options.exclude && options.exclude.length > 0) {
        if (filterTripByModes(trip, options.exclude, false)) {
          trips.push(trip);
        }
      } else {
        trips.push(trip);
      }
    }
  }
  
  return trips;
}

/**
 * Parse a trip object from raw EFA data
 * @param {Object} tripData - Raw trip data from EFA
 * @returns {Object} Parsed trip object
 */
function parseTrip(tripData) {
  const trip = {
    id: tripData.id,
    duration: tripData.duration,
    interchange: tripData.interchange,
    departure: {},
    arrival: {},
    legs: [],
    fare: {}
  };
  
  // Parse departure
  if (tripData.departure) {
    trip.departure = {
      time: tripData.departure.time,
      date: tripData.departure.date,
      stop: tripData.departure.stop,
      platform: tripData.departure.platform
    };
    
    // Add real-time info if available
    if (tripData.departure.rtTime || tripData.departure.rtDate) {
      trip.departure.realtime = {
        time: tripData.departure.rtTime,
        date: tripData.departure.rtDate
      };
    }
  }
  
  // Parse arrival
  if (tripData.arrival) {
    trip.arrival = {
      time: tripData.arrival.time,
      date: tripData.arrival.date,
      stop: tripData.arrival.stop,
      platform: tripData.arrival.platform
    };
    
    // Add real-time info if available
    if (tripData.arrival.rtTime || tripData.arrival.rtDate) {
      trip.arrival.realtime = {
        time: tripData.arrival.rtTime,
        date: tripData.arrival.rtDate
      };
    }
  }
  
  // Parse legs
  if (tripData.legs && Array.isArray(tripData.legs)) {
    trip.legs = tripData.legs.map(leg => {
      const parsedLeg = {
        mode: mapModeFromCode(leg.mode),
        line: leg.line,
        name: leg.name,
        direction: leg.direction,
        departure: {},
        arrival: {}
      };
      
      // Parse leg departure
      if (leg.departure) {
        parsedLeg.departure = {
          time: leg.departure.time,
          date: leg.departure.date,
          stop: leg.departure.stop,
          platform: leg.departure.platform
        };
        
        // Add real-time info if available
        if (leg.departure.rtTime || leg.departure.rtDate) {
          parsedLeg.departure.realtime = {
            time: leg.departure.rtTime,
            date: leg.departure.rtDate
          };
        }
      }
      
      // Parse leg arrival
      if (leg.arrival) {
        parsedLeg.arrival = {
          time: leg.arrival.time,
          date: leg.arrival.date,
          stop: leg.arrival.stop,
          platform: leg.arrival.platform
        };
        
        // Add real-time info if available
        if (leg.arrival.rtTime || leg.arrival.rtDate) {
          parsedLeg.arrival.realtime = {
            time: leg.arrival.rtTime,
            date: leg.arrival.rtDate
          };
        }
      }
      
      return parsedLeg;
    });
  }
  
  // Parse fare
  if (tripData.fare) {
    trip.fare = {
      amount: tripData.fare.amount,
      currency: tripData.fare.currency
    };
  }
  
  return trip;
}

/**
 * Map EFA mode code to human-readable mode
 * @param {number} modeCode - EFA mode code
 * @returns {string} Human-readable mode
 */
function mapModeFromCode(modeCode) {
  // Mode mapping
  const MODE_MAP = {
    0: 'longdistance',
    3: 'cityrail',
    5: 'citybus',
    6: 'regional',
    7: 'express',
    8: 'cable',
    15: 'bus',
    16: 'train'
  };
  
  return MODE_MAP[modeCode] || 'unknown';
}

/**
 * Check if a trip matches mode filters
 * @param {Object} trip - Parsed trip object
 * @param {string[]} modes - Modes to include/exclude
 * @param {boolean} include - True to include matching modes, false to exclude
 * @returns {boolean} Whether trip matches filter criteria
 */
function filterTripByModes(trip, modes, include) {
  // If no legs, we can't filter
  if (!trip.legs || trip.legs.length === 0) {
    return true;
  }
  
  // Check each leg
  for (const leg of trip.legs) {
    // If we're including and the leg mode is in our list, include this trip
    if (include && modes.includes(leg.mode)) {
      return true;
    }
    // If we're excluding and the leg mode is in our list, exclude this trip
    if (!include && modes.includes(leg.mode)) {
      return false;
    }
  }
  
  // If we're including and none matched, exclude this trip
  // If we're excluding and none matched, include this trip
  return !include;
}

// Mode mapping
const MODE_MAP = {
  train: [0, 6, 15, 16],
  bus: [3, 5, 6, 7],
  cable: [8]
};

export default { findTrips };