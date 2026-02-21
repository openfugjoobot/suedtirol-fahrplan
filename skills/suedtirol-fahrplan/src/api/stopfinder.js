import client from './client.js';

const API_ENDPOINT = '/bin/query.exe/mss';

export async function findStops(query) {
  try {
    const params = new URLSearchParams({
      start: '1',
      L: 'vs_json',
      odvSugMacro: 'true',
      query,
    });

    const response = await client.get(API_ENDPOINT, { params });
    
    if (response.data && response.data.stations) {
      return response.data.stations;
    }
    
    return [];
  } catch (error) {
    console.error(`Error finding stops for query "${query}":`, error.message);
    return [];
  }
}