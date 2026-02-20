# Token Tracking System - Requirements (Simplified)

## Goal
Simple local token counter for AI agents.

## Features
1. **Log tokens**: CLI to record input/output tokens per agent session
2. **View stats**: CLI to show total tokens per agent (daily/all-time)
3. **Storage**: SQLite, local only

## CLI Commands
```bash
token-log <agent-name> <input-tokens> <output-tokens> [model]
token-stats [agent-name] [--today]
```

## Data
- session_id, agent_name, model, timestamp
- input_tokens, output_tokens

## Out of Scope
- API integration
- Cost estimation
- Dashboard
- Real-time tracking
