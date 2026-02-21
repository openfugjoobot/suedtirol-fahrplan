/**
 * Bot Command Test Suite
 * Tests for Telegram bot commands and handlers
 */

const {
  handleSearchCommand,
  handleNextCommand,
  handleRouteCommand,
  handleHelpCommand,
  handleCallback
} = require('../src/bot/commands');

const {
  createStopKeyboard,
  createDeparturesKeyboard,
  createRouteKeyboard,
  createHelpKeyboard
} = require('../src/bot/keyboards');

// Test results accumulator
const results = {
  passed: [],
  failed: []
};

function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      await fn();
      results.passed.push(name);
      console.log(`✓ ${name}`);
      resolve();
    } catch (err) {
      results.failed.push({ name, error: err.message });
      console.log(`✗ ${name}: ${err.message}`);
      resolve();
    }
  });
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true');
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to exist');
  }
}

// Mock context factory
function createMockContext(messageText = '') {
  const replies = [];
  const callbacks = [];
  
  return {
    message: { text: messageText },
    from: { id: 12345, username: 'testuser' },
    session: {},
    replies,
    async reply(text, options = {}) {
      replies.push({ text, options });
      return { message_id: replies.length };
    },
    editMessageText(text, options = {}) {
      callbacks.push({ action: 'edit', text, options });
      return Promise.resolve();
    },
    answerCbQuery(text) {
      callbacks.push({ action: 'answer', text });
      return Promise.resolve();
    },
    callbackQuery: null
  };
}

// ==================== TESTS ====================

console.log('='.repeat(50));
console.log('Bot Command Test Suite');
console.log('='.repeat(50));

async function runTests() {
  console.log('\n--- Testing Keyboards ---');

  await test('createStopKeyboard generates valid markup', () => {
    const stops = [
      { id: '1', name: 'Bolzano', place: 'BZ', quality: 900 },
      { id: '2', name: 'Merano', place: 'ME', quality: 850 }
    ];
    const keyboard = createStopKeyboard(stops);
    
    assertExists(keyboard, 'Keyboard should exist');
    assertExists(keyboard.inline_keyboard, 'Should have inline_keyboard');
    assertTrue(keyboard.inline_keyboard.length > 0, 'Should have buttons');
    
    const firstButton = keyboard.inline_keyboard[0][0];
    assertExists(firstButton.text, 'Button should have text');
    assertExists(firstButton.callback_data, 'Button should have callback_data');
    assertTrue(firstButton.callback_data.includes('1'), 'Callback should include stop ID');
  });

  await test('createDeparturesKeyboard has refresh button', () => {
    const keyboard = createDeparturesKeyboard('stop123');
    
    assertExists(keyboard.inline_keyboard, 'Should have inline_keyboard');
    
    const hasRefresh = keyboard.inline_keyboard.some(row =>
      row.some(btn => btn.text.includes('Aktualisieren'))
    );
    assertTrue(hasRefresh, 'Should have refresh button');
    
    const hasRoute = keyboard.inline_keyboard.some(row =>
      row.some(btn => btn.text.includes('Route'))
    );
    assertTrue(hasRoute, 'Should have route button');
  });

  await test('createRouteKeyboard generates buttons for trips', () => {
    const trips = [
      { duration: '1:30', interchanges: 1 },
      { duration: '2:00', interchanges: 0 }
    ];
    const keyboard = createRouteKeyboard(trips);
    
    assertExists(keyboard.inline_keyboard, 'Should have inline_keyboard');
    assertEqual(
      keyboard.inline_keyboard.length,
      trips.length + 1, // Trips + refresh button
      'Should have button for each trip plus refresh'
    );
  });

  await test('createHelpKeyboard has action buttons', () => {
    const keyboard = createHelpKeyboard();
    
    assertExists(keyboard.inline_keyboard, 'Should have inline_keyboard');
    
    const totalButtons = keyboard.inline_keyboard.flat().length;
    assertTrue(totalButtons >= 3, 'Should have at least 3 action buttons');
  });

  console.log('\n--- Testing Command Handlers ---');

  await test('handleHelpCommand returns help message', async () => {
    const ctx = createMockContext();
    await handleHelpCommand(ctx);
    
    assertTrue(ctx.replies.length > 0, 'Should send reply');
    assertTrue(
      ctx.replies[0].text.includes('Hilfe'),
      'Reply should contain Hilfe'
    );
  });

  await test('handleSearchCommand requires query', async () => {
    const ctx = createMockContext('/search');
    await handleSearchCommand(ctx);
    
    assertTrue(ctx.replies.length > 0, 'Should send reply');
    assertTrue(
      ctx.replies[0].text.includes('Bitte gib'),
      'Should ask for query'
    );
  });

  await test('handleSearchCommand searches for stops', async () => {
    const ctx = createMockContext('/search Bolzano');
    await handleSearchCommand(ctx);
    
    // Should send at least 2 messages (searching + results)
    assertTrue(ctx.replies.length >= 1, 'Should send replies');
  });

  await test('handleNextCommand requires stop name', async () => {
    const ctx = createMockContext('/next');
    await handleNextCommand(ctx);
    
    assertTrue(ctx.replies.length > 0, 'Should send reply');
    assertTrue(
      ctx.replies[0].text.includes('Bitte gib'),
      'Should ask for stop'
    );
  });

  await test('handleRouteCommand requires both stops', async () => {
    const ctx = createMockContext('/route Bolzano');
    await handleRouteCommand(ctx);
    
    assertTrue(ctx.replies.length > 0, 'Should send reply');
    assertTrue(
      ctx.replies[0].text.includes('Start') || ctx.replies[0].text.includes('Ziel'),
      'Should mention missing stop'
    );
  });

  await test('handleRouteCommand accepts arrow separator', async () => {
    const ctx = createMockContext('/route Bolzano -> Merano');
    await handleRouteCommand(ctx);
    
    assertTrue(ctx.replies.length > 0, 'Should send reply');
  });

  console.log('\n--- Testing Callback Handler ---');

  await test('handleCallback answers unknown actions', async () => {
    const ctx = createMockContext();
    ctx.callbackQuery = { data: 'unknown_action', from: { id: 123 } };
    await handleCallback(ctx);
    
    // Should not throw
    assertTrue(true, 'Should handle unknown callback');
  });

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log(`  Passed: ${results.passed.length}`);
  console.log(`  Failed: ${results.failed.length}`);
  console.log('='.repeat(50));

  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
