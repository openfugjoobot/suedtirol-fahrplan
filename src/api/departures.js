const client = require('./client');

/**
 * Departures board API wrapper
 * Uses XML_DM_REQUEST endpoint for departure board
 * 
 * EFAPI endpoints:
 * - Departures: POST XML_DM_REQUEST with dmLimit=5
 * - All requests: use sessionID, include ext=ST
 */

/**
 * Build transport mode filter params
 * Only sends enabled modes with =true, never sends =false
 * @param {object} filters - { inclMOT_ZUG, inclMOT_BUS, inclMOT_8 }
 * @returns {object} Filter params for API
 */
function buildModeFilter(filters = {}) {
  const { inclMOT_ZUG = true, inclMOT_BUS = true, inclMOT_8 = true } = filters;
  
  // If all enabled (default), don't send any filter params
  if (inclMOT_ZUG && inclMOT_BUS && inclMOT_8) {
    return {};
  }
  
  const params = { includedMeans: 'checkbox' };
  
  // Only send =true params, never =false
  if (inclMOT_ZUG) params.inclMOT_ZUG = 'true';
  if (inclMOT_BUS) params.inclMOT_BUS = 'true';
  if (inclMOT_8) params.inclMOT_8 = 'true';
  
  return params;
}

/**
 * Get upcoming departures for a stop
 * @param {string} stop - Stop name or ID
 * @param {object} options - Optional parameters
 * @param {number} options.limit - Maximum number of departures (default: 5)
 * @param {string} options.language - Language preference (de|it)
 * @param {string} options.time - Time to start from (HH:mm)
 * @param {string} options.date - Date (YYYYMMDD)
 * @param {boolean} options.inclMOT_ZUG - Include trains (default: true)
 * @param {boolean} options.inclMOT_BUS - Include buses (default: true)
 * @param {boolean} options.inclMOT_8 - Include cable cars/ropeways (default: true)
 * @returns {Promise<Array>} Array of departures
 */
async function getDepartures(stop, options = {}) {
  const {
    limit = 5,
    language = 'de',
    time,
    date,
    inclMOT_ZUG = true,
    inclMOT_BUS = true,
    inclMOT_8 = true
  } = options;

  const params = {
    name_dm: stop,
    type_dm: 'any',
    limit: limit,
    mode: 'direct',
    language,
    outputFormat: 'JSON',
    ...buildModeFilter({ inclMOT_ZUG, inclMOT_BUS, inclMOT_8 })
  };

  // Add optional time/date parameters
  if (time) {
    params.itdTime = time;
  }
  if (date) {
    params.itdDate = date;
  }

  const response = await client.get('XML_DM_REQUEST', { params });
  return parseDeparturesResponse(response.data);
}

/**
 * Get departures using stop ID for better accuracy
 * @param {string} stopId - Stop ID
 * @param {object} options - Optional parameters
 * @param {boolean} options.inclMOT_ZUG - Include trains (default: true)
 * @param {boolean} options.inclMOT_BUS - Include buses (default: true)
 * @param {boolean} options.inclMOT_8 - Include cable cars/ropeways (default: true)
 * @returns {Promise<Array>} Array of departures
 */
async function getDeparturesById(stopId, options = {}) {
  const {
    limit = 5,
    language = 'de',
    time,
    date,
    inclMOT_ZUG = true,
    inclMOT_BUS = true,
    inclMOT_8 = true
  } = options;

  const params = {
    name_dm: stopId,
    type_dm: 'any',
    limit: limit,
    mode: 'direct',
    language,
    outputFormat: 'JSON',
    ...buildModeFilter({ inclMOT_ZUG, inclMOT_BUS, inclMOT_8 })
  };

  if (time) {
    params.itdTime = time;
  }
  if (date) {
    params.itdDate = date;
  }

  const response = await client.get('XML_DM_REQUEST', { params });
  return parseDeparturesResponse(response.data);
}

/**
 * Parse departures response into clean departure objects
 * @param {object} data - Raw API response
 * @returns {Array} Clean departure objects
 */
function parseDeparturesResponse(data) {
  const departureList = data?.departureList;
  if (!departureList) return [];

  const departuresArray = Array.isArray(departureList) 
    ? departureList 
    : [departureList];

  return departuresArray.map(dep => {
    const dt = dep.dateTime;
    const rt = dep.realDateTime;
    const line = dep.servingLine;
    
    const scheduledTime = dt ? `${dt.hour}:${dt.minute.toString().padStart(2, '0')}` : null;
    const realTime = rt ? `${rt.hour}:${rt.minute.toString().padStart(2, '0')}` : null;
    
    // Delay kommt direkt von der API (in Minuten)
    const delayFromApi = line?.delay ? parseInt(line.delay, 10) : null;
    
    return {
      line: line?.number || line?.symbol,
      mode: getTransportModeName(line?.motType),
      destination: line?.direction,
      direction: line?.direction,
      platform: dep.platform?.name || dep.platformName,
      scheduledTime,
      scheduledDate: dt ? `${dt.year}-${dt.month}-${dt.day}` : null,
      realTime,
      realDate: rt ? `${rt.year}-${rt.month}-${rt.day}` : null,
      delayMinutes: delayFromApi,
      isRealTime: line?.realtime === '1' || !!dep.realDateTime,
      countdown: dep.countdown ? parseInt(dep.countdown, 10) : null,
      stop: dep.stopName
    };
  });
}

/**
 * Get transport mode name from mode ID
 * @param {string|number} modeId - Mode ID
 * @returns {string} Transport mode name
 */
function getTransportModeName(modeId) {
  const modes = {
    0: 'Train',
    1: 'S-Bahn',
    2: 'U-Bahn',
    3: 'Bus',
    4: 'Tram',
    5: 'Regional Bus',
    6: 'City Bus',
    7: 'Cable Car',
    8: 'Ropeway',
    9: 'Ferry',
    10: 'Train Shuttle',
    11: 'Regional Train',
    14: 'Long-distance Bus',
    15: 'Other',
    16: 'On-demand',
    17: 'Regional Bus'
  };
  
  return modes[modeId] || 'Unknown';
}

module.exports = { getDepartures, getDeparturesById };
