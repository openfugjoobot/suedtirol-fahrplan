#!/usr/bin/env node

const { findStops } = require('../src/api/stopfinder');

async function searchStops(query) {
  try {
    const stops = await findStops(query);
    
    if (stops.length === 0) {
      console.log('Keine Haltestellen gefunden für:', query);
      return;
    }

    console.log(`Haltestellen für "${query}":\n`);
    
    stops.forEach((stop, index) => {
      console.log(`${index + 1}. ${stop.name}`);
      console.log(`   ID: ${stop.id}`);
      console.log(`   Ort: ${stop.place}`);
      console.log(`   Qualität: ${stop.quality}`);
      console.log(`   Typ: ${stop.type}`);
      console.log('');
    });

    return stops;
  } catch (error) {
    console.error('Fehler bei der API-Anfrage:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Daten:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

const query = process.argv.slice(2).join(' ');
if (!query) {
  console.log('Verwendung: node search-stops.js <Haltestellenname>');
  process.exit(1);
}

searchStops(query);
