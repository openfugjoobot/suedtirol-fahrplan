const client = require('./client');

/**
 * Helper: Convert date to EFA format (YYYYMMDD)
 */
function formatDate(date) {
  if (!date) return null;
  if (/^\d{8}$/.test(date)) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.replace(/-/g, '');
  if (date instanceof Date) {
    return date.getFullYear().toString() + 
      String(date.getMonth() + 1).padStart(2, '0') + 
      String(date.getDate()).padStart(2, '0');
  }
  return null;
}

/**
 * Helper: Convert time to EFA format (HHmm)
 */
function formatTime(time) {
  if (!time) return null;
  if (/^\d{4}$/.test(time) && !time.includes(':')) return time;
  if (/^\d{1,2}:\d{2}$/.test(time)) return time.replace(':', '');
  return null;
}

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
 * Parse info object (stopInfo, lineInfo, tripInfo)
 */
function parseInfo(info) {
  if (!info) return null;
  
  // Handle both single object and array
  const infoItem = Array.isArray(info) ? info[0] : info;
  
  return {
    url: infoItem.infoLinkURL || '',
    linkText: infoItem.infoLinkText || '',
    subject: infoItem.infoText?.subject || '',
    subtitle: infoItem.infoText?.subtitle || '',
    content: stripHtml(infoItem.infoText?.content || ''),
    additionalText: stripHtml(infoItem.infoText?.additionalText || ''),
    htmlText: infoItem.infoText?.htmlText || ''
  };
}

function buildModeFilter(filters = {}) {
  const { inclMOT_ZUG = true, inclMOT_BUS = true, inclMOT_8 = true } = filters;
  if (inclMOT_ZUG && inclMOT_BUS && inclMOT_8) return {};
  
  const params = { includedMeans: 'checkbox' };
  if (inclMOT_ZUG) params.inclMOT_ZUG = 'true';
  if (inclMOT_BUS) params.inclMOT_BUS = 'true';
  if (inclMOT_8) params.inclMOT_8 = 'true';
  return params;
}

async function getDepartures(stop, options = {}) {
  const {
    limit = 5, language = 'de', time, date,
    inclMOT_ZUG = true, inclMOT_BUS = true, inclMOT_8 = true
  } = options;

  const params = {
    name_dm: stop, type_dm: 'any', limit, mode: 'direct', language,
    outputFormat: 'JSON',
    ...buildModeFilter({ inclMOT_ZUG, inclMOT_BUS, inclMOT_8 })
  };

  const ft = formatTime(time);
  const fd = formatDate(date);
  if (ft) params.itdTime = ft;
  if (fd) params.itdDate = fd;

  const response = await client.get('XML_DM_REQUEST', { params });
  return parseDeparturesResponse(response.data);
}

async function getDeparturesById(stopId, options = {}) {
  const {
    limit = 5, language = 'de', time, date,
    inclMOT_ZUG = true, inclMOT_BUS = true, inclMOT_8 = true
  } = options;

  const params = {
    name_dm: stopId, type_dm: 'any', limit, mode: 'direct', language,
    outputFormat: 'JSON',
    ...buildModeFilter({ inclMOT_ZUG, inclMOT_BUS, inclMOT_8 })
  };

  const ft = formatTime(time);
  const fd = formatDate(date);
  if (ft) params.itdTime = ft;
  if (fd) params.itdDate = fd;

  const response = await client.get('XML_DM_REQUEST', { params });
  return parseDeparturesResponse(response.data);
}

function parseDeparturesResponse(data) {
  const departureList = data?.departureList;
  if (!departureList) return [];

  const departuresArray = Array.isArray(departureList) ? departureList : [departureList];

  return departuresArray.map(dep => {
    const dt = dep.dateTime;
    const rt = dep.realDateTime;
    const line = dep.servingLine;
    
    const scheduledTime = dt ? dt.hour + ':' + String(dt.minute).padStart(2, '0') : null;
    const realTime = rt ? rt.hour + ':' + String(rt.minute).padStart(2, '0') : null;
    const delayFromApi = line?.delay ? parseInt(line.delay, 10) : null;
    
    // Parse hints/warnings from response
    const hints = [];
    
    if (dep.stopInfos?.stopInfo) {
      const stopInfo = parseInfo(dep.stopInfos.stopInfo);
      if (stopInfo) hints.push({ type: 'stop', ...stopInfo });
    }
    
    if (dep.lineInfos?.lineInfo) {
      const lineInfo = parseInfo(dep.lineInfos.lineInfo);
      if (lineInfo) hints.push({ type: 'line', ...lineInfo });
    }
    
    if (dep.tripInfos?.tripInfo) {
      const tripInfo = parseInfo(dep.tripInfos.tripInfo);
      if (tripInfo) hints.push({ type: 'trip', ...tripInfo });
    }
    
    return {
      line: line?.number || line?.symbol,
      mode: getTransportModeName(line?.motType),
      destination: line?.direction,
      scheduledTime,
      delayMinutes: delayFromApi,
      isRealTime: line?.realtime === '1' || !!dep.realDateTime,
      countdown: dep.countdown ? parseInt(dep.countdown, 10) : null,
      hints: hints.length > 0 ? hints : null
    };
  });
}

function getTransportModeName(modeId) {
  const modes = {
    0: 'Train', 1: 'S-Bahn', 2: 'U-Bahn', 3: 'Bus', 4: 'Tram',
    5: 'Regional Bus', 6: 'City Bus', 7: 'Cable Car', 8: 'Ropeway',
    9: 'Ferry', 10: 'Train Shuttle', 11: 'Regional Train',
    14: 'Long-distance Bus', 15: 'Other', 16: 'On-demand', 17: 'Regional Bus'
  };
  return modes[modeId] || 'Unknown';
}

module.exports = { getDepartures, getDeparturesById, formatDate, formatTime };
