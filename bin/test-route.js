#!/usr/bin/env node

/**
 * Test script for the updated route command flow
 * Tests stop resolution + trip planning
 */

const { findStops, resolveStop } = require('../src/api/stopfinder');
const { planTrip } = require('../src/api/trip');

async function resolveStopId(query) {
  const stops = await findStops(query);
  if (stops.length === 0) return null;
  
  // Sort by quality (highest first) and return the best match
  const sorted = stops.sort((a, b) => b.quality - a.quality);
  return sorted[0];
}

async function testRoute(fromQuery, toQuery) {
  console.log(`\n🗺️  Test: "${fromQuery}" → "${toQuery}"\n`);
  console.log('='.repeat(50));
  
  // Step 1: Resolve stops
  console.log('\n1️⃣  Stop-Auflösung...\n');
  
  const fromStop = await resolveStopId(fromQuery);
  const toStop = await resolveStopId(toQuery);
  
  if (!fromStop) {
    console.log(`❌ Startort "${fromQuery}" nicht gefunden`);
    return;
  }
  
  if (!toStop) {
    console.log(`❌ Zielort "${toQuery}" nicht gefunden`);
    return;
  }
  
  console.log(`✅ Start: ${fromStop.name} (ID: ${fromStop.id}, Qualität: ${fromStop.quality})`);
  console.log(`✅ Ziel: ${toStop.name} (ID: ${toStop.id}, Qualität: ${toStop.quality})`);
  
  // Step 2: Plan trip
  console.log('\n2️⃣  Routenplanung...\n');
  
  const trips = await planTrip(fromStop.id, toStop.id, { limit: 3 });
  
  if (!trips || trips.length === 0) {
    console.log('❌ Keine Verbindung gefunden');
    return;
  }
  
  console.log(`✅ ${trips.length} Verbindung(en) gefunden:\n`);
  
  trips.forEach((trip, index) => {
    const hours = Math.floor(trip.duration / 60);
    const minutes = trip.duration % 60;
    const duration = `${hours}h ${minutes}min`;
    
    console.log(`\n${index + 1}. Verbindung (${duration}, ${trip.interchanges}x Umstieg)`);
    console.log(`   Von: ${trip.departure?.time} ${trip.departure?.stop}`);
    console.log(`   Nach: ${trip.arrival?.time} ${trip.arrival?.stop}`);
    console.log('');
    
    trip.legs.forEach((leg, legIndex) => {
      const mode = leg.mode || 'Fußweg';
      const line = leg.line ? ` (${leg.line})` : '';
      const depTime = leg.origin.time || '--:--';
      const arrTime = leg.destination.time || '--:--';
      
      console.log(`   ${legIndex + 1}. ${mode}${line}`);
      console.log(`      ${depTime} ${leg.origin.stop} → ${arrTime} ${leg.destination.stop}`);
    });
    
    console.log('   ---');
  });
}

// Run test
const from = process.argv[2] || 'Neumarkt';
const to = process.argv[3] || 'Leifers Schulen';

testRoute(from, to).catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
