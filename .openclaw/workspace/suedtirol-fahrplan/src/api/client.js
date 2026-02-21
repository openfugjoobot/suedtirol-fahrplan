import axios from 'axios';

const client = axios.create({
  baseURL: 'https://efa.sta.bz.it/apb',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'suedtirol-fahrplan/1.0.0'
  }
});

// Retry interceptor for timeouts
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED' && !error.config.__retry) {
      error.config.__retry = true;
      console.log('API timeout, retrying...');
      return client.request(error.config);
    }
    throw error;
  }
);

export default client;

export function handleApiError(error) {
  if (error.code === 'ECONNABORTED') {
    return new Error('API Timeout: Service nicht erreichbar. Bitte später erneut versuchen.');
  }
  if (error.response) {
    return new Error(`API Fehler: ${error.response.status} ${error.response.statusText}`);
  }
  return error;
}
