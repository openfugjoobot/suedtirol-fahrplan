const { getDeparturesById } = require('../src/api/departures');

const icons = {
  'Train': '🚆',
  'Regional Train': '🚆', 
  'S-Bahn': '🚉',
  'City Bus': '🚌',
  'Regional Bus': '🚌',
  'Bus': '🚌',
  'Cable Car': '🚡',
  'Ropeway': '🚠'
};

const HINT_ICONS = {
  stop: '📍',
  line: '⚠️',
  trip: '📝'
};

function formatDeparture(d) {
  const icon = icons[d.mode] || '🚍';
  const delay = d.delayMinutes;
  let delayStr;
  if (delay === null) {
    delayStr = '';
  } else if (delay === 0) {
    delayStr = ' (+0)';
  } else if (delay > 0) {
    delayStr = ' (+' + delay + ')';
  } else {
    delayStr = ' (' + delay + ')';
  }
  
  const countdown = d.countdown !== null ? d.countdown : null;
  let timeDisplay;
  
  if (countdown !== null && countdown <= 15) {
    timeDisplay = countdown + 'min';
  } else {
    timeDisplay = d.scheduledTime;
  }

  // Platform info (only if present)
  const platformStr = d.platform ? ' (Gl. ' + d.platform + ')' : '';
  
  let hintsStr = '';
  if (d.hints) {
    const hintEmojis = d.hints.map(h => HINT_ICONS[h.type] || '•').join('');
    hintsStr = ' ' + hintEmojis;
  }
  
  return timeDisplay + platformStr + ' │ ' + icon + ' ' + d.line + ' → ' + d.destination + delayStr + hintsStr;
}

function formatHintDetail(h) {
  const icon = HINT_ICONS[h.type] || '•';
  let lines = [icon + ' ' + h.subject];
  if (h.subtitle && h.subtitle !== h.subject) {
    lines.push('   ' + h.subtitle);
  }
  if (h.content) {
    const preview = h.content.substring(0, 100);
    lines.push('   ' + (h.content.length > 100 ? preview + '...' : preview));
  }
  return lines.join('\n');
}

async function showStation(name, stopId, showHints, opts = {}) {
  const deps = await getDeparturesById(stopId, opts);
  
  deps.forEach(d => {
    console.log(formatDeparture(d));
    
    if (d.hints) {
      d.hints.forEach(h => {
        const key = h.type + ':' + h.subject;
        if (!showHints.has(key)) {
          showHints.set(key, h);
        }
      });
    }
  });
  
  return deps.length;
}

async function show() {
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log('🚌🚆 ABFAHRTEN Neumarkt • ' + now + ' Uhr\n');
  
  const uniqueHints = new Map();
  
  console.log('🚆 Neumarkt Bahnhof (nur Züge)');
  await showStation('Bahnhof', '66000696', uniqueHints, { 
    limit: 5, 
    inclMOT_ZUG: true,
    inclMOT_BUS: false,
    inclMOT_8: false
  });
  
  console.log('\n🚌 Neumarkt Busbahnhof');
  await showStation('Busbahnhof', '66000651', uniqueHints, { limit: 5 });
  
  console.log('\n🚍 Neumarkt, Trudner Bach');
  await showStation('Trudner Bach', '66000650', uniqueHints, { limit: 5 });
  
  if (uniqueHints.size > 0) {
    console.log('\n🔔 HINWEISE:');
    uniqueHints.forEach(h => {
      console.log('');
      console.log(formatHintDetail(h));
    });
  }
  
  console.log('\n💡 (+0) = Pünktlich  •  (+5) = 5min Verspätung  •  (-2) = 2min früher');
  console.log('📍 = Haltestelle  •  ⚠️ = Linie  •  📝 = Fahrt');
}

show().catch(err => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
