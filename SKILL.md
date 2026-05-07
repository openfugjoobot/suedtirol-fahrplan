---
name: suedtirol-fahrplan
description: Use when asked about bus, train, or cable car departures, routes, or stops in South Tyrol (Südtirol/Alto Adige) — including "Wann fährt", "Abfahrt", "next bus", "Verbindung", "Fahrplan", "Haltestelle", Bozen, Meran, Brixen, Bruneck, or any Südtirol locality
metadata: {"openclaw":{"emoji":"🚌","requires":{"bins":["node"],"env":[]},"always":false}}
user-invocable: true
disable-model-invocation: false
---

# 🚌 Südtirol Fahrplan

Query real-time transit data for South Tyrol via the STA EFA API.

## Usage

For ANY transit question about Südtirol, run the CLI tool:

```bash
node "{baseDir}/bin/transit.js" <command> [args...]
```

### Commands

```bash
# Search stops (German or Italian names)
node "{baseDir}/bin/transit.js" search <name>
# → returns JSON array of {id, name, quality}

# Get next departures (name auto-resolves to best match)
node "{baseDir}/bin/transit.js" departures <stopName> [--limit 8]
# → returns JSON array of {line, destination, scheduledTime, realTime, delayMinutes, platformName, isRealTime}

# Plan a route between two stops
node "{baseDir}/bin/transit.js" route <from> <to> [--limit 3]
# → returns JSON array of {duration, interchanges, legs, departure, arrival}
```

## Presenting results to the user

- **German output** — always present times and directions in German
- Format departures: `⏱️ 18:42 (+3min) | Bus 201 → Brixen Stazione | Gleis B`
- Format routes: `⏱️ 45min (1x Umstieg) | Ab 18:30, An 19:15 | Bus 201 → Zug R123`
- If no results, suggest trying the other language name (German/Italian)
- Use `⏱️` for real-time data, `🕐` for scheduled only

## Data source

- **API:** STA EFA (`https://efa.sta.bz.it/apb/`)
- **Coverage:** Bus, Train, Cable Car — all South Tyrol
- **Names:** Bilingual DE/IT stop names supported
