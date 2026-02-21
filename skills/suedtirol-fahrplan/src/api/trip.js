const client = require('./client');

/**
 * Trip planning API wrapper
 * Uses XML_TRIP_REQUEST2 endpoint for route planning
 * 
 * EFAPI endpoints:
 * - Trip request: POST XML_TRIP_REQUEST2 with language=de|it
 * - All requests: use sessionID, include ext=ST
 */

/**
 * Plan a trip between two stops
 * @param {string} from - Origin stop name or ID
 * @param {string} to - Destination stop name or ID
 * @param {object} options - Optional parameters
 * @param {string} options.language - Language preference (de|it)
 * @param {string} options.time - Departure time (HH:mm)
 * @param {string} options.date - Departure date (YYYYMMDD)
 * @param {number} options.limit - Number of route alternatives (default: 3)
 * @param {string} options.sessionId - Session ID for API
 * @returns {Promise<Array>} Array of trip routes
 */
async function planTrip(from, to, options = {}) {
  const {
    language = 'de',
    time,
    date,
    limit = 3,
    sessionId = generateSessionId()
  } = options;

  const params = {
    name_origin: from,
    type_origin: 'any',
    name_destination: to,
    type_destination: 'any',
    calcNumberOfTrips: limit,
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

  const response = await client.get('XML_TRIP_REQUEST2', { params });
  return parseTripResponse(response.data);
}

/**
 * Plan a trip using specific stop IDs for better accuracy
 * @param {string} fromId - Origin stop ID
 * @param {string} toId - Destination stop ID
 * @param {object} options - Optional parameters
 * @returns {Promise<Array>} Array of trip routes
 */
async function planTripById(fromId, toId, options = {}) {
  const {
    language = 'de',
    time,
    date,
    limit = 3,
    sessionId = generateSessionId(),
    excludedMeans
  } = options;

  const params = {
    name_origin: fromId,
    type_origin: 'stop',
    name_destination: toId,
    type_destination: 'stop',
    calcNumberOfTrips: limit,
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
  if (excludedMeans) {
    params.excludedMeans = excludedMeans;
  }

  const response = await client.get('XML_TRIP_REQUEST2', { params });
  return parseTripResponse(response.data);
}

/**
 * Parse trip response into clean trip objects
 * @param {object} data - Raw API response
 * @returns {Array} Clean trip objects with duration, distance, legs, etc.
 */
function parseTripResponse(data) {
  const trips = data?.tripRoutes?.trips;
  if (!trips) return [];

  const tripsArray = Array.isArray(trips) ? trips : [trips];

  return tripsArray.map(trip => ({
    duration: trip.duration,
    distance: parseInt(trip.distance, 10),
    interchanges: parseInt(trip.interchange, 10) || 0,
    legs: parseLegs(trip.legs?.leg),
    fare: parseFare(trip.itdFare),
    sessionId: data?.parameters?.find(p => p.name === 'sessionID')?.value
  }));
}

/**
 * Parse trip legs
 * @param {Array|Object} legsData - Leg data from API
 * @returns {Array} Parsed leg objects
 */
function parseLegs(legsData) {
  if (!legsData) return [];
  
  const legsArray = Array.isArray(legsData) ? legsData : [legsData];
  
  return legsArray.map(leg => ({
    mode: leg.mode?.name,
    line: leg.mode?.number,
    destination: leg.mode?.destination,
    direction: leg.mode?.direction,
    duration: leg.time?.duration,
    origin: {
      name: leg.points?.point?.[0]?.name || leg.points?.point?.name,
      time: leg.points?.point?.[0]?.dateTime?.time,
      platform: leg.points?.point?.[0]?.platform?.name
    },
    destination: {
      name: leg.points?.point?.[1]?.name || leg.points?.point?.name,
      time: leg.points?.point?.[1]?.dateTime?.time,
      platform: leg.points?.point?.[1]?.platform?.name
    },
    stops: leg.stopSeq?.map(stop => ({
      name: stop.name,
      arrival: stop.arrival?.time,
      departure: stop.departure?.time
    })) || []
  }));
}

/**
 * Parse fare information
 * @param {object} fareData - Fare data from API
 * @returns {object|null} Parsed fare object
 */
function parseFare(fareData) {
  if (!fareData) return null;
  
  const tickets = fareData?.tickets?.ticket;
  if (!tickets) return null;
  
  const ticketsArray = Array.isArray(tickets) ? tickets : [tickets];
  
  return {
    currency: fareData.currency,
    tickets: ticketsArray.map(ticket => ({
      name: ticket.name,
      price: ticket.price,
      currency: ticket.currency
    }))
  };
}

/**
 * Generate a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = { planTrip, planTripById };
