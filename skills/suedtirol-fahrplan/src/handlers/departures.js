/**
 * Telegram handler for /next command
 * Shows next departures for a stop
 */

const { getDepartures, getDeparturesById } = require('../api/departures');
const { findStops, resolveStop } = require('../api/stopfinder');
const { validateStopQuery, sanitizeInput, isStopId } = require('../utils/validators');
const { formatDepartures, formatStopsList, formatError, formatStopChoice, formatLoading } = require('../utils/formatters');

// Store pending selections (userId -> stopOptions)
const pendingSelections = new Map();

/**
 * Handle /next command
 * @param {object} ctx - Telegram context
 */
async function handleNext(ctx) {
  const query = sanitizeInput(ctx.message.text.replace(/^\/next\s*/i, ''));
  
  // Validate input
  const validation = validateStopQuery(query);
  if (!validation.valid) {
    await ctx.reply(validation.error, { parse_mode: 'Markdown' });
    return;
  }

  // Send typing indicator
  await ctx.sendChatAction('typing');
  await ctx.reply(formatLoading(), { parse_mode: 'Markdown' });

  try {
    // Check if input looks like a stop ID
    if (isStopId(query)) {
      await showDeparturesById(ctx, query, query);
      return;
    }

    // Try to resolve the stop
    const stop = await resolveStop(query);

    if (!stop) {
      // Try to find similar stops for selection
      const stops = await findStops(query);
      if (stops.length === 0) {
        await ctx.reply(formatStopsList([], query), { parse_mode: 'Markdown' });
        return;
      }

      // Show selection options
      await showStopSelection(ctx, stops, query);
      return;
    }

    // Show departures for resolved stop
    await showDeparturesById(ctx, stop.id, stop.name);

  } catch (error) {
    console.error('Departures error:', error);
    await ctx.reply(
      formatError('Abfahrten konnten nicht geladen werden', error.message),
      { parse_mode: 'Markdown' }
    );
  }
}

/**
 * Show departures for a stop ID
 * @param {object} ctx - Telegram context
 * @param {string} stopId - Stop ID
 * @param {string} stopName - Stop name for display
 */
async function showDeparturesById(ctx, stopId, stopName) {
  await ctx.sendChatAction('typing');

  const departures = await getDeparturesById(stopId, { limit: 5 });
  const message = formatDepartures(departures, stopName);
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Show selection of stops when multiple are found
 * @param {object} ctx - Telegram context
 * @param {Array} stops - Array of stop options
 * @param {string} query - Original query
 */
async function showStopSelection(ctx, stops, query) {
  // Keep only top 5 matches
  const topStops = stops.slice(0, 5);
  
  // Store pending selection for this user
  pendingSelections.set(ctx.from.id, {
    stops: topStops,
    query,
    timestamp: Date.now()
  });

  // Clean up old entries
  cleanupPendingSelections();

  // Format selection message
  let message = `🤔 Mehrere Haltestellen gefunden für "${query}":\n\n`;
  message += `_Bitte wähle eine Haltestelle mit /select <Nummer>_\n\n`;
  
  topStops.forEach((stop, index) => {
    message += `${index + 1}. ${formatStopChoice(stop)}\n`;
  });

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Handle stop selection from multi-choice
 * @param {object} ctx - Telegram context
 */
async function handleSelect(ctx) {
  const input = sanitizeInput(ctx.message.text.replace(/^\/select\s*/i, ''));
  const selection = parseInt(input, 10);

  if (isNaN(selection) || selection < 1) {
    await ctx.reply('❌ Bitte gib eine gültige Nummer an: /select 1', { parse_mode: 'Markdown' });
    return;
  }

  const pending = pendingSelections.get(ctx.from.id);
  
  if (!pending) {
    await ctx.reply('❌ Keine aktive Auswahl gefunden. Bitte erst /next <Haltestelle> verwenden.', { parse_mode: 'Markdown' });
    return;
  }

  const stop = pending.stops[selection - 1];
  
  if (!stop) {
    await ctx.reply('❌ Ungültige Auswahl. Bitte wähle eine Nummer aus der Liste.', { parse_mode: 'Markdown' });
    return;
  }

  // Remove pending selection
  pendingSelections.delete(ctx.from.id);

  // Show departures for selected stop
  await showDeparturesById(ctx, stop.id, stop.name);
}

/**
 * Cleanup old pending selections (older than 5 minutes)
 */
function cleanupPendingSelections() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  
  for (const [userId, data] of pendingSelections.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      pendingSelections.delete(userId);
    }
  }
}

/**
 * Handle departures callback (for inline keyboards)
 * @param {object} ctx - Telegram context
 */
async function handleDeparturesCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  
  if (!data || !data.startsWith('departures:')) {
    return;
  }

  const stopId = data.replace('departures:', '');
  
  await ctx.answerCbQuery('Lade Abfahrten...');
  await showDeparturesById(ctx, stopId, 'Gewählte Haltestelle');
}

module.exports = {
  handleNext,
  handleSelect,
  handleDeparturesCallback
};
