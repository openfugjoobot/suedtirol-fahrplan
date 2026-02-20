# Token Tracker

Simple local token counter for AI agents. JSON-based storage, zero dependencies.

## Install

```bash
cd ~/.openclaw/workspace/tools/token-tracker
npm link
```

## Usage

### Log tokens from an agent run
```bash
token-log research-agent 1500 3200 gpt-4
token-log architect-agent 800 1200 claude-3-opus
```

### View stats
```bash
token-stats              # All agents, all time
token-stats --today      # Today's usage only
token-stats research-agent  # Specific agent
```

## Data Storage

JSON file at `~/.openclaw/token-tracker.json`

## Schema

- **sessions**: id, session_uuid, agent_name, model, started_at
- **usage**: id, session_id, input_tokens, output_tokens, logged_at
