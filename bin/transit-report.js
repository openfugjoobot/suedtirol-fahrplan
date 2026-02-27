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
  
  lines.push(icon + ' ' + (w.title || 'Hinweis'));
  
  if (w.subtitle) {
    lines.push('   ' + w.subtitle);
  }
  
  if (w.content) {
    const contentLines = w.content.split('\n').filter(l => l.trim());
    const preview = contentLines.slice(0, 2).join(' ');
    if (preview.length > 80) {
      lines.push('   ' + preview.substring(0, 80) + '...');
    } else {
      lines.push('   ' + preview);
    }
  }
  
  if (w.concernedLines?.length > 0) {
    const lineNums = w.concernedLines.map(l => l.number).join(', ');
    lines.push('   📍 Linien: ' + lineNums);
  }
  
  return lines.join('\n');
}

async function showWarningsForStops(stopIds, label) {
  try {
    const warnings = await getWarningsForStops(stopIds);
    const activeWarnings = warnings.filter(w => 
      w.type === 'bannerInfo' || w.type === 'lineInfo' || w.type === 'stopBlocking'
    );
    
    if (activeWarnings.length > 0) {
      console.log('⚠️  Hinweise für ' + label + ':\n');
      activeWarnings.slice(0, 2).forEach(w => {
        console.log(formatWarning(w));
        console.log('');
      });
    }
  } catch (e) {
    // Silent fail for warnings
  }
}

async function show() {
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  console.log('🚌🚆 ABFAHRTEN Neumarkt • ' + now + ' Uhr\n');
  
  // Get warnings for Neumarkt stops
  await showWarningsForStops(['66000696', '66000651', '66000650'], 'Neumarkt');
  
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
