# HEARTBEAT.md - Periodic Checks

## Daily Checklist (2-3x pro Tag)

### 1. Active Agents
- [ ] Check `subagents list` – any running?
- [ ] Agent stuck >30min? → Check status or restart
- [ ] Agent finished? → Verify output (git status, ls -la src/)

### 2. Git Status
- [ ] Uncommitted changes in `~/.openclaw/workspace/`?
- [ ] Branches not pushed? → `git push`
- [ ] PRs open? → Review or merge

### 3. GitHub Issues
- [ ] New comments on issues?
- [ ] Blocked issues (>2h no activity)?
- [ ] Ready to close?

### 4. System Health
- [ ] Disk space: `df -h /` (<80%?)
- [ ] Memory: `free -h` (enough free?)
- [ ] `.openclaw/workspace-*` size reasonable?

### 5. Memory
- [ ] Update `memory/YYYY-MM-DD.md` if needed
- [ ] Review yesterday's notes → worth keeping?

## Weekly (Sunday)
- [ ] Run: `~/.openclaw/scripts/cleanup.sh`
- [ ] Check: `du -sh ~/.openclaw/* | sort -h`
- [ ] Clean: `npm cache clean --force`, `pip cache purge`
- [ ] Update MEMORY.md with weekly insights

---
*If nothing to check, reply: HEARTBEAT_OK*
