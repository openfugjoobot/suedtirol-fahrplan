/**
 * Command router for the Telegram bot
 * Registers all command handlers
 */

const { handleSearch } = require('../handlers/stopsearch');
const { handleNext, handleSelect } = require('../handlers/departures');
const { handleRoute, handleTripSelect } = require('../handlers/trip');
const { handleHelp, handleStart } = require('../handlers/help');

/**
 * Register all commands on the bot
 * @param {object} bot - Telegraf bot instance
 */
function registerCommands(bot) {
  // Start and help
  bot.command('start', handleStart);
  bot.command('help', handleHelp);

  // Search commands
  bot.command('search', handleSearch);
  
  // Departures commands
  bot.command('next', handleNext);
  bot.command('select', handleSelect);
  
  // Trip planning commands
  bot.command('route', handleRoute);
  bot.command('tripselect', handleTripSelect);

  // Common aliases
  bot.command(['suche', 'find', 's'], handleSearch);
  bot.command(['abfahrt', 'n', 'departures'], handleNext);
  bot.command(['verbindung', 'r', 'trip', 'fahrt'], handleRoute);

  // Handle plain text messages (helpful fallback)
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    // Don't respond to bot commands
    if (text.startsWith('/')) {
      await ctx.reply('❓ Unbekannter Befehl. Verwende /help für eine Liste aller Befehle.', {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Could add natural language processing here in the future
    await ctx.reply(`_Du hast geschrieben:_ "${text}"\n\nVerwende einen Befehl wie /search, /next oder /route.\nFür Hilfe: /help`, {
      parse_mode: 'Markdown'
    });
  });
}

module.exports = {
  registerCommands
};
