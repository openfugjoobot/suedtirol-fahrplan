const client = require('./client');
const xml2js = require('xml2js');
const { stripHtml, parseInfoObject } = require('./utils');

/**
 * Plan a trip between two stops using IDs
 */
async function planTrip(from, to, options = {}) {
  const {
    language = 'de',
    time,
    date,
    limit = 3
  } = options;

  let url = `XML_TRIP_REQUEST2?`;
  url += `language=${language}&`;
  url += `odvMacro=true&`;
  url += `coordOutputFormat=WGS84[DD.DDDDD]&`;
  url += `name_origin=${encodeURIComponent(from)}&`;
  url += `type_origin=any&`;
  url += `name_destination=${encodeURIComponent(to)}&`;
  url += `type_destination=any&`;
  url += `calcNumberOfTrips=${limit}`;

  if (time) url += `&itdTime=${encodeURIComponent(time)}`;
  if (date) url += `&itdDate=${encodeURIComponent(date)}`;

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

/**
 * Parse info text list from route level
 */
function parseRouteInfo(infoTextList) {
  if (!infoTextList?.infoText) return [];
  
  const infos = Array.isArray(infoTextList.infoText) 
    ? infoTextList.infoText 
    : [infoTextList.infoText];
  
  return infos.map(info => ({
    type: 'route',
    subject: info.subject || '',
    content: stripHtml(info.content || ''),
    subtitle: info.subtitle || '',
    url: info.url || ''
  })).filter(i => i.subject || i.content);
}

/**
 * Parse genAttrList for warnings/attributes
 */
function parseLegAttributes(genAttrList) {
  if (!genAttrList?.genAttrElem) return null;
  
  const attrs = Array.isArray(genAttrList.genAttrElem) 
    ? genAttrList.genAttrElem 
    : [genAttrList.genAttrElem];
  
  const warnings = [];
  attrs.forEach(attr => {
    if (attr.name?.toLowerCase().includes('warn') || 
        attr.name?.toLowerCase().includes('hint') ||
        attr.name?.toLowerCase().includes('info')) {
      warnings.push({
        type: 'attribute',
        name: attr.name,
        value: attr.value
      });
    }
  });
  
  return warnings.length > 0 ? warnings : null;
}

function parseTripResponse(data) {
  const routeList = data?.itdRequest?.itdTripRequest?.itdItinerary?.itdRouteList;
  
  if (!routeList?.itdRoute) return [];

  const routes = routeList.itdRoute;
  const routesArray = Array.isArray(routes) ? routes : [routes];

  return routesArray.map(route => {
    const durationStr = route?.$?.duration || route?.$?.publicDuration || '00:00';
    const durationMatch = durationStr.match(/(\d+):(\d+)/);
    const duration = durationMatch 
      ? (parseInt(durationMatch[1], 10) * 60 + parseInt(durationMatch[2], 10)) 
      : 0;
    
    const prList = route?.itdPartialRouteList?.itdPartialRoute;
    const legs = parseLegs(prList);
    
    const departure = legs[0]?.origin;
    const arrival = legs[legs.length - 1]?.destination;
    
    const hints = parseRouteInfo(route.itdInfoTextList);
    
    return {
      duration,
      distance: parseInt(route?.$?.distance || -1, 10),
      interchanges: parseInt(route?.$?.changes || 0, 10),
      departure,
      arrival,
      legs,
      hints: hints.length > 0 ? hints : null,
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
    
    const ptArray = Array.isArray(points) 
      ? points.filter(p => p) 
      : [points].filter(p => p);
    
    if (ptArray.length === 0) return null;
    
    const fromPoint = ptArray[0];
    const toPoint = ptArray[ptArray.length - 1];
    
    const hints = parseLegAttributes(leg.genAttrList);
    
    return {
      mode: mot?.name,
      line: mot?.shortname || mot?.number,
      lineDestination: mot?.destination,     // Destination/endpoint of the line
      direction: mot?.direction,
      duration: parseInt(leg?.$?.timeMinute || 0, 10),
      origin: parsePoint(fromPoint),
      destination: parsePoint(toPoint),      // Arrival stop
      hints
    };
  }).filter(Boolean);
}

function parsePoint(point) {
  if (!point) return null;
  
  const attrs = point.$ || point;
  const name = attrs?.name;
  const usage = attrs?.usage;
  const platform = attrs?.platformName || attrs?.platform;
  
  const dt = point?.itdDateTime?.itdTime?.$ || point?.itdDateTime?.itdTime;
  const date = point?.itdDateTime?.itdDate?.$ || point?.itdDateTime?.itdDate;
  
  const timeStr = dt 
    ? String(dt.hour || '??').padStart(2, '0') + ':' + String(dt.minute || '??').padStart(2, '0') 
    : null;
  
  const dateStr = date
    ? String(date.day || '??').padStart(2, '0') + '.' + String(date.month || '??').padStart(2, '0') + '.' + (date.year || '????')
    : null;
  
  return {
    stop: name,
    usage,
    time: timeStr,
    date: dateStr,
    platform
  };
}

module.exports = { planTrip, planTripById };
