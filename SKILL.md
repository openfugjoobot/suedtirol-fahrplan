---
name: suedtirol-fahrplan
description: "Südtirol Transit Bot - Bus, Zug, Seilbahn Abfragen"
version: "1.0.0"
author: "openfugjoobot"
emoji: "🚌"
requires:
  node: ">=16.0.0"
  bins: ["node", "npm"]
  env:
    - TELEGRAM_BOT_TOKEN (Telegram bot token)
  packages: ["axios", "telegraf", "async-retry"]
commands:
  start: "Start the Telegram bot"
  stop: "Stop the bot"
---

# 🚌 Südtirol Fahrplan Skill

Transit information for South Tyrol (Südtirol) via the EFA API (südtirolmobil).

## Features

- 🔍 **Stop Search** - Find stops by name (German/Italian)
- 🚌 **Departures** - Real-time departure board
- 🗺️ **Route Planning** - Trip suggestions between stops
- 🤖 **Telegram Bot** - Commands + inline keyboards

## Installation

```bash
clawhub install suedtirol-fahrplan
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   export TELEGRAM_BOT_TOKEN="your-bot-token"
   ```

3. **Start the bot**
   ```bash
   npm start
   # or
   node bot.js
   ```

## Usage

### Telegram Commands

- `/search <Haltestelle>` - Suche nach Haltestellen
- `/next <Haltestelle>` - Nächste Abfahrten
- `/route <Von> -> <Nach>` - Verbindung planen
- `/help` - Hilfe anzeigen

### Examples

- `/search Bolzano` → Zeigt alle Haltestellen in Bolzano
- `/next Merano Stazione` → Abfahrten vom Meraner Bahnhof
- `/route Bolzano -> Brixen` → Verbindung Bozen-Brixen

## Architecture

```
src/
├── api/           # STA API clients
│   ├── client.js  # Axios client
│   ├── stopfinder.js
│   ├── departures.js
│   └── trip.js
├── bot/           # Telegram bot
│   ├── commands.js
│   ├── keyboards.js
│   └── middleware.js
└── index.js       # Main exports
```

## API Source

- Data: [STA](https://www.sta.bz.it)
- Endpoint: `https://efa.sta.bz.it/apb/`

## License

MIT
