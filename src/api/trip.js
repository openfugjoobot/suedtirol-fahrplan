const client = require('./client');
const xml2js = require('xml2js');

/**
 * Plan a trip between two stops using IDs
 * @param {string} from - Origin stop ID (e.g. 66000468)
 * @param {string} to - Destination stop ID (e.g. 66000998)
 * @param {object} options - Optional parameters
 * @returns {Promise<Array>} Array of trip routes
 */
async function planTrip(from, to, options = {}) {
  const {
    language = 'de',
    time,
    date,
    limit = 3
  } = options;

  // Build URL - language FIRST, then odvMacro, then stop IDs
  // Note: ext=ST not needed according to docs
  let url = `XML_TRIP_REQUEST2?`;
  url += `language=${language}&`;
  url += `odvMacro=true&`;
  url += `coordOutputFormat=WGS84[DD.DDDDD]&`;
  url += `name_origin=${encodeURIComponent(from)}&`;
  url += `type_origin=any&`;
  url += `name_destination=${encodeURIComponent(to)}&`;
  url += `type_destination=any&`;
  url += `calcNumberOfTrips=${limit}`;

  if (time) {
    url += `&itdTime=${encodeURIComponent(time)}`;
  }
  if (date) {
    url += `&itdDate=${encodeURIComponent(date)}`;
  }

  try {
    const response = await client.get(url);
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(response.data);
    
    return parseTripResponse(parsed);
  } catch (error) {
    console.error('Trip planning error:', error.message);
    throw error;
  }
}

async function planTripById(fromId, toId, options = {}) {
  return planTrip(fromId, toId, options);
}

function parseTripResponse(data) {
  const routeList = data?.itdRequest?.itdTripRequest?.itdItinerary?.itdRouteList;
  
  if (!routeList?.itdRoute) {
    return [];
  }

  const routes = routeList.itdRoute;
  const routesArray = Array.isArray(routes) ? routes : [routes];

  return routesArray.map(route => {
    // Get duration from route attributes
    const durationStr = route?.$?.duration || route?.$?.publicDuration || '00:00';
    const durationMatch = durationStr.match(/(\d+):(\d+)/);
    const duration = durationMatch ? (parseInt(durationMatch[1], 10) * 60 + parseInt(durationMatch[2], 10)) : 0;
    
    // Get partial routes (legs)
    const prList = route?.itdPartialRouteList?.itdPartialRoute;
    const legs = parseLegs(prList);
    
    // Extract departure from first leg
    const departure = legs[0]?.origin;
    
    // Extract arrival from last leg  
    const arrival = legs[legs.length - 1]?.destination;
    
    return {
      duration: duration,
      distance: parseInt(route?.$?.distance || -1, 10),
      interchanges: parseInt(route?.$?.interchange || 0, 10),
      departure: departure,
      arrival: arrival,
      legs: legs,
      routeIndex: route?.$?.routeIndex
    };
  }).filter(r => r.duration > 0);
}

function parseLegs(legsData) {
  if (!legsData) return [];
  
  const legsArray = Array.isArray(legsData) ? legsData : [legsData];
  
  return legsArray.map(leg => {
    const mot = leg?.itdMeansOfTransport?.$ || leg?.itdMeansOfTransport;
    const points = leg?.itdPoint;
    
    if (!points) return null;
    
    // Points can be array or single object
    const ptArray = Array.isArray(points) ? points.filter(p => p) : [points].filter(p => p);
    
    if (ptArray.length === 0) return null;
    
    const fromPoint = ptArray[0];
    const toPoint = ptArray[ptArray.length - 1];
    
    return {
      mode: mot?.name,
      line: mot?.shortname || mot?.number,
      destination: mot?.destination,
      direction: mot?.direction,
      duration: parseInt(leg?.$?.timeMinute || 0, 10),
      origin: parsePoint(fromPoint),
      destination: parsePoint(toPoint)
    };
  }).filter(Boolean);
}

function parsePoint(point) {
  if (!point) return null;
  
  // Handle both $ attributes and direct properties
  const attrs = point.$ || point;
  const name = attrs?.name;
  const usage = attrs?.usage;
  const platform = attrs?.platformName || attrs?.platform;
  
  // Parse datetime
  const dt = point?.itdDateTime?.itdTime?.$ || point?.itdDateTime?.itdTime;
  const date = point?.itdDateTime?.itdDate?.$ || point?.itdDateTime?.itdDate;
  
  const timeStr = dt ? 
    String(dt.hour || '??').padStart(2, '0') + ':' + String(dt.minute || '??').padStart(2, '0') : 
    null;
  
  const dateStr = date ?
    String(date.day || '??').padStart(2, '0') + '.' + String(date.month || '??').padStart(2, '0') + '.' + (date.year || '????') :
    null;
  
  return {
    stop: name,
    usage: usage,
    time: timeStr,
    date: dateStr,
    platform: platform
  };
}

module.exports = {
  planTrip,
  planTripById
};
