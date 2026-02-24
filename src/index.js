/**
 * Main entry point for the Südtirol Fahrplan Telegram Bot
 */

const { Telegraf, session } = require('telegraf');
const { registerCommands } = require('./commands');

// Configuration - read from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('   Set it with: export TELEGRAM_BOT_TOKEN=your_token_here');
  process.exit(1);
}

// Create bot instance
const bot = new Telegraf(BOT_TOKEN, {
  username: BOT_USERNAME
});

// Add session middleware for user state
bot.use(session());

// Error handling
bot.catch((err, ctx) => {
  console.error(`❌ Error for ${ctx.updateType}:`, err);
  
  // Try to notify user
  try {
    ctx.reply('😵 Ein Fehler ist aufgetreten. Bitte versuche es später erneut.', {
      parse_mode: 'Markdown'
    });
  } catch (replyError) {
    console.error('Failed to send error message:', replyError);
  }
});

// Register all commands
registerCommands(bot);

// Launch the bot
async function startBot() {
  console.log('🚆 Starting Südtirol Fahrplan Bot...');
  
  try {
    // Launch with polling (for development)
    // For production, use webhooks
    await bot.launch();
    
    console.log('✅ Bot is running!');
    console.log(`   Bot info: ${BOT_USERNAME || 'unknown'}`);
    console.log('   Press Ctrl+C to stop');
  } catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Start if this file is run directly
if (require.main === module) {
  startBot();
}

module.exports = { bot, startBot };
