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
  
  // Build hints string
  let hintsStr = '';
  if (d.hints) {
    const hintEmojis = d.hints.map(h => HINT_ICONS[h.type] || '•').join('');
    hintsStr = ' ' + hintEmojis;
  }
  
  return timeDisplay + ' │ ' + icon + ' ' + d.line + ' → ' + d.destination + delayStr + hintsStr;
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

async function show() {
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log('🚆 ABFAHRTEN Bozen Bahnhof • ' + now + ' Uhr\n');
  
  const deps = await getDeparturesById('66000468', { 
    limit: 8, 
    inclMOT_ZUG: true,
    inclMOT_BUS: false,
    inclMOT_8: false
  });
  
  // Collect unique hints to display below
  const uniqueHints = new Map();
  
  deps.forEach(d => {
    console.log(formatDeparture(d));
    
    if (d.hints) {
      d.hints.forEach(h => {
        const key = h.type + ':' + h.subject;
        if (!uniqueHints.has(key)) {
          uniqueHints.set(key, h);
        }
      });
    }
  });
  
  // Show hint details if any
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
