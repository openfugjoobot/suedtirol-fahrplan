# CHANGELOG.md

## [1.0.0] - 2026-02-21

### Added
- Initial release of Südtirol Fahrplan Skill
- **Telegram Bot** with 4 core commands:
  - `/search` - Find stops by name
  - `/next` - Show next departures
  - `/route` - Plan trips between stops
  - `/help` - Display help
- **API Integration:**
  - STA EFA API client with axios
  - Automatic retry on network errors
  - 10 second timeout with fallback
- **Stop Search:**
  - Bilingual support (German/Italian)
  - Quality-based result ranking
  - Inline keyboard for multiple matches
- **Departure Board:**
  - Real-time departure info
  - Delay calculation and display
  - Platform numbers when available
  - Transport mode identification
- **Route Planning:**
  - Trip alternatives with duration
  - Interchange information
  - Leg details with line numbers
- **Bot Features:**
  - Session management
  - Logging middleware
  - Rate limiting support
  - Error handling
- **Documentation:**
  - SKILL.md with frontmatter
  - README.md with full usage guide
  - REQUIREMENTS.md (Phase 0 style)
  - Inline code documentation
- **Testing:**
  - API client tests
  - Bot command tests
  - Integration tests

### API Endpoints Used
- `XML_STOPFINDER_REQUEST` - Stop search
- `XML_DM_REQUEST` - Departure board
- `XML_TRIP_REQUEST2` - Route planning

### Data Source
- [STA Südtirol](https://www.sta.bz.it) - Official transit authority
