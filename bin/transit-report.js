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

function formatDeparture(d) {
  const icon = icons[d.mode] || '🚍';
  const delay = d.delayMinutes;
  // Immer Verspätung anzeigen: (+0) bei pünktlich, (+5) bei Verspätung, (-2) bei früher
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
  
  // Bis 15 Minuten: nur Countdown, sonst nur Uhrzeit
  const countdown = d.countdown !== null ? d.countdown : null;
  let timeDisplay;
  
  if (countdown !== null && countdown <= 15) {
    timeDisplay = 'in ' + countdown + 'min';
  } else {
    timeDisplay = d.scheduledTime;
  }
  
  return timeDisplay + ' │ ' + icon + ' ' + d.line + ' → ' + d.destination + delayStr;
}

async function show() {
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log('🚌🚆 ABFAHRTEN Neumarkt • ' + now + ' Uhr\n');
  
  console.log('🚆 Neumarkt Bahnhof (nur Züge)');
  const bahnhof = await getDeparturesById('66000696', { 
    limit: 5, 
    inclMOT_ZUG: true,
    inclMOT_BUS: false,
    inclMOT_8: false
  });
  bahnhof.forEach(d => console.log(formatDeparture(d)));
  
  console.log('\n🚌 Neumarkt Busbahnhof');
  const busbhf = await getDeparturesById('66000651', { limit: 5 });
  busbhf.forEach(d => console.log(formatDeparture(d)));
  
  console.log('\n🚍 Neumarkt, Trudner Bach');
  const trudner = await getDeparturesById('66000650', { limit: 5 });
  trudner.forEach(d => console.log(formatDeparture(d)));
  
  console.log('\n💡 (+0) = Pünktlich  •  (+5) = 5min Verspätung  •  (-2) = 2min früher');
}

show().catch(err => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
