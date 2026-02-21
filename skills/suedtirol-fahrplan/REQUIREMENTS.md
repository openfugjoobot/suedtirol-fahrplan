# REQUIREMENTS.md - suedtirol-fahrplan

## Project: Südtirol Transit Bot

### Goal (One Sentence)
A Telegram bot that provides real-time transit information (departures, routes) for South Tyrol using the STA API.

---

## User Stories

| # | As... | I want to... | so that... |
|---|-------|--------------|------------|
| 1 | Commuter | search for stops by name | I can find my departure stop |
| 2 | Commuter | see next departures for a stop | I know when my bus/train leaves |
| 3 | Commuter | plan a route between stops | I can get from A to B |
| 4 | Tourist | use German or Italian stop names | I can navigate the bilingual region |
| 5 | User | control via Telegram commands | I can access transit info on my phone |
| 6 | User | see real-time delay information | I know if my connection is running late |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Skill Format** | JavaScript (OpenClaw Skill API) |
| **HTTP Client** | Axios with retry logic |
| **Transit Data** | STA EFA API (efa.sta.bz.it) |
| **Telegram Bot** | Telegraf framework |
| **Node Version** | >= 16.0.0 |

---

## Deliverables

### Features
- [x] Skill `suedtirol-fahrplan` installable via `clawhub`
- [x] **Telegram Commands:**
  - `/search <Haltestelle>` - Find stops by name
  - `/next <Haltestelle>` - Show next departures
  - `/route <Von> -> <Nach>` - Plan a route
  - `/help` - Show help message
- [x] **Stop Search:**
  - Bilingual (German/Italian) support
  - Quality scoring for results
  - Inline keyboard for multiple matches
- [x] **Departure Board:**
  - Real-time data with delay info
  - Line numbers and destinations
  - Platform information when available
- [x] **Route Planning:**
  - Multiple route alternatives
  - Duration and interchange info
  - Mode information (Bus/Train/Cable Car)

### Data
- [x] Stop data from STA API
- [x] Real-time departure information
- [x] Route suggestions

---

## Out of Scope (NOT for now)

- [ ] Ticket booking/purchasing
- [ ] Fare calculation
- [ ] Push notifications for delays
- [ ] Favorite stops persistence
- [ ] Offline mode
- [ ] Real-time vehicle tracking (maps)

---

## Success Criteria

- [x] `/search Bolzano` returns relevant stops
- [x] `/next "Bolzano Stazione"` shows next departures
- [x] `/route Bolzano -> Merano` shows connections
- [x] Both German and Italian names work
- [x] Inline keyboards work for selection
- [x] Setup < 5 minutes with bot token

---

## Created
**Project:** suedtirol-fahrplan  
**Phase:** 0 (REQUIREMENTS)  
**Date:** 2026-02-21  
**Status:** ✅ Complete
