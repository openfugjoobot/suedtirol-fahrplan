/**
 * Telegram handler for /search command
 * Searches for stops/haltestellen
 */

const { findStops } = require('../api/stopfinder');
const { validateStopQuery, sanitizeInput } = require('../utils/validators');
const { formatStopsList, formatError } = require('../utils/formatters');

/**
 * Handle /search command
 * @param {object} ctx - Telegram context
 */
async function handleSearch(ctx) {
  const query = sanitizeInput(ctx.message.text.replace(/^\/search\s*/i, ''));
  
  // Validate input
  const validation = validateStopQuery(query);
  if (!validation.valid) {
    await ctx.reply(validation.error, { parse_mode: 'Markdown' });
    return;
  }

  // Send typing indicator
  await ctx.sendChatAction('typing');

  try {
    // Search for stops
    const stops = await findStops(query);
    
    if (stops.length === 0) {
      await ctx.reply(formatStopsList([], query), { parse_mode: 'Markdown' });
      return;
    }

    // Format and send results
    const message = formatStopsList(stops, query);
    await ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply(
      formatError('Suche fehlgeschlagen', error.message),
      { parse_mode: 'Markdown' }
    );
  }
}

/**
 * Handle stop suggestion callback (for inline keyboards)
 * @param {object} ctx - Telegram context
 */
async function handleStopCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  
  if (!data || !data.startsWith('stop:')) {
    return;
  }

  const stopId = data.replace('stop:', '');
  
  await ctx.answerCbQuery('Haltestelle ausgewählt');
  await ctx.reply(`Gewählte Haltestelle: ${stopId}`);
}

module.exports = {
  handleSearch,
  handleStopCallback
};
