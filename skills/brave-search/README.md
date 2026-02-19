# Brave Search

Web search via Brave Search API.

## Setup

1. Get API key from https://brave.com/search/api/
2. Add to `.env`: `BRAVE_API_KEY=your_key`

## Usage

```bash
# Basic search
node scripts/search.mjs "openclaw workflow"

# Number of results
node scripts/search.mjs "südtirol events" -n 10
```

## Options

- `-n <count>`: Number of results (default: 5)

## Requires

- Node.js >= 18
- `BRAVE_API_KEY` environment variable
- `node-fetch` package
