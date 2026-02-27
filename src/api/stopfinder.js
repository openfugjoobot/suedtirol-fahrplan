const client = require('./client');

async function findStops(query, options = {}) {
  const params = {
    language: 'de',
    coordOutputFormat: 'WGS84[DD.ddddd]',
    locationServerActive: '1',
    useHouseNumberList: 'true',
    type_sf: 'any',
    name_sf: query,
    odvSugMacro: 'true',
    outputFormat: 'JSON',
    outputEncoding: 'UTF-8',
    ...options
  };
  
  const response = await client.get('XML_STOPFINDER_REQUEST', { params });
  return parseStopFinderResponse(response.data);
}

async function resolveStop(query, options = {}) {
  const stops = await findStops(query, options);
  if (stops.length === 0) return null;
  
  const sorted = stops.sort((a, b) => b.quality - a.quality);
  const bestMatch = sorted[0];
  
  if (bestMatch.quality >= 900) return bestMatch;
  return bestMatch.quality > 600 ? bestMatch : null;
}

function parseStopFinderResponse(data) {
  const stopFinder = data?.stopFinder;
  if (!stopFinder) return [];
  
  // Handle nested structure: stopFinder.points.point
  let points = stopFinder.points;
  if (points?.point) {
    points = points.point;
  }
  
  if (!points) return [];
  
  const pointsArray = Array.isArray(points) ? points : [points];
  
  return pointsArray.map(point => ({
    id: point.stateless || point.ref?.id,
    name: point.name,
    place: point.ref?.place || point.mainLoc,
    quality: parseInt(point.quality, 10) || 0,
    type: point.anyType,
    modes: point.modes?.split(',').map(Number) || [],
    coords: point.ref?.coords,
    isBest: point.best === '1'
  })).filter(p => p.id && p.name);
}

module.exports = { findStops, resolveStop };
