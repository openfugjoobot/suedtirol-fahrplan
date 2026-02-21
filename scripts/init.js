#!/usr/bin/env node
/**
 * Initialization Script
 * Verifies installation and displays setup instructions
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(50));
console.log('🚌 Südtirol Fahrplan - Initialization');
console.log('='.repeat(50));

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

console.log(`\n📋 System Check:`);
console.log(`  Node.js: ${nodeVersion}`);

if (majorVersion < 16) {
  console.error('  ❌ Node.js >= 16.0.0 required');
  process.exit(1);
} else {
  console.log('  ✅ Node.js version OK');
}

// Check dependencies
console.log('\n📦 Dependencies:');
try {
  require('axios');
  console.log('  ✅ axios');
} catch (e) {
  console.error('  ❌ axios - Run: npm install');
}

try {
  require('telegraf');
  console.log('  ✅ telegraf');
} catch (e) {
  console.error('  ❌ telegraf - Run: npm install');
}

try {
  require('async-retry');
  console.log('  ✅ async-retry');
} catch (e) {
  console.error('  ❌ async-retry - Run: npm install');
}

// Check environment
console.log('\n🔐 Environment:');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('  ✅ .env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasToken = envContent.includes('SUE_FAHRPLAN_BOT_TOKEN') || 
                   envContent.includes('TELEGRAM_BOT_TOKEN');
  
  if (hasToken) {
    console.log('  ✅ Bot token configured');
  } else {
    console.log('  ⚠️  No bot token found in .env');
  }
} else {
  console.log('  ⚠️  No .env file found');
  console.log('  → Copy .env.example to .env and add your token');
}

// Check directories
console.log('\n📁 Directories:');
const dirs = ['src/api', 'src/bot', 'tests', 'scripts'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ⚠️  ${dir} missing`);
  }
});

// Display setup info
console.log('\n' + '='.repeat(50));
console.log('🚀 Setup Instructions:');
console.log('='.repeat(50));
console.log('');
console.log('1. Get a Telegram bot token from @BotFather');
console.log('2. Create .env file:');
console.log('   cp .env.example .env');
console.log('');
console.log('3. Edit .env and add your token:');
console.log('   SUE_FAHRPLAN_BOT_TOKEN=your-token-here');
console.log('');
console.log('4. Start the bot:');
console.log('   npm start');
console.log('   # or');
console.log('   node bot.js');
console.log('');
console.log('5. Test the bot:');
console.log('   Send /start to your bot on Telegram');
console.log('');
console.log('='.repeat(50));
console.log('✅ Initialization complete!');
console.log('='.repeat(50));
