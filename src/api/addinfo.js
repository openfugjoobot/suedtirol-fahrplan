const client = require('./client');

/**
 * Helper: Strip HTML tags and decode entities
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Helper: Check if warning is currently valid
 */
function isCurrentlyValid(validity) {
  if (!validity) return true;
  const now = new Date();
  const from = validity.from ? new Date(validity.from) : null;
  const to = validity.to ? new Date(validity.to) : null;
  
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
}

/**
 * Get all travel warnings/additional info from STA API
 */
async function getAddInfo(options = {}) {
  const { language = 'de' } = options;
  
  const params = {
    outputFormat: 'JSON',
    language
  };
  
  const response = await client.get('XML_ADDINFO_REQUEST', { params });
  return parseAddInfoResponse(response.data);
}

/**
 * Get warnings filtered for specific stops or lines
 */
async function getWarningsForStops(stopIds, options = {}) {
  const { language = 'de' } = options;
  const allWarnings = await getAddInfo({ language });
  
  // Normalize stopIds to array
  const ids = Array.isArray(stopIds) ? stopIds : [stopIds];
  const idSet = new Set(ids.map(String));
  
  return allWarnings.filter(w => {
    // Check if warning is currently valid
    if (!isCurrentlyValid(w.validity)) return false;
    
    // If no specific stops concerned, include it (general warning)
    if (!w.concernedStops || w.concernedStops.length === 0) {
      // But check if it's a general banner/info that should be shown
      return w.type === 'bannerInfo' || w.type === 'lineInfo';
    }
    
    // Check if any of the concerned stops matches our stop IDs
    return w.concernedStops.some(stop => idSet.has(String(stop.id)));
  });
}

function parseAddInfoResponse(data) {
  const addInfo = data?.additionalInformation;
  if (!addInfo) return [];
  
  const travelInfos = addInfo.travelInformations?.travelInformation;
  if (!travelInfos) return [];
  
  const infosArray = Array.isArray(travelInfos) ? travelInfos : [travelInfos];
  
  return infosArray
    .filter(info => info.publish === '1') // Only published info
    .map(info => {
      // Get German content (or first available)
      const infoLink = Array.isArray(info.infoLink) 
        ? info.infoLink.find(l => l.language === 'de') || info.infoLink[0]
        : info.infoLink;
      
      // Parse concerned stops
      let concernedStops = [];
      if (info.concernedStops?.stop) {
        const stops = Array.isArray(info.concernedStops.stop) 
          ? info.concernedStops.stop 
          : [info.concernedStops.stop];
        concernedStops = stops.map(s => ({
          id: s.id,
          name: s.name,
          place: s.place
        }));
      }
      
      // Parse concerned lines
      let concernedLines = [];
      if (info.concernedLines?.line) {
        const lines = Array.isArray(info.concernedLines.line)
          ? info.concernedLines.line
          : [info.concernedLines.line];
        concernedLines = lines.map(l => ({
          number: l.number,
          direction: l.direction,
          mode: l.motType
        }));
      }
      
      return {
        id: info.infoID,
        type: info.type, // bannerInfo, lineInfo, stopBlocking
        priority: info.priority,
        valid: info.valid === '1',
        publish: info.publish === '1',
        title: infoLink?.subject || '',
        subtitle: infoLink?.subtitle || '',
        content: stripHtml(infoLink?.content || ''),
        url: infoLink?.url || '',
        validity: {
          from: info.validityPeriod?.from,
          to: info.validityPeriod?.to
        },
        concernedStops,
        concernedLines,
        raw: info // Keep raw for debugging
      };
    })
    .filter(info => info.valid); // Only return valid entries
}

module.exports = { 
  getAddInfo, 
  getWarningsForStops,
  stripHtml 
};
