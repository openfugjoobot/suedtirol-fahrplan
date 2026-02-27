const { getDeparturesById } = require('../src/api/departures');
const { getWarningsForStops } = require('../src/api/addinfo');

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

const WARNING_ICONS = {
  bannerInfo: '📢',
  lineInfo: '⚠️',
  stopBlocking: '🚫'
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
  
  const countdown = d.countdown !== null ? d.countdown : null;
  let timeDisplay;
  
  if (countdown !== null && countdown <= 15) {
    timeDisplay = 'in ' + countdown + 'min';
  } else {
    timeDisplay = d.scheduledTime;
  }
  
  return timeDisplay + ' │ ' + icon + ' ' + d.line + ' → ' + d.destination + delayStr;
}

function formatWarning(w) {
  const icon = WARNING_ICONS[w.type] || '⚠️';
  const lines = [];
  
  // Title line
  lines.push(icon + ' ' + (w.title || 'Hinweis'));
  
  // Subtitle if present
  if (w.subtitle) {
    lines.push('   ' + w.subtitle);
  }
  
  // Content (first 2 lines max to keep it compact)
  if (w.content) {
    const contentLines = w.content.split('\n').filter(l => l.trim());
    const preview = contentLines.slice(0, 2).join(' ');
    if (preview.length > 80) {
      lines.push('   ' + preview.substring(0, 80) + '...');
    } else {
      lines.push('   ' + preview);
    }
  }
  
  // Affected lines
  if (w.concernedLines?.length > 0) {
    const lineNums = w.concernedLines.map(l => l.number).join(', ');
    lines.push('   📍 Linien: ' + lineNums);
  }
  
  return lines.join('\n');
}

async function show() {
  const STOP_ID = '66000468'; // Bozen Bahnhof
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  
  // Fetch warnings and departures in parallel
  const [warnings, deps] = await Promise.all([
    getWarningsForStops(STOP_ID).catch(() => []),
    getDeparturesById(STOP_ID, { 
      limit: 8, 
      inclMOT_ZUG: true,
      inclMOT_BUS: false,
      inclMOT_8: false
    })
  ]);
  
  console.log('🚆 ABFAHRTEN Bozen Bahnhof • ' + now + ' Uhr\n');
  
  // Show warnings first (if any)
  const activeWarnings = warnings.filter(w => 
    w.type === 'bannerInfo' || w.type === 'lineInfo' || w.type === 'stopBlocking'
  );
  
  if (activeWarnings.length > 0) {
    console.log('🔔 AKTIVE HINWEISE:\n');
    activeWarnings.slice(0, 3).forEach(w => {
      console.log(formatWarning(w));
      console.log('');
    });
  }
  
  // Show departures
  deps.forEach(d => console.log(formatDeparture(d)));
  
  console.log('\n💡 (+0) = Pünktlich  •  (+5) = 5min Verspätung  •  (-2) = 2min früher');
}

show().catch(err => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
