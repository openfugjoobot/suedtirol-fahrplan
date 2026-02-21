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
 * Get upcoming departures for a stop
 * @param {string} stop - Stop name or ID
 * @param {object} options - Optional parameters
 * @param {number} options.limit - Maximum number of departures (default: 5)
 * @param {string} options.language - Language preference (de|it)
 * @param {string} options.sessionId - Session ID for API
 * @param {string} options.time - Time to start from (HH:mm)
 * @param {string} options.date - Date (YYYYMMDD)
 * @returns {Promise<Array>} Array of departures
 */
async function getDepartures(stop, options = {}) {
  const {
    limit = 5,
    language = 'de',
    sessionId = generateSessionId(),
    time,
    date
  } = options;

  const params = {
    name_dm: stop,
    type_dm: 'any',
    dmLimit: limit,
    sessionID: sessionId,
    ext: 'ST',
    language,
    outputFormat: 'json'
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
 * @returns {Promise<Array>} Array of departures
 */
async function getDeparturesById(stopId, options = {}) {
  const {
    limit = 5,
    language = 'de',
    sessionId = generateSessionId(),
    time,
    date
  } = options;

  const params = {
    name_dm: stopId,
    type_dm: 'any',  // 'stop' type doesn't always work with IDs in this API
    dmLimit: limit,
    sessionID: sessionId,
    ext: 'ST',
    language,
    outputFormat: 'json'
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
  const departureList = data?.dm?.departureList;
  if (!departureList) return [];

  const departuresArray = Array.isArray(departureList) 
    ? departureList 
    : [departureList];

  return departuresArray.map(dep => ({
    line: dep.mode?.number,
    mode: getTransportModeName(dep.mode?.destID),
    destination: dep.mode?.destination,
    direction: dep.mode?.direction,
    platform: dep.platform?.name,
    scheduledTime: dep.dateTime?.time,
    scheduledDate: dep.dateTime?.date,
    realTime: dep.dateTime?.rtTime,
    realDate: dep.dateTime?.rtDate,
    delayMinutes: calculateDelay(dep.dateTime?.time, dep.dateTime?.rtTime),
    isRealTime: dep.dateTime?.rtValid === '1',
    stop: dep.stopName || dep.name
  }));
}

/**
 * Calculate delay in minutes between scheduled and real-time
 * @param {string} scheduled - Scheduled time (HH:mm)
 * @param {string} realTime - Real-time (HH:mm)
 * @returns {number|null} Delay in minutes or null
 */
function calculateDelay(scheduled, realTime) {
  if (!scheduled || !realTime) return null;
  
  const [schedHours, schedMins] = scheduled.split(':').map(Number);
  const [realHours, realMins] = realTime.split(':').map(Number);
  
  const schedTotal = schedHours * 60 + schedMins;
  const realTotal = realHours * 60 + realMins;
  
  return realTotal - schedTotal;
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

/**
 * Generate a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = { getDepartures, getDeparturesById };
