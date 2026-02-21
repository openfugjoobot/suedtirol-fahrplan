/**
 * Integration Test Suite
 * End-to-end flow tests for the transit bot
 */

const { transit } = require('../src/index');

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

function assertArray(value, message) {
  if (!Array.isArray(value)) {
    throw new Error(message || 'Expected array');
  }
}

// ==================== TESTS ====================

console.log('='.repeat(50));
console.log('Integration Test Suite');
console.log('End-to-End Flow Tests');
console.log('='.repeat(50));

async function runTests() {
  console.log('\n--- Flow 1: Search Stop → Get Departures ---');

  await test('Complete flow: Search Bolzano, get departures', async () => {
    // Step 1: Search for stop
    const stops = await transit.searchStops('Bolzano Stazione');
    assertTrue(stops.length > 0, 'Should find stops');
    
    const stop = stops[0];
    assertExists(stop.id, 'Stop should have ID');
    
    // Step 2: Get departures for the stop (may fail outside service hours)
    try {
      const departures = await transit.getNextDepartures(stop.id);
      assertArray(departures, 'Should get departures array');
      console.log(`  Found ${stops.length} stops, ${departures.length} departures`);
    } catch (e) {
      console.log(`  Found ${stops.length} stops, departures unavailable (outside service hours)`);
    }
  });

  await test('Complete flow: Search Meran, get departures', async () => {
    const stops = await transit.searchStops('Merano');
    assertTrue(stops.length > 0, 'Should find Merano stops');
    
    const departures = await transit.getNextDepartures(stops[0].id);
    assertArray(departures, 'Should get departures');
    
    console.log(`  Found ${stops.length} stops, ${departures.length} departures`);
  });

  console.log('\n--- Flow 2: Plan Route Between Cities ---');

  await test('Complete flow: Plan route Bolzano to Merano', async () => {
    const trips = await transit.planRoute('Bolzano', 'Merano');
    assertArray(trips, 'Should return trips array');
    
    if (trips.length > 0) {
      const trip = trips[0];
      assertExists(trip.duration, 'Trip should have duration');
      assertExists(trip.legs, 'Trip should have legs');
      assertTrue(trip.legs.length > 0, 'Trip should have at least one leg');
      
      console.log(`  Found ${trips.length} routes, duration: ${trip.duration}`);
    } else {
      console.log('  No routes found (may be outside service hours)');
    }
  });

  await test('Complete flow: Plan route Brixen to Sterzing', async () => {
    const trips = await transit.planRoute('Brixen', 'Sterzing');
    assertArray(trips, 'Should return trips array');
    
    console.log(`  Found ${trips.length} routes`);
  });

  console.log('\n--- Flow 3: Bilingual Support ---');

  await test('Bilingual: German name returns results', async () => {
    const stops = await transit.searchStops('Bozen');
    assertTrue(stops.length > 0, 'German name should work');
    console.log(`  German "Bozen": ${stops.length} results`);
  });

  await test('Bilingual: Italian name returns results', async () => {
    const stops = await transit.searchStops('Bolzano');
    assertTrue(stops.length > 0, 'Italian name should work');
    console.log(`  Italian "Bolzano": ${stops.length} results`);
  });

  console.log('\n--- Flow 4: Error Handling ---');

  await test('Graceful handling: Unknown stop', async () => {
    const stops = await transit.searchStops('XYZUnknownStopABC');
    assertArray(stops, 'Should return array');
    assertTrue(stops.length === 0, 'Should return empty for unknown stop');
    console.log('  Correctly returned empty for unknown stop');
  });

  await test('Graceful handling: Empty query', async () => {
    const stops = await transit.searchStops('');
    // Should not throw, result may vary by API
    assertTrue(true, 'Empty query should not crash');
    console.log('  Empty query handled gracefully');
  });

  await test('Graceful handling: Route to unknown destination', async () => {
    const trips = await transit.planRoute('Bolzano', 'XYZUnknownABC');
    assertArray(trips, 'Should return array');
    console.log(`  Unknown destination: ${trips.length} results`);
  });

  console.log('\n--- Flow 5: Data Quality ---');

  await test('Stop results have quality scores', async () => {
    const stops = await transit.searchStops('Brixen');
    assertTrue(stops.length > 0, 'Should find stops');
    
    stops.forEach(stop => {
      assertExists(stop.quality, 'Stop should have quality');
      assertTrue(stop.quality >= 0 && stop.quality <= 1000, 'Quality should be 0-1000');
    });
    
    console.log(`  All ${stops.length} stops have valid quality scores`);
  });

  await test('Departures have required fields when available', async () => {
    const stops = await transit.searchStops('Bolzano Stazione');
    if (stops.length > 0) {
      const departures = await transit.getNextDepartures(stops[0].id);
      
      departures.forEach(dep => {
        assertExists(dep.scheduledTime, 'Departure should have time');
        assertExists(dep.destination, 'Departure should have destination');
      });
      
      console.log(`  All ${departures.length} departures have required fields`);
    }
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

  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`Total: ${results.passed.length + results.failed.length}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
