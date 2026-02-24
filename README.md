# 🚌 Südtirol Fahrplan Skill

Complete transit information for South Tyrol (Südtirol) via the EFA API (südtirolmobil).

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./SKILL.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## 🚀 Quick Start

```bash
# Install and start
npm install
export SUE_FAHRPLAN_BOT_TOKEN="your-bot-token"
npm start
```

## ✨ Features

- 🔍 **Stop Search** - Find stops by name (German or Italian)
- 🚌 **Real-time Departures** - Live departure board with delays
- 🗺️ **Route Planning** - Trip suggestions between any stops
- 🤖 **Telegram Bot** - Commands + inline keyboards
- 🌍 **Bilingual** - Supports German and Italian stop names

## 📦 Installation

### Via clawhub (recommended)
```bash
clawhub install suedtirol-fahrplan
```

### Manual
```bash
git clone https://github.com/openfugjoobot/suedtirol-fahrplan.git
cd suedtirol-fahrplan
npm install
```

## ⚙️ Configuration

Create `.env` file:

```bash
# Required: Telegram bot token (get from @BotFather)
SUE_FAHRPLAN_BOT_TOKEN=your-bot-token

# Optional: Override default settings
# API_TIMEOUT=10000
```

## 💬 Usage

### Telegram Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Welcome message | `/start` |
| `/search <name>` | Search stops | `/search Bolzano` |
| `/next <stop>` | Next departures | `/next Merano Stazione` |
| `/route <from> -> <to>` | Plan route | `/route Bolzano -> Brixen` |
| `/help` | Show help | `/help` |

### Natural Language Examples

The bot also accepts direct text input:

- "Bolzano" → Shows stops and asks for selection
- "Abfahrten Meran" → Shows next departures from Merano

### Inline Keyboards

- 🔄 **Aktualisieren** - Refresh departures
- 🗺️ **Route planen** - Start route planning
- 📍 **Stop selection** - Choose from multiple matches

## 🏗️ Architecture

```
src/
├── api/              # STA API integration
│   ├── client.js     # Axios HTTP client
│   ├── stopfinder.js # Stop search API
│   ├── departures.js # Departure board API
│   └── trip.js       # Route planning API
├── bot/              # Telegram bot
│   ├── commands.js   # Command handlers
│   ├── keyboards.js  # Inline keyboards
│   └── middleware.js # Logging & session
├── index.js          # Main module exports
└── ...

bot.js                # Telegram bot entry point
```

## 📊 Data Source

- **Provider:** STA Südtirol (Strutture Trasporto Alto Adige)
- **API:** EFA (Elektronische Fahrplan-Auskunft)
- **Endpoint:** `https://efa.sta.bz.it/apb/`
- **Coverage:** Bus, Train, Cable Car in South Tyrol

## 🧪 Testing

```bash
npm test
```

**Test Coverage:**
- API client: Connection, retry logic, error handling
- Stop finder: Search, resolution, bilingual support
- Departures: Parsing, delay calculation
- Trip planning: Route parsing
- Bot commands: Command handlers, callbacks

## 📝 API Usage

```javascript
const { transit } = require('./src/index.js');

// Search stops
const stops = await transit.searchStops('Bolzano');

// Get departures
const departures = await transit.getNextDepartures('Bolzano Stazione');

// Plan route
const trips = await transit.planRoute('Bolzano', 'Merano');
```

## 📚 Documentation

- [SKILL.md](./SKILL.md) - Skill metadata
- [REQUIREMENTS.md](./REQUIREMENTS.md) - User requirements
- [CHANGELOG.md](./CHANGELOG.md) - Version history

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT © OpenFugjooBot

## 🙏 Credits

- Data: [STA](https://www.sta.bz.it)
- API: EFA (Elektronische Fahrplan-Auskunft)
