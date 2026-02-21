# Südtirol Fahrplan Skill

Telegram bot for South Tyrol public transit schedules using the STA (Strutture Trasporto Alto Adige) EFA API.

## Features

- 🚆 **Stop Search** - Find stations and stops by name (German/Italian)
- 🚏 **Departures** - Real-time departure boards with delays
- 🗺️ **Route Planning** - Trip planning between any two stops
- 🌐 **Bilingual** - Supports both German and Italian
- ⚡ **Real-time** - Live data including delays and platform info

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/search <name>` | Find stops | `/search Brixen` |
| `/next <stop>` | Next departures | `/next Bolzano` |
| `/route <from> to <to>` | Plan a trip | `/route Brixen to Bozen` |
| `/help` | Show help | `/help` |

Aliases: `/suche`, `/s`, `/abfahrt`, `/n`, `/verbindung`, `/r`, `/fahrt`, `/trip`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variable:
```bash
export TELEGRAM_BOT_TOKEN=your_bot_token_here
```

3. Start the bot:
```bash
npm start
```

## API Details

- **Base URL:** `https://efa.sta.bz.it/apb/`
- **Endpoints:**
  - `XML_STOPFINDER_REQUEST` - Search stops
  - `XML_DM_REQUEST` - Departures board
  - `XML_TRIP_REQUEST2` - Trip planning
- **Features:**
  - `odvSugMacro=true` enables bilingual search
  - `ext=ST` for South Tyrol extension
  - All requests use sessionID

## Project Structure

```
suedtirol-fahrplan/
├── src/
│   ├── api/
│   │   ├── client.js       # Axios client with retry
│   │   ├── stopfinder.js   # Stop search API
│   │   ├── trip.js         # Trip planning API
│   │   └── departures.js   # Departures API
│   ├── handlers/
│   │   ├── stopsearch.js   # /search handler
│   │   ├── departures.js   # /next handler
│   │   ├── trip.js         # /route handler
│   │   └── help.js         # /help handler
│   ├── commands/
│   │   └── index.js        # Command router
│   ├── utils/
│   │   ├── formatters.js   # Message formatting
│   │   └── validators.js   # Input validation
│   └── index.js            # Bot entry point
├── bin/
│   └── suedtirol-fahrplan  # CLI wrapper
├── package.json
└── SKILL.md
```

## License

MIT
