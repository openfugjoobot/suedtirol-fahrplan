#!/usr/bin/env node

const { planTrip } = require('../src/api/trip');

async function planRoute(from, to) {
  try {
    console.log(`Verbindung: ${from} → ${to}\n`);
    
    const trips = await planTrip(from, to, { limit: 3 });
    
    if (trips.length === 0) {
      console.log('Keine Verbindungen gefunden.');
      return;
    }

    trips.forEach((trip, index) => {
      const hours = Math.floor(trip.duration / 60);
      const minutes = trip.duration % 60;
      const duration = `${hours}h ${minutes}min`;
      
      console.log(`\n${index + 1}. Verbindung (${duration})`);
      console.log(`   Umstiege: ${trip.interchanges}`);
      console.log('');
      
      trip.legs.forEach((leg, legIndex) => {
        const depTime = leg.origin.time || '--:--';
        const arrTime = leg.destination.time || '--:--';
        const mode = leg.mode || 'Fußweg';
        const line = leg.line ? ` (${leg.line})` : '';
        
        console.log(`   ${legIndex + 1}. ${mode}${line}`);
        console.log(`      ${depTime} ${leg.origin.stop}`);
        console.log(`      ${arrTime} ${leg.destination.stop}`);
        if (leg.origin.platform) {
          console.log(`      Plattform: ${leg.origin.platform}`);
        }
        if (leg.destination.platform) {
          console.log(`      Plattform: ${leg.destination.platform}`);
        }
        console.log('');
      });
      
      if (trip.hints) {
        console.log('   Hinweise:');
        trip.hints.forEach(hint => {
          console.log(`   - ${hint.subject}: ${hint.content}`);
        });
        console.log('');
      }
      
      console.log('---');
    });

    return trips;
  } catch (error) {
    console.error('Fehler bei der Verbindungsplanung:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 3 || !args.includes('->')) {
  console.log('Verwendung: node route.js <Von> -> <Nach>');
  console.log('Beispiel: node route.js "Neumarkt" -> "Leifers Schulen"');
  process.exit(1);
}

const arrowIndex = args.indexOf('->');
const from = args.slice(0, arrowIndex).join(' ');
const to = args.slice(arrowIndex + 1).join(' ');

planRoute(from, to);
