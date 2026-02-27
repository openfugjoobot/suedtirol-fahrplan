const client = require('./client');
const { stripHtml, parseInfoObject } = require('./utils');

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

function formatTime(time) {
  if (!time) return null;
  if (/^\d{4}$/.test(time) && !time.includes(':')) return time;
  if (/^\d{1,2}:\d{2}$/.test(time)) return time.replace(':', '');
  return null;
}

function parseDepartureInfo(stopInfo, lineInfo, tripInfo) {
  const hints = [];
  
  if (stopInfo) {
    const parsed = parseInfoObject(stopInfo);
    if (parsed) hints.push({ type: 'stop', ...parsed });
  }
  
  if (lineInfo) {
    const parsed = parseInfoObject(lineInfo);
    if (parsed) hints.push({ type: 'line', ...parsed });
  }
  
  if (tripInfo) {
    const parsed = parseInfoObject(tripInfo);
    if (parsed) hints.push({ type: 'trip', ...parsed });
  }
  
  return hints.length > 0 ? hints : null;
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
    
    // Parse hints from response
    const hints = parseDepartureInfo(
      dep.stopInfos?.stopInfo,
      dep.lineInfos?.lineInfo,
      dep.tripInfos?.tripInfo
    );
    
    // Use platformName (readable), not platform (internal ID)
    // Only return if actually present
    const platformName = dep.platformName;
    const platform = platformName && platformName.trim() ? platformName.trim() : null;
    
    return {
      line: line?.number || line?.symbol,
      mode: getTransportModeName(line?.motType),
      destination: line?.direction,
      scheduledTime,
      delayMinutes: delayFromApi,
      isRealTime: line?.realtime === '1' || !!dep.realDateTime,
      countdown: dep.countdown ? parseInt(dep.countdown, 10) : null,
      platform,
      hints
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
