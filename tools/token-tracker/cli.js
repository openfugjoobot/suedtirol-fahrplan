#!/usr/bin/env node

const { logTokens, getStats } = require('./db');

const command = process.argv[2];

function formatNumber(num) {
  return num.toLocaleString();
}

function doLog(agent, input, output, model) {
  const result = logTokens(agent, input, output, model);
  console.log(`✓ Logged: ${agent} | Input: ${formatNumber(input)} | Output: ${formatNumber(output)} | Model: ${model}`);
}

function doStats(agentName, todayOnly) {
  const stats = getStats(agentName, todayOnly);
  const agents = Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total);
  
  if (agents.length === 0) {
    console.log('No data found.');
    return;
  }
  
  const period = todayOnly ? 'Today' : 'All Time';
  console.log(`\n📊 Token Usage Stats (${period})`);
  console.log(`${'Agent'.padEnd(20)} ${'Sessions'.padStart(10)} ${'Input'.padStart(12)} ${'Output'.padStart(12)} ${'Total'.padStart(12)}`);
  
  let grandTotal = 0;
  for (const agent of agents) {
    const s = stats[agent];
    console.log(
      `${agent.padEnd(20)} ` +
      `${formatNumber(s.sessions).padStart(10)} ` +
      `${formatNumber(s.input).padStart(12)} ` +
      `${formatNumber(s.output).padStart(12)} ` +
      `${formatNumber(s.total).padStart(12)}`
    );
    grandTotal += s.total;
  }

  console.log(`${'TOTAL'.padEnd(20)} ${''.padStart(10)} ${''.padStart(12)} ${''.padStart(12)} ${formatNumber(grandTotal).padStart(12)}`);
  console.log();
}

function showHelp() {
  console.log(`
Usage:
  token-log <agent> <input> <output> [model]
  token-stats [agent] [--today]

Examples:
  token-log research-agent 1500 3200 gpt-4
  token-log architect-agent 800 1200 claude-3
  token-stats                    # Show all stats
  token-stats research-agent     # Show stats for specific agent
  token-stats --today            # Show today's stats only
`);
}

// Detect how we were called
const scriptName = process.argv[1];
const isLogCmd = scriptName.includes('token-log');
const isStatsCmd = scriptName.includes('token-stats');

if (isLogCmd) {
  // Called as token-log
  const agent = process.argv[2];
  const input = parseInt(process.argv[3]);
  const output = parseInt(process.argv[4]);
  const model = process.argv[5] || 'unknown';
  
  if (!agent || isNaN(input) || isNaN(output)) {
    console.error('Error: Missing arguments');
    showHelp();
    process.exit(1);
  }
  
  doLog(agent, input, output, model);
  
} else if (isStatsCmd) {
  // Called as token-stats
  const args = process.argv.slice(2);
  const todayFlag = args.includes('--today');
  const agentName = args.find(a => !a.startsWith('--')) || null;
  
  doStats(agentName, todayFlag);
  
} else if (command === 'log') {
  // Called as cli.js log ...
  const agent = process.argv[3];
  const input = parseInt(process.argv[4]);
  const output = parseInt(process.argv[5]);
  const model = process.argv[6] || 'unknown';
  
  if (!agent || isNaN(input) || isNaN(output)) {
    console.error('Error: Missing arguments');
    showHelp();
    process.exit(1);
  }
  
  doLog(agent, input, output, model);
  
} else if (command === 'stats') {
  // Called as cli.js stats ...
  const args = process.argv.slice(3);
  const todayFlag = args.includes('--today');
  const agentName = args.find(a => !a.startsWith('--')) || null;
  
  doStats(agentName, todayFlag);
  
} else {
  showHelp();
}
