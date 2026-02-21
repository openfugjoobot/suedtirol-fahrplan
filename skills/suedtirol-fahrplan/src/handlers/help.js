/**
 * Help handler
 */

const { formatHelp } = require('../utils/formatters');

/**
 * Handle /start and /help commands
 * @param {object} ctx - Telegram context
 */
async function handleHelp(ctx) {
  await ctx.reply(formatHelp(), { 
    parse_mode: 'Markdown',
    disable_web_page_preview: true 
  });
}

/**
 * Handle /start command
 * @param {object} ctx - Telegram context
 */
async function handleStart(ctx) {
  const welcomeMessage = `
🚆 *Willkommen beim Südtirol Fahrplan Bot!*

Ich helfe dir bei der Suche nach Verbindungen und Abfahrten im öffentlichen Nahverkehr Südtirols.

_Befehle:_
🔍 */search* <Haltestelle> - Haltestellen suchen
🚏 */next* <Haltestelle> - Nächste Abfahrten
🗺️ */route* <Von> to <Nach> - Verbindung planen
📖 */help* - Hilfe anzeigen

_Beispiel:_
\`/route Brixen to Bozen\`

*Viel Spaß! 🚂*
`;

  await ctx.reply(welcomeMessage, { 
    parse_mode: 'Markdown',
    disable_web_page_preview: true 
  });
}

module.exports = {
  handleHelp,
  handleStart
};
