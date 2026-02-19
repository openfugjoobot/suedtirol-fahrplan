// Brave Search API Client
// Usage: node search.mjs "query" [-n 5]

import fetch from 'node-fetch';

const API_KEY = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
const API_URL = 'https://api.search.brave.com/res/v1/web/search';

async function search(query, options = {}) {
  if (!API_KEY) {
    console.error('❌ BRAVE_API_KEY not set');
    process.exit(1);
  }

  const count = options.count || 5;
  
  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}&count=${count}`, {
      method: 'GET',
      headers: {
        'X-Subscription-Token': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Search failed:', error.message);
    process.exit(1);
  }
}

const query = process.argv[2];
const countArg = process.argv.indexOf('-n');
const count = countArg > -1 ? parseInt(process.argv[countArg + 1]) : 5;

if (!query) {
  console.log('Usage: node search.mjs "your query" [-n 5]');
  process.exit(1);
}

search(query, { count });
