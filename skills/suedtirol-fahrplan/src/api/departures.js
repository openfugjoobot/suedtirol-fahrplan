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
  if (options.time) {
    params.itdTime = options.time;
  }
  
  const response = await api.get('/XML_DM_REQUEST', { params });
  
  // Parse departures array
  const departures = [];
  
  if (response.data && response.data.departures) {
    for (const departureData of response.data.departures) {
      const departure = parseDeparture(departureData);
      
      // Apply mode filtering if specified
      if (options.modes && options.modes.length > 0) {
        if (options.modes.includes(departure.mode)) {
          departures.push(departure);
        }
      } else {
        departures.push(departure);
      }
    }
  }
  
  return departures;
}

/**
 * Parse a departure object from raw EFA data
 * @param {Object} departureData - Raw departure data from EFA
 * @returns {Object} Parsed departure object
 */
function parseDeparture(departureData) {
  const departure = {
    id: departureData.id,
    line: departureData.line,
    name: departureData.name,
    direction: departureData.direction,
    mode: mapModeFromCode(departureData.mode),
    planned: {},
    realtime: {}
  };
  
  // Parse planned departure time
  if (departureData.planned) {
    departure.planned = {
      time: departureData.planned.time,
      date: departureData.planned.date
    };
  }
  
  // Parse real-time departure time if available
  if (departureData.realtime) {
    departure.realtime = {
      time: departureData.realtime.time,
      date: departureData.realtime.date
    };
  }
  
  // Add platform if available
  if (departureData.platform) {
    departure.platform = departureData.platform;
  }
  
  // Add delay information if available
  if (departureData.delay !== undefined) {
    departure.delay = departureData.delay;
  }
  
  return departure;
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

export default { getDepartures };