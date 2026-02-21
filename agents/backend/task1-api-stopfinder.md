# BackendAgent Task 1: API Client & StopFinder

## Project
**Name:** suedtirol-fahrplan  
**Phase:** 3 - PLANNING → 4 - IMPLEMENTATION  
**Input:** specs/suedtirol-fahrplan/architecture.md

## Deliverable
Create in `skills/suedtirol-fahrplan/src/api/`:
- `client.js` - Axios instance with retry
- `stopfinder.js` - StopFinder API wrapper

## Requirements

### client.js
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb/',
  timeout: 10000,
  headers: { 'Accept': 'application/json' }
});

// Retry interceptor (1 retry on timeout)
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' && !error.config.__retryCount) {
      error.config.__retryCount = 1;
      return api.request(error.config);
    }
    throw error;
  }
);

export default api;
```

### stopfinder.js
```javascript
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
}

/**
 * Resolve stop to ID (returns best match)
 */
export async function resolveStop(name) {
  const stops = await findStops(name, 1);
  return stops[0] || null;
}
```

## Stop Object Format
```javascript
{
  id: "66000998",           // stateless or ref.id
  gid: "it:22021:998",      // global ID
  name: "Brixen, Bahnhof Brixen",
  place: "Brixen",
  quality: 905,             // match confidence
  type: "stop",             // "stop" or "street"
  coords: "702552.00,323652.00"  // APBV projection
}
```

## Testing
Test manually:
```bash
cd skills/suedtirol-fahrplan
node -e "import('./src/api/stopfinder.js').then(m => m.findStops('Brixen')).then(console.log)"
```

## Success Criteria
- [ ] client.js with axios + retry
- [ ] stopfinder.js with findStops()
- [ ] stopfinder.js with resolveStop()
- [ ] CRITICAL: odvSugMacro=true always included
- [ ] Returns clean stop objects
- [ ] Manual tests pass for "Brixen", "Bozen", "Meran"

Return 'TASK1_COMPLETE' when done.
