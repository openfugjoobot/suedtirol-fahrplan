---
name: brave
homepage: "https://brave.com/search/api/"
description: "Web search via Brave API. Fast, privacy-focused search results."
requires:
  bins:
    - node
  env:
    - BRAVE_API_KEY
commands:
  search: "node {baseDir}/scripts/search.mjs"
metadata:
  emoji: "🦁"
  tags:
    - search
    - web
    - api
