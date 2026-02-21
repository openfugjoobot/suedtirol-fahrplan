/**
 * Südtirol Fahrplan Telegram Bot
 * Entry point for the Telegram bot
 */

require('dotenv').config();

const { Telegraf } = require('telegraf');
const { session } = require('telegraf');
const {
  handleSearchCommand,
  handleNextCommand,
  handleRouteCommand,
  handleHelpCommand,
  handleCallback,
  handleText
} = require('./src/bot/commands');
const { loggerMiddleware, errorMiddleware } = require('./src/bot/middleware');

// Bot Token
const BOT_TOKEN = process.env.SUE_FAHRPLAN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Kein Bot Token gefunden!');
  console.error('Setze SUE_FAHRPLAN_BOT_TOKEN in .env');
  process.exit(1);
}

console.log('🚌 Starte Südtirol Fahrplan Bot...');

const bot = new Telegraf(BOT_TOKEN);

// Middleware
bot.use(session());
bot.use(loggerMiddleware);
bot.use(errorMiddleware);

// Commands
bot.command('start', (ctx) => {
  ctx.reply(
    '🚌 Willkommen beim Südtirol Fahrplan Bot!\n\n' +
    'Ich helfe dir mit Abfahrtszeiten und Verbindungen in Südtirol.\n\n' +
    'Verfügbare Commands:\n' +
    '/search <Haltestelle> - Haltestelle suchen\n' +
    '/next <Haltestelle> - Nächste Abfahrten\n' +
    '/route <Von> -> <Nach> - Verbindung planen\n' +
    '/help - Hilfe'
  );
});

bot.command('search', handleSearchCommand);
bot.command('next', handleNextCommand);
bot.command('route', handleRouteCommand);
bot.command('help', handleHelpCommand);

// Callbacks for Inline Keyboards
bot.on('callback_query', handleCallback);

// Text messages (for stop search flow)
bot.on('text', handleText);

// Error Handler
bot.catch((err, ctx) => {
  console.error('❌ Bot Error:', err);
  ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
});

// Start Bot
bot.launch();
console.log('✅ Südtirol Fahrplan Bot läuft!');
console.log('Drücke Ctrl+C zum Beenden');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
