/**
 * Telegram handler for /route command
 * Plans trips between two stops
 */

const { planTrip, planTripById } = require('../api/trip');
const { findStops, resolveStop } = require('../api/stopfinder');
const { parseRouteArgs, sanitizeInput, isStopId } = require('../utils/validators');
const { formatTrips, formatStopsList, formatError, formatStopChoice, formatLoading } = require('../utils/formatters');

// Store pending selections for origin/destination
const pendingTripSelections = new Map();

/**
 * Handle /route command
 * @param {object} ctx - Telegram context
 */
async function handleRoute(ctx) {
  const args = sanitizeInput(ctx.message.text.replace(/^\/route\s*/i, ''));
  
  // Parse route arguments
  const parsed = parseRouteArgs(args);
  
  if (!parsed.valid) {
    await ctx.reply(parsed.error ? `❌ ${parsed.error}` : '❌ Ungültige Eingabe', { parse_mode: 'Markdown' });
    return;
  }

  // Send typing indicator
  await ctx.sendChatAction('typing');
  await ctx.reply(formatLoading(), { parse_mode: 'Markdown' });

  try {
    // Try to resolve both stops
    const [fromStop, toStop] = await Promise.all([
      resolveOrFindStop(parsed.from),
      resolveOrFindStop(parsed.to)
    ]);

    // Handle origin ambiguity
    if (Array.isArray(fromStop)) {
      if (fromStop.length === 0) {
        await ctx.reply(formatStopsList([], parsed.from), { parse_mode: 'Markdown' });
        return;
      }
      await showTripOriginSelection(ctx, fromStop, toStop, parsed.from, parsed.to);
      return;
    }

    // Handle destination ambiguity
    if (Array.isArray(toStop)) {
      if (toStop.length === 0) {
        await ctx.reply(formatStopsList([], parsed.to), { parse_mode: 'Markdown' });
        return;
      }
      await showTripDestinationSelection(ctx, fromStop, toStop, parsed.from, parsed.to);
      return;
    }

    // Both stops resolved - plan the trip
    await planAndShowTrips(
      ctx, 
      fromStop.id || parsed.from, 
      toStop.id || parsed.to, 
      fromStop.name || parsed.from,
      toStop.name || parsed.to
    );

  } catch (error) {
    console.error('Route error:', error);
    await ctx.reply(
      formatError('Verbindungssuche fehlgeschlagen', error.message),
      { parse_mode: 'Markdown' }
    );
  }
}

/**
 * Resolve a stop or return list of options
 * @param {string} query - Stop query
 * @returns {Promise<object|Array>} Resolved stop or array of options
 */
async function resolveOrFindStop(query) {
  // Check if it's already a stop ID
  if (isStopId(query)) {
    return { id: query, name: query };
  }

  // Try to resolve
  const resolved = await resolveStop(query);
  if (resolved) {
    return resolved;
  }

  // Return list of options
  return await findStops(query);
}

/**
 * Plan and show trips
 * @param {object} ctx - Telegram context
 * @param {string} fromId - Origin ID
 * @param {string} toId - Destination ID
 * @param {string} fromName - Origin name
 * @param {string} toName - Destination name
 */
