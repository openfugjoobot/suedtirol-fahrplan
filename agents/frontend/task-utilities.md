# FrontendAgent Task: Utilities

## Project
**Name:** suedtirol-fahrplan  
**Phase:** 3 - PLANNING → 4 - IMPLEMENTATION

## Deliverable
Create in `skills/suedtirol-fahrplan/src/utils/`:
- `format.js` - Output formatting (CLI + Telegram)
- `time.js` - Time/date parsing

## format.js

### CLI Formatting
```javascript
export function formatTripCLI(trips) {
  // Plain text, simple ASCII
  // For terminal output
}

export function formatDeparturesCLI(departures) {
  // Table-like format
}
```

### Telegram Formatting
```javascript
export function formatTripTelegram(trips) {
  // Emoji + markdown
  // 🚂 for train, 🚌 for bus, 🚡 for cable
}

export function formatDeparturesTelegram(departures) {
  // Emoji + markdown
}

// Mode emoji map
const MODE_EMOJI = {
  train: '🚂',
  bus: '🚌', 
  cable: '🚡',
  longdistance: '🚆'
};

// Duration formatter
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
```

## time.js

```javascript
/**
 * Parse various time formats
 * @param {string} input - "15:30", "in 30min", "now"
 * @returns {{time: string, date: string}} - {time: "15:30", date: "20260221"}
 */
export function parseTime(input) {
  const now = new Date();
  
  if (input === 'now' || !input) {
    return {
      time: format(now, 'HH:mm'),
      date: format(now, 'yyyyMMdd')
    };
  }
  
  // Handle "15:30", "15.30", "1530"
  // Handle "in 30min", "in 1h", "in 90min"
  // Handle "tomorrow", "+1", "next monday"
}

// Helper to format for API
export function toAPITime(date) {
  return {
    itdTime: format(date, 'HH:mm'),
    itdDate: format(date, 'yyyyMMdd')
  };
}
```

## Manual Testing
```javascript
// Test formatting
import { formatDuration, formatTripTelegram } from './src/utils/format.js';
console.log(formatDuration(43)); // "43 Min"
console.log(formatDuration(125)); // "2h 5min"

// Test time parsing
import { parseTime } from './src/utils/time.js';
console.log(parseTime('15:30'));
console.log(parseTime('in 30min'));
console.log(parseTime('tomorrow'));
```

## Success Criteria
- [ ] format.js with CLI + Telegram formatters
- [ ] Mode emoji mapping (train, bus, cable)
- [ ] Duration formatter (e.g. "2h 5min")
- [ ] time.js with parseTime()
- [ ] Supports: "15:30", "in 30min", "now", "tomorrow"
- [ ] Manual tests pass

Return 'UTILS_COMPLETE' when done.
