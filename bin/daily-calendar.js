const { execSync } = require('child_process');

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function formatDateGerman(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('de-DE', options);
}

async function showCalendar() {
  const tomorrow = getTomorrowDate();
  const dateDisplay = formatDateGerman(tomorrow);
  
  console.log('📅 TERMINE FÜR ' + dateDisplay.toUpperCase() + '\n');
  
  try {
    // gog calendar aufrufen
    const result = execSync('gog calendar events primary --from ' + tomorrow + ' --to ' + tomorrow + ' 2>/dev/null', {
      encoding: 'utf8',
      timeout: 15000
    });
    
    if (!result || result.trim() === '') {
      console.log('✨ Keine Termine morgen.');
      return;
    }
    
    const lines = result.trim().split('\n');
    let hasEvents = false;
    
    lines.forEach(line => {
      // Parsen: "12:00 - 13:00 | Meeting Name"
      const match = line.match(/(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+\|\s+(.+)/);
      if (match) {
        hasEvents = true;
        const startTime = match[1];
        const endTime = match[2];
        const title = match[3].trim();
        console.log('🕐 ' + startTime + ' – ' + endTime + ' │ ' + title);
      }
    });
    
    if (!hasEvents) {
      console.log('✨ Keine Termine morgen.');
    }
    
  } catch (err) {
    console.log('⚠️ Kalender konnte nicht geladen werden.');
  }
}

showCalendar();
