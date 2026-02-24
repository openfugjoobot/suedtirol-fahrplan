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
  const delayStr = delay === null || delay === 0 ? '' : (delay > 0 ? ' ⚠️ +' + delay + 'min' : ' 🟢 ' + delay + 'min');
  const rt = d.isRealTime ? '⏱️ ' : '🕐 ';
  
  const countdown = d.countdown !== null ? d.countdown : null;
  let timeDisplay;
  
  if (countdown !== null && countdown <= 15) {
    timeDisplay = 'in ' + countdown + 'min';
  } else {
    timeDisplay = d.scheduledTime;
  }
  
  return rt + timeDisplay + ' │ ' + icon + ' ' + d.line + ' → ' + d.destination + delayStr;
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
  deps.forEach(d => console.log(formatDeparture(d)));
  
  console.log('\n💡 ⏱️ = Echtzeit  •  🕐 = Planmäßig    ⚠️ = Verspätung');
}

show().catch(err => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