async function planAndShowTrips(ctx, fromId, toId, fromName, toName) {
  await ctx.sendChatAction('typing');

  // Use ID-based planning if we have IDs, otherwise name-based
  let trips;
  if (isStopId(fromId) && isStopId(toId)) {
    trips = await planTripById(fromId, toId, { limit: 3 });
  } else {
    trips = await planTrip(fromId, toId, { limit: 3 });
  }

  const message = formatTrips(trips, fromName, toName);
  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Show selection for origin stop
 * @param {object} ctx - Telegram context
 * @param {Array} fromStops - Origin stop options
 * @param {object} toStop - Resolved destination stop
 * @param {string} fromQuery - Original from query
 * @param {string} toQuery - Original to query
 */
async function showTripOriginSelection(ctx, fromStops, toStop, fromQuery, toQuery) {
  const topStops = fromStops.slice(0, 5);
  
  pendingTripSelections.set(ctx.from.id, {
    type: 'origin',
    toStop: Array.isArray(toStop) ? null : toStop,
    toOptions: Array.isArray(toStop) ? toStop : null,
    toQuery,
    fromOptions: topStops,
    timestamp: Date.now()
  });

  cleanupPendingSelections();

  let message = `🤔 Mehrere mögliche Ursprünge für "${fromQuery}":\n\n`;
  message += `_Bitte wähle mit /tripselect <Nummer>_\n\n`;
  
  topStops.forEach((stop, index) => {
    message += `${index + 1}. ${formatStopChoice(stop)}\n`;
  });

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Show selection for destination stop
 * @param {object} ctx - Telegram context
 * @param {object} fromStop - Resolved origin stop
 * @param {Array} toStops - Destination stop options
 * @param {string} fromQuery - Original from query
 * @param {string} toQuery - Original to query
 */
async function showTripDestinationSelection(ctx, fromStop, toStops, fromQuery, toQuery) {
  const topStops = toStops.slice(0, 5);
  
  pendingTripSelections.set(ctx.from.id, {
    type: 'destination',
    fromStop,
    toOptions: topStops,
    fromQuery,
    toQuery,
    timestamp: Date.now()
  });

  cleanupPendingSelections();

  let message = `🤔 Mehrere mögliche Ziele für "${toQuery}":\n\n`;
  message += `_Bitte wähle mit /tripselect <Nummer>_\n\n`;
  
  topStops.forEach((stop, index) => {
    message += `${index + 1}. ${formatStopChoice(stop)}\n`;
  });

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Handle trip selection from multi-choice
 * @param {object} ctx - Telegram context
 */
async function handleTripSelect(ctx) {
  const input = sanitizeInput(ctx.message.text.replace(/^\/tripselect\s*/i, ''));
  const selection = parseInt(input, 10);

  if (isNaN(selection) || selection < 1) {
    await ctx.reply('❌ Bitte gib eine gültige Nummer an: /tripselect 1', { parse_mode: 'Markdown' });
    return;
  }

  const pending = pendingTripSelections.get(ctx.from.id);
  
  if (!pending) {
    await ctx.reply('❌ Keine aktive Auswahl gefunden. Bitte erst /route <Von> to <Nach> verwenden.', { parse_mode: 'Markdown' });
    return;
  }

  pendingTripSelections.delete(ctx.from.id);

  try {
    let fromStop, toStop, fromName, toName;

    if (pending.type === 'origin') {
      // Origin was selected
      fromStop = pending.fromOptions[selection - 1];
      if (!fromStop) {
        await ctx.reply('❌ Ungültige Auswahl.', { parse_mode: 'Markdown' });
        return;
      }

      // Now check if we still need to resolve destination
      if (pending.toOptions) {
        // Both were ambiguous - need to select destination
        await showTripDestinationSelection(ctx, fromStop, pending.toOptions, fromStop.name, pending.toQuery);
        return;
      }

      toStop = pending.toStop;
      fromName = fromStop.name;
      toName = toStop?.name || pending.toQuery;

      await planAndShowTrips(ctx, fromStop.id, toStop?.id || pending.toQuery, fromName, toName);

    } else {
      // Destination was selected
      toStop = pending.toOptions[selection - 1];
      if (!toStop) {
        await ctx.reply('❌ Ungültige Auswahl.', { parse_mode: 'Markdown' });
        return;
      }

      fromStop = pending.fromStop;
      fromName = fromStop?.name || pending.fromQuery;
      toName = toStop.name;

      await planAndShowTrips(ctx, fromStop?.id || pending.fromQuery, toStop.id, fromName, toName);
    }

  } catch (error) {
    console.error('Trip select error:', error);
    await ctx.reply(
      formatError('Verbindungssuche fehlgeschlagen', error.message),
      { parse_mode: 'Markdown' }
    );
  }
}

/**
 * Cleanup old pending selections (older than 5 minutes)
 */
function cleanupPendingSelections() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  
  for (const [userId, data] of pendingTripSelections.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      pendingTripSelections.delete(userId);
    }
  }
}

module.exports = {
  handleRoute,
  handleTripSelect
};
