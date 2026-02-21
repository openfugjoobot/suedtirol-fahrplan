/**
 * Message formatting helpers for Telegram output
 */

// Transport mode emojis
const MODE_EMOJIS = {
  'Train': '🚂',
  'S-Bahn': '🚆',
  'U-Bahn': '🚇',
  'Bus': '🚌',
  'Tram': '🚊',
  'Regional Bus': '🚌',
  'City Bus': '🚌',
  'Cable Car': '🚡',
  'Ropeway': '🚠',
  'Ferry': '⛴️',
  'Train Shuttle': '🚆',
  'Regional Train': '🚆',
  'Long-distance Bus': '🚌',
  'Other': '🚐',
  'On-demand': '🚐',
  'Unknown': '🚐'
};

// Transport mode codes to emoji
const MODE_CODE_EMOJIS = {
  0: '🚂', // Train
  1: '🚆', // S-Bahn
  2: '🚇', // U-Bahn
  3: '🚌', // Bus
  4: '🚊', // Tram
  5: '🚌', // Regional Bus
  6: '🚌', // City Bus
  7: '🚡', // Cable Car
  8: '🚠', // Ropeway
  9: '⛴️', // Ferry
  10: '🚆', // Train Shuttle
  11: '🚆', // Regional Train
  14: '🚌', // Long-distance Bus
  15: '🚐', // Other
  16: '🚐', // On-demand
  17: '🚌'  // Regional Bus (SASA)
};

/**
 * Format stops search results for Telegram
 * @param {Array} stops - Array of stop objects
 * @param {string} query - The search query
 * @returns {string} Formatted message
 */
function formatStopsList(stops, query) {
  if (!stops || stops.length === 0) {
    return `❌ Keine Haltestellen gefunden für "${escapeMarkdown(query)}"`;
  }

  let message = `🔍 *Haltestellen für "${escapeMarkdown(query)}":*\n\n`;
  
  stops.slice(0, 5).forEach((stop, index) => {
    const emoji = getStopEmoji(stop.modes);
    message += `${index + 1}. ${emoji} *${escapeMarkdown(stop.name)}*`;
    if (stop.place) {
      message += ` _(${escapeMarkdown(stop.place)})_`;
    }
    message += `\n`;
    if (stop.quality) {
      message += `   📍 ID: \`${stop.id}\` | Match: ${stop.quality}%\n`;
    }
    message += `\n`;
  });

  if (stops.length > 5) {
    message += `_... und ${stops.length - 5} weitere_`;
  }

  return message;
}

/**
 * Format departures for Telegram
 * @param {Array} departures - Array of departure objects
 * @param {string} stopName - Stop name
 * @returns {string} Formatted message
 */
function formatDepartures(departures, stopName) {
  if (!departures || departures.length === 0) {
    return `🚏 *${escapeMarkdown(stopName)}*\n\n❌ Keine Abfahrten in der nächsten Zeit.`;
  }

  let message = `🚏 *Abfahrten: ${escapeMarkdown(stopName)}*\n\n`;

  departures.forEach((dep, index) => {
    const emoji = MODE_EMOJIS[dep.mode] || '🚌';
    const line = dep.line || '?';
    const destination = escapeMarkdown(dep.destination || 'Unbekannt');
    
    // Time display with delay info
    let timeDisplay = dep.scheduledTime || '--:--';
    if (dep.delayMinutes > 0) {
      timeDisplay += ` ⚠️ +${dep.delayMinutes}min`;
    } else if (dep.delayMinutes === 0 && dep.isRealTime) {
      timeDisplay += ' ✅';
    }

    message += `${emoji} *${line}* → ${destination}\n`;
    message += `   🕐 ${timeDisplay}`;
    
    if (dep.platform) {
      message += ` | 🚉 Gleis ${dep.platform}`;
    }
    
    if (dep.isRealTime) {
      message += ' _(live)_';
    }
    
    message += '\n\n';
  });

  return message;
}

/**
 * Format trip routes for Telegram
 * @param {Array} trips - Array of trip objects
 * @param {string} from - Origin name
 * @param {string} to - Destination name
 * @returns {string} Formatted message
 */
function formatTrips(trips, from, to) {
  if (!trips || trips.length === 0) {
    return `🗺️ *Verbindung: ${escapeMarkdown(from)} → ${escapeMarkdown(to)}*\n\n❌ Keine Verbindungen gefunden.`;
  }

  let message = `🗺️ *Verbindung: ${escapeMarkdown(from)} → ${escapeMarkdown(to)}*\n\n`;

  trips.slice(0, 3).forEach((trip, index) => {
    const duration = trip.duration || '--:--';
    const distance = trip.distance ? `(${(trip.distance / 1000).toFixed(1)} km)` : '';
    const changes = trip.interchanges || 0;
    
    message += `*Option ${index + 1}* ⏱️ ${duration} ${distance}\n`;
    message += `   🔄 ${changes} Umstieg${changes !== 1 ? 'e' : ''}\n`;
    
    if (trip.legs && trip.legs.length > 0) {
      message += '\n';
      trip.legs.forEach((leg, legIndex) => {
        const emoji = MODE_EMOJIS[leg.mode] || '🚌';
        const line = leg.line || '';
        const legDuration = leg.duration ? `(${leg.duration})` : '';
        
        if (leg.origin && leg.destination) {
          message += `${emoji} ${line ? '*' + line + '* ' : ''}${escapeMarkdown(leg.origin.name || '')}`;
          message += ` → ${escapeMarkdown(leg.destination.name || '')} ${legDuration}\n`;
          
          // Departure/arrival times
          if (leg.origin.time || leg.destination.time) {
            message += `   🕐 ${leg.origin.time || ''} → ${leg.destination.time || ''}`;
            if (leg.origin.platform) {
              message += ` | 🚉 Gleis ${leg.origin.platform}`;
            }
            message += '\n';
          }
        }
        
        if (legIndex < trip.legs.length - 1) {
          message += '\n';
        }
      });
    }
    
    if (index < trips.length - 1) {
      message += '\n─────────────\n\n';
    }
  });

  return message;
}

/**
 * Format a single stop for selection
 * @param {object} stop - Stop object
 * @returns {string} Formatted stop name
 */
function formatStopChoice(stop) {
  const emoji = getStopEmoji(stop.modes);
  let text = `${emoji} ${stop.name}`;
  if (stop.place) {
    text += ` (${stop.place})`;
  }
  return text;
}

/**
 * Get emoji for stop based on transport modes
 * @param {Array} modes - Array of mode codes
 * @returns {string} Emoji
 */
function getStopEmoji(modes) {
  if (!modes || modes.length === 0) return '🚏';
  
  // Return emoji for primary mode
  const primaryMode = modes[0];
  return MODE_CODE_EMOJIS[primaryMode] || '🚏';
}

/**
 * Escape special Markdown characters
 * @param {string} text - Raw text
 * @returns {string} Escaped text
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Format help message
 * @returns {string} Help text
 */
function formatHelp() {
  return `
🚆 *Südtirol Fahrplan Bot*

Verfügbare Befehle:

🔍 */search* <Haltestelle>
   Haltestellen suchen

🚏 */next* <Haltestelle>
   Nächste Abfahrten

🗺️ */route* <Von> to <Nach>
   Verbindung planen

📖 */help*
   Diese Hilfe anzeigen

*Beispiele:*
\`/search Brixen\`
\`/next Bolzano Stazione\`
\`/route Brixen to Bozen\`

_Unterstützt Deutsch und Italienisch_
`;
}

/**
 * Format error message
 * @param {string} error - Error message
 * @param {string} [context] - Additional context
 * @returns {string} Formatted error
 */
function formatError(error, context) {
  let message = '❌ *Fehler*\n\n';
  message += error;
  if (context) {
    message += `\n\n_${escapeMarkdown(context)}_`;
  }
  return message;
}

/**
 * Format "typing" placeholder while loading
 * @returns {string} Loading message
 */
function formatLoading() {
  return '⏳ *Suche läuft...*';
}

module.exports = {
  formatStopsList,
  formatDepartures,
  formatTrips,
  formatStopChoice,
  getStopEmoji,
  escapeMarkdown,
  formatHelp,
  formatError,
  formatLoading
};
