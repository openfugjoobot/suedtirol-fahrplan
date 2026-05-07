#!/usr/bin/env node
/**
 * Südtirol Fahrplan — CLI transit tool for OpenClaw agent use.
 * 
 * Usage:
 *   node transit.js search <stopName>
 *   node transit.js departures <stopName> [--limit 8]
 *   node transit.js route <from> <to> [--limit 3]
 * 
 * All output is JSON to stdout. Errors go to stderr.
 */

const path = require('path');
const { findStops } = require(path.join(__dirname, '..', 'src', 'api', 'stopfinder'));
const { getDeparturesById } = require(path.join(__dirname, '..', 'src', 'api', 'departures'));
const { planTrip } = require(path.join(__dirname, '..', 'src', 'api', 'trip'));

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.error('Usage: node transit.js <search|departures|route> [args...]');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'search': {
        const query = args.slice(1).join(' ');
        if (!query) {
          console.error('Usage: node transit.js search <stopName>');
          process.exit(1);
        }
        const stops = await findStops(query);
        console.log(JSON.stringify(stops, null, 2));
        break;
      }

      case 'departures': {
        const query = args[1];
        if (!query) {
          console.error('Usage: node transit.js departures <stopName> [--limit 8]');
          process.exit(1);
        }
        
        // Parse --limit
        let limit = 8;
        const limitIdx = args.indexOf('--limit');
        if (limitIdx !== -1 && args[limitIdx + 1]) {
          limit = parseInt(args[limitIdx + 1], 10);
        }

        // Resolve stop name → ID (best quality match)
        const stops = await findStops(query);
        if (stops.length === 0) {
          console.error(`No stops found for "${query}"`);
          process.exit(1);
        }
        
        const sorted = stops.sort((a, b) => b.quality - a.quality);
        const best = sorted[0];
        
        const departures = await getDeparturesById(best.id, { limit });
        console.log(JSON.stringify({ stop: best.name, stopId: best.id, departures }, null, 2));
        break;
      }

      case 'route': {
        const from = args[1];
        const to = args[2];
        if (!from || !to) {
          console.error('Usage: node transit.js route <from> <to> [--limit 3]');
          process.exit(1);
        }

        // Parse --limit
        let limit = 3;
        const limitIdx = args.indexOf('--limit');
        if (limitIdx !== -1 && args[limitIdx + 1]) {
          limit = parseInt(args[limitIdx + 1], 10);
        }

        // Resolve both stops to IDs
        const fromStops = await findStops(from);
        const toStops = await findStops(to);
        
        if (fromStops.length === 0) {
          console.error(`No stops found for "${from}"`);
          process.exit(1);
        }
        if (toStops.length === 0) {
          console.error(`No stops found for "${to}"`);
          process.exit(1);
        }
        
        const fromBest = fromStops.sort((a, b) => b.quality - a.quality)[0];
        const toBest = toStops.sort((a, b) => b.quality - a.quality)[0];
        
        const trips = await planTrip(fromBest.id, toBest.id, { limit });
        console.log(JSON.stringify({ 
          from: fromBest.name, fromId: fromBest.id,
          to: toBest.name, toId: toBest.id,
          trips 
        }, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Commands: search, departures, route');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
