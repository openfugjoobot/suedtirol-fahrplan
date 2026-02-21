const axios = require('axios');

const API_CONFIG = {
  baseURL: 'https://efa.sta.bz.it/apb/',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'OpenClaw/suedtirol-transit/1.0'
  }
};

// Create axios instance
const client = axios.create(API_CONFIG);

// Retry logic for timeout and network errors
client.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // Only retry once on timeout or network errors
    if (!config.__retryCount && isRetryableError(error)) {
      config.__retryCount = 1;
      await new Promise(r => setTimeout(r, 1000)); // 1s delay
      return client.request(config);
    }
    
    return Promise.reject(error);
  }
);

function isRetryableError(error) {
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET' ||
    (error.response && error.response.status >= 500)
  );
}

module.exports = client;
