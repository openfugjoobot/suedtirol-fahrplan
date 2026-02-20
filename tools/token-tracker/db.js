const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DATA_DIR = path.join(os.homedir(), '.openclaw');
const DB_FILE = path.join(DATA_DIR, 'token-tracker.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or init data
let data = { sessions: [], usage: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Warning: Could not parse DB, starting fresh');
  }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateUUID() {
  return crypto.randomUUID();
}

function logTokens(agentName, inputTokens, outputTokens, model = 'unknown') {
  const sessionUuid = generateUUID();
  const session = {
    id: data.sessions.length + 1,
    session_uuid: sessionUuid,
    agent_name: agentName,
    model: model,
    started_at: new Date().toISOString()
  };
  
  const usage = {
    id: data.usage.length + 1,
    session_id: session.id,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    logged_at: new Date().toISOString()
  };
  
  data.sessions.push(session);
  data.usage.push(usage);
  save();
  
  return { session, usage };
}

function getStats(agentName = null, todayOnly = false) {
  let sessions = data.sessions;
  let usage = data.usage;
  
  if (agentName) {
    sessions = sessions.filter(s => s.agent_name === agentName);
  }
  
  if (todayOnly) {
    const today = new Date().toISOString().split('T')[0];
    usage = usage.filter(u => u.logged_at.startsWith(today));
    const sessionIds = new Set(usage.map(u => u.session_id));
    sessions = sessions.filter(s => sessionIds.has(s.id));
  }
  
  const sessionIds = new Set(sessions.map(s => s.id));
  const filteredUsage = usage.filter(u => sessionIds.has(u.session_id));
  
  // Group by agent
  const byAgent = {};
  for (const s of sessions) {
    if (!byAgent[s.agent_name]) {
      byAgent[s.agent_name] = { sessions: 0, input: 0, output: 0, total: 0 };
    }
    byAgent[s.agent_name].sessions++;
  }
  
  for (const u of filteredUsage) {
    const session = sessions.find(s => s.id === u.session_id);
    if (session) {
      byAgent[session.agent_name].input += u.input_tokens;
      byAgent[session.agent_name].output += u.output_tokens;
      byAgent[session.agent_name].total += u.input_tokens + u.output_tokens;
    }
  }
  
  return byAgent;
}

module.exports = { logTokens, getStats };
