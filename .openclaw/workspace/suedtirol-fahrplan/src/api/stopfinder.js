import client from './client.js';
import { get, set, CACHE_TTL } from '../utils/cache.js';

const BASE_PARAMS = {
  odvSugMacro: true,
  outputFormat: 'json'
};

/**
 * Find stops by partial name
 * @param {string} query - Search term (e.g., "Bozen", "Meran")
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} - Array of stop objects
 */
export async function findStop(query, limit = 3) {
  // Check cache first
  const cacheKey = `stop:${query}`;
  const cached = get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    const response = await client.get('/XML_STOPFINDER_REQUEST', {
      params: {
        ...BASE_PARAMS,
        name_sf: query
      }
    });

    const points = response.data?.stopFinder?.points || [];
    
    const stops = points.map(point => ({
      id: point.ref?.id || point.stateless,
      gid: point.ref?.gid,
      name: point.name,
      type: point.anyType, // 'stop' or 'street'
      quality: parseInt(point.quality, 10),
      coords: point.ref?.coords || point.coords,
      place: point.ref?.place
    }));

    // Sort by quality (highest first)
    stops.sort((a, b) => b.quality - a.quality);

    // Cache results
    set(cacheKey, stops, CACHE_TTL.STOPS);

    return stops.slice(0, limit);
  } catch (error) {
    console.error('StopFinder Error:', error.message);
    throw new Error(`Haltestellensuche fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Resolve a stop name to its ID
 * If ambiguous, returns top suggestion
 * @param {string} name - Stop name
 * @returns {Promise<Object>} - { id, name, quality }
 */
export async function resolveStop(name) {
  const stops = await findStop(name, 1);
  
  if (stops.length === 0) {
    throw new Error(`Haltestelle "${name}" nicht gefunden.`);
  }
  
  return stops[0];
}

/**
 * Get multiple stop suggestions for ambiguous names
 * @param {string} name - Partial stop name
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} - Array of possible stops
 */
export async function getSuggestions(name, limit = 3) {
  return await findStop(name, limit);
}
