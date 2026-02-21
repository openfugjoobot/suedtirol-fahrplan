const client = require('./client');

/**
 * Search for stops by query
 * @param {string} query - Stop name to search (German or Italian)
 * @param {object} options - Optional parameters
 * @returns {Promise<Array>} Array of matching stops with {id, name, quality}
 */
async function findStops(query, options = {}) {
  const params = {
    name_sf: query,
    odvSugMacro: 'true',     // REQUIRED for bilingual support (German/Italian)
    outputFormat: 'json',
    ...options
  };
  
  const response = await client.get('XML_STOPFINDER_REQUEST', { params });
  return parseStopFinderResponse(response.data);
}

/**
 * Resolve a single stop with high confidence
 * @param {string} query - Stop name to resolve
 * @param {object} options - Optional parameters
 * @returns {Promise<object|null>} Best matching stop or null with {id, name, quality}
 */
async function resolveStop(query, options = {}) {
  const stops = await findStops(query, options);
  
  if (stops.length === 0) {
    return null;
  }
  
  // Sort by quality (highest first)
  const sorted = stops.sort((a, b) => b.quality - a.quality);
  
  // Return best match if quality is good enough
  const bestMatch = sorted[0];
  if (bestMatch.quality >= 900) {
    return bestMatch;
  }
  
  // Return best match anyway if it's decent (>600)
  return bestMatch.quality > 600 ? bestMatch : null;
}

/**
 * Parse StopFinder response into clean stop objects
 * @param {object} data - Raw API response
 * @returns {Array} Clean stop objects with {id, name, quality, type, place, modes, coords}
 */
function parseStopFinderResponse(data) {
  const points = data?.stopFinder?.points;
  if (!points) return [];
  
  // Single result comes as object, multiple as array
  const pointsArray = Array.isArray(points) ? points : [points];
  
  return pointsArray.map(point => ({
    id: point.stateless || point.ref?.id,
    name: point.name,
    place: point.ref?.place,
    quality: parseInt(point.quality, 10) || 0,
    type: point.anyType,
    modes: point.modes?.split(',').map(Number) || [],
    coords: point.ref?.coords
  }));
}

module.exports = { findStops, resolveStop };
