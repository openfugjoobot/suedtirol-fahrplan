import axios from 'axios';
import retry from 'async-retry';

const client = axios.create({
  baseURL: 'https://suedtirol-fahrplan.it',
  timeout: 10000,
});

client.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config || !config.retry) {
      return Promise.reject(error);
    }
    return retry(
      async (bail, attempt) => {
        try {
          const response = await axios(config);
          return response.data;
        } catch (err) {
          if (attempt === config.retry.retries) {
            bail(err);
            return;
          }
          throw err;
        }
      },
      { retries: config.retry.retries || 3 }
    );
  }
);

export default client;