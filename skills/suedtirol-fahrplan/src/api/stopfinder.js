import api from './client.js';

/**
 * Search stops by name (bilingual)
 * CRITICAL: Must include odvSugMacro=true
 */
export async function findStops(query, limit = 3) {
  const params = {
    name_sf: query,
    odvSugMacro: true,  // REQUIRED for German names!
    outputFormat: 'json'
  };
  
  const response = await api.get('/XML_STOPFINDER_REQUEST', { params });
  
  // Parse and return stops array with: id, name, quality, place
  const points = response.data?.stopFinder?.points;
  if (!points) return [];
  
  // Single result comes as object, multiple as array
  const pointsArray = Array.isArray(points) ? points : [points];
  
  // Map to clean stop objects
  const stops = pointsArray.map(point => ({
    id: point.stateless || point.ref?.id,
    gid: point.ref?.gid,
    name: point.name,
    place: point.ref?.place,
    quality: parseInt(point.quality, 10),
    type: point.anyType,
    coords: point.ref?.coords
  }));
  
  // Sort by quality and limit results
  return stops
    .sort((a, b) => b.quality - a.quality)
    .slice(0, limit);
}

/**
 * Resolve stop to ID (returns best match)
 */
export async function resolveStop(name) {
  const stops = await findStops(name, 1);
  return stops[0] || null;
}