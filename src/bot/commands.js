/**
 * Südtirol Fahrplan - Telegram Bot Commands
 * Command handlers for the transit bot
 */

const { findStops, resolveStop } = require('../api/stopfinder');
const { getDepartures, getDeparturesById } = require('../api/departures');
const { planTrip } = require('../api/trip');
const {
  createStopKeyboard,
  createDeparturesKeyboard,
  createRouteKeyboard,
  createHelpKeyboard
} = require('./keyboards');

// ==================== COMMAND HANDLERS ====================

/**
 * Handle /search <Haltestelle>
 * Search for stops by name
 */
async function handleSearchCommand(ctx) {
  const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
  
  if (!query) {
    await ctx.reply(
      '🔍 Bitte gib einen Haltestellennamen ein.\n\n' +
      'Beispiel: `/search Bolzano` oder `/search Brixen`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    await ctx.reply(`🔍 Suche nach "${query}"...`);
    
    const stops = await findStops(query);
    
    if (stops.length === 0) {
      await ctx.reply(
        `❌ Keine Haltestelle für "${query}" gefunden.\n\n` +
        'Tipps:\n' +
        '• Versuche den Namen auf Deutsch oder Italienisch\n' +
        '• Nutze bekannte Ortsnamen (z.B. "Bolzano", "Merano")'
      );
      return;
    }

    if (stops.length === 1) {
      // Single result - show details
      const stop = stops[0];
      await ctx.reply(
        `✅ Haltestelle gefunden:\n\n` +
        `📍 ${stop.name}\n` +
        `🆔 ID: \`${stop.id}\`\n` +
        `📊 Qualität: ${stop.quality}/1000`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Multiple results - show selection keyboard
    const keyboard = createStopKeyboard(stops, 'select_stop');
    await ctx.reply(
      `🔍 ${stops.length} Haltestellen gefunden:\n\n` +
      'Wähle eine aus:',
      { reply_markup: keyboard }
    );

  } catch (error) {
    console.error('Search command error:', error);
    await ctx.reply('❌ Fehler bei der Suche. Bitte versuche es später erneut.');
  }
}

/**
 * Handle /next <Haltestelle>
 * Show next departures for a stop
 */
async function handleNextCommand(ctx) {
  const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
  
  if (!query) {
    await ctx.reply(
      '🚌 Bitte gib eine Haltestelle ein.\n\n' +
      'Beispiel: `/next Bolzano Stazione`'
    );
    return;
  }

  try {
    await ctx.reply(`🔍 Suche "${query}"...`);
    
    // First resolve the stop
    const stop = await resolveStop(query);
    
    if (!stop) {
      await ctx.reply(
        `❌ Haltestelle "${query}" nicht gefunden.\n\n` +
        'Nutze `/search <Name>` um Haltestellen zu durchsuchen.'
      );
      return;
    }

    // Get departures
    await showDepartures(ctx, stop);

  } catch (error) {
    console.error('Next command error:', error);
    await ctx.reply('❌ Fehler beim Abrufen der Abfahrten. Bitte versuche es später erneut.');
  }
}

/**
 * Handle /route <Von> -> <Nach>
 * Plan a route between two stops
 */
async function handleRouteCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
  
  // Parse "from -> to" format
  const separator = args.match(/(->|to|nach)/i);
  
  if (!separator || !args) {
    await ctx.reply(
      '🗺️ Bitte gib Start und Ziel ein.\n\n' +
      'Formate:\n' +
      '`/route Bolzano -> Merano`\n' +
      '`/route Brixen to Sterzing`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const parts = args.split(separator[0]);
  const from = parts[0].trim();
  const to = parts[1]?.trim();

  if (!from || !to) {
    await ctx.reply(
      '❌ Bitte gib sowohl Start als auch Ziel an.\n\n' +
      'Beispiel: `/route Bolzano -> Merano`'
    );
    return;
  }

  try {
    await ctx.reply(`🗺️ Suche Verbindung von "${from}" nach "${to}"...`);
    
    const trips = await planTrip(from, to, { limit: 3 });
    
    if (!trips || trips.length === 0) {
      await ctx.reply(
        '❌ Keine Verbindung gefunden.\n\n' +
        'Mögliche Ursachen:\n' +
        '• Haltestellen nicht gefunden\n' +
        '• Keine direkte Verbindung verfügbar\n' +
        '• Versuche andere Namen oder Zwischenhalte'
      );
      return;
    }

    // Show trips
    let message = `🗺️ Verbindungen: ${from} → ${to}\n\n`;
    
    trips.forEach((trip, index) => {
      const duration = formatDuration(trip.duration);
      const legs = trip.legs.map(l => `${l.line || l.mode}`).join(' → ');
      
      message += `${index + 1}. ⏱️ ${duration}`;
      if (trip.interchanges > 0) {
        message += ` (${trip.interchanges}x Umstieg)`;
      }
      message += `\n   🚌 ${legs}\n\n`;
    });

    const keyboard = createRouteKeyboard(trips);
    await ctx.reply(message, { reply_markup: keyboard });

  } catch (error) {
    console.error('Route command error:', error);
    await ctx.reply('❌ Fehler bei der Routenplanung. Bitte versuche es später erneut.');
  }
}

/**
 * Handle /help command
 */
async function handleHelpCommand(ctx) {
  const message = `
🚌 Südtirol Fahrplan Bot - Hilfe

📍 Verfügbare Commands:

• /search <Haltestelle>
  Haltestelle suchen
  Beispiel: /search Bolzano

• /next <Haltestelle>
  Nächste Abfahrten anzeigen
  Beispiel: /next Merano Stazione

• /route <Von> → <Nach>
  Verbindung planen
  Beispiel: /route Bolzano → Brixen

💡 Tipps:
• Haltestellennamen können auf Deutsch oder Italienisch sein
• Bei unscharfen Ergebnissen werden Vorschläge angezeigt
• Für "next" können Haltestellen-IDs verwendet werden

📊 Datenquelle: STA Südtirol
  `;
  
  const keyboard = createHelpKeyboard();
  await ctx.reply(message, { reply_markup: keyboard });
}

/**
 * Handle text messages (for search flow)
 */
async function handleText(ctx) {
  const text = ctx.message.text;
  
  // Check if we're in a specific session mode
  const session = ctx.session;
  
  if (session?.awaiting === 'stop_for_departures') {
    ctx.session.awaiting = null;
    await handleNextCommand({ ...ctx, message: { text: `/next ${text}` } });
    return;
  }
  
  if (session?.awaiting === 'origin_for_route') {
    ctx.session.awaiting = 'destination_for_route';
    ctx.session.origin = text;
    await ctx.reply(`✅ Start: ${text}\n\nBitte gib das Ziel ein:`);
    return;
  }
  
  if (session?.awaiting === 'destination_for_route') {
    const origin = ctx.session.origin;
    ctx.session = null;
    await handleRouteCommand({ 
      ...ctx, 
      message: { text: `/route ${origin} -> ${text}` } 
    });
    return;
  }
  
  // Default: treat as stop search
  const stops = await findStops(text);
  
  if (stops.length === 0) {
    await ctx.reply(
      `❌ Keine Haltestelle für "${text}" gefunden.\n\n` +
      'Versuche es mit einem anderen Namen oder nutze /search.'
    );
    return;
  }
  
  if (stops.length === 1) {
    await showDepartures(ctx, stops[0]);
    return;
  }
  
  // Multiple stops - show keyboard
  const keyboard = createStopKeyboard(stops, 'select_for_departures');
  await ctx.reply(
    `🔍 ${stops.length} Haltestellen gefunden:\n\n` +
    'Wähle eine für Abfahrtszeiten:',
    { reply_markup: keyboard }
  );
}

// ==================== CALLBACK HANDLERS ====================

/**
 * Handle inline keyboard callbacks
 */
async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  
  try {
    // Parse callback data (format: action:param1:param2)
    const parts = data.split(':');
    const action = parts[0];
    
    switch (action) {
      case 'select_stop': {
        const stopId = parts[1];
        await ctx.answerCbQuery('Lade Details...');
        const stops = await findStops(stopId);
        const stop = stops.find(s => s.id === stopId);
        if (stop) {
          await ctx.editMessageText(
            `✅ Haltestelle:\n\n` +
            `📍 ${stop.name}\n` +
            `🆔 ID: \`${stop.id}\`\n` +
            `📊 Qualität: ${stop.quality}/1000`,
            { parse_mode: 'Markdown' }
          );
        }
        break;
      }
      
      case 'select_for_departures': {
        const stopId = parts[1];
        await ctx.answerCbQuery('Lade Abfahrten...');
        const stops = await findStops(stopId);
        const stop = stops.find(s => s.id === stopId);
        if (stop) {
          await showDepartures(ctx, stop);
        }
        break;
      }
      
      case 'refresh_departures': {
        const stopId = parts[1];
        await ctx.answerCbQuery('Aktualisiere...');
        const stops = await findStops(stopId);
        const stop = stops.find(s => s.id === stopId);
        if (stop) {
          await showDepartures(ctx, stop, true);
        }
        break;
      }
      
      case 'show_route_details': {
        const tripIndex = parseInt(parts[1], 10);
        await ctx.answerCbQuery('Details folgen...');
        // TODO: Show detailed trip information
        break;
      }
      
      case 'start_route_search': {
        ctx.session = { awaiting: 'origin_for_route' };
        await ctx.answerCbQuery('Route planen');
        await ctx.reply('🗺️ Routenplanung\n\nBitte gib den Startort ein:');
        break;
      }
      
      default:
        await ctx.answerCbQuery('Unbekannte Aktion');
    }
    
  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.answerCbQuery('❌ Fehler aufgetreten');
  }
}

// ==================== HELPERS ====================

/**
 * Show departures for a stop
 */
async function showDepartures(ctx, stop, editMessage = false) {
  try {
    const departures = await getDeparturesById(stop.id, { limit: 8 });
    
    if (!departures || departures.length === 0) {
      const message = `📍 ${stop.name}\n\nKeine Abfahrten in den nächsten Stunden gefunden.`;
      if (editMessage) {
        await ctx.editMessageText(message);
      } else {
        await ctx.reply(message);
      }
      return;
    }

    let message = `🚌 ${stop.name}\n`;
    message += `${'─'.repeat(20)}\n\n`;
    
    departures.forEach(dep => {
      const time = dep.realTime || dep.scheduledTime;
      const delay = dep.delayMinutes;
      const delayStr = delay > 0 ? ` (+${delay}min)` : '';
      const line = dep.line || dep.mode || 'Bus';
      const destination = dep.destination || 'Unbekannt';
      const rtIndicator = dep.isRealTime ? '⏱️' : '🕐';
      
      message += `${rtIndicator} ${time}${delayStr}\n`;
      message += `   ${line} → ${destination}\n\n`;
    });

    const keyboard = createDeparturesKeyboard(stop.id);
    
    if (editMessage) {
      await ctx.editMessageText(message, { reply_markup: keyboard });
    } else {
      await ctx.reply(message, { reply_markup: keyboard });
    }

  } catch (error) {
    console.error('Show departures error:', error);
    await ctx.reply('❌ Fehler beim Laden der Abfahrten.');
  }
}

/**
 * Format duration string
 */
function formatDuration(duration) {
  if (!duration) return 'Unbekannt';
  
  // Handle formats like "PT1H30M" or "00:30"
  if (duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/);
    const minutes = duration.match(/(\d+)M/);
    const h = hours ? hours[1] + 'h' : '';
    const m = minutes ? minutes[1] + 'min' : '';
    return `${h} ${m}`.trim();
  }
  
  return duration;
}

// ==================== EXPORTS ====================

module.exports = {
  handleSearchCommand,
  handleNextCommand,
  handleRouteCommand,
  handleHelpCommand,
  handleCallback,
  handleText
};
