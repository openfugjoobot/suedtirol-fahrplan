# REQUIREMENTS.md - crypto

## Projekt: Crypto Market Intelligence Skill

### Ziel (1 Satz)
Ein OpenClaw Skill, der Krypto-Marktdaten (Preise, 24h-Änderungen) und News-Updates abfragt, zwischen speichert, und tägliche KI-generierte Marktanalysen via Telegram bereitstellt.

---

## User Stories

| # | Als... | möchte ich... | damit... |
|---|--------|---------------|----------|
| 1 | Trader | aktuelle Krypto-Preise (1h, 24h, Volumen) abfragen | ich schnell Marktbewegungen sehe |
| 2 | Trader | große Krypto-News aktualisiert bekommen | ich informiert bleibe |
| 3 | Trader | ein Daily Briefing erhalten | ich einen Marktüberblick mit KI-Analyse habe |
| 4 | Nutzer | Coin-Preise favorisieren | ich meine Lieblings-Coins schnell sehe |
| 5 | Nutzer | via Telegram (Commands + Inline Buttons) steuern | ich mobil und einfach zugreifen kann |
| 6 | Nutzer | **Natürliche Fragen stellen können** | ich direkt Antworten ohne Befehle bekomme |

---

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| **Skill-Format** | JavaScript (OpenClaw Skill API) |
| **Datenbank** | SQLite (lokal, keine Server nötig) |
| **Krypto-Daten** | CoinGecko API (kostenlos, kein API-Key nötig für Basic) |
| **News** | CryptoPanic API oder RSS (Blogwatcher) |
| **Scheduler** | OpenClaw Cron (für Updates) |
| **Telegram** | Vorhandene OpenClaw Integration |
| **KI-Analyse** | Bestehendes LLM (kimi-k2.5 oder glm-5) |

---

## Deliverables

### Funktionen
- [ ] Skill `crypto` installierbar via `clawhub`
- [ ] **Telegram Commands:**
  - `/crypto price <coin>` - Aktueller Preis (z.B. /crypto price bitcoin)
  - `/crypto news [coin]` - News zu Coin oder allgemein
  - `/crypto favorites` - Meine favorisierten Coins
  - `/crypto briefing` - Manuell Briefing anfordern
  - `/crypto help` - Hilfe anzeigen
- [ ] **Implizite Erkennung** (Natürliche Sprache):
  - "Wie hoch ist der Bitcoin Preis?" → Zeigt BTC Preis + Chart
  - "Gibt es News zu ETH?" → Zeigt Ethereum News
  - "Wie sieht der Markt aus?" → Marktüberblick Top 10
  - "Ist Ethereum im Plus?" → Zeigt 24h Performance
- [ ] **Inline Buttons** für Coin-Auswahl, Zeitrahmen (1h/24h/7d)
- [ ] **Datenbank** mit Coins, Preisen, News (SQLite)
- [ ] **Cron-Jobs** für automatische Updates (stündlich)
- [ ] **Daily Briefing** (täglich 09:00 Uhr mit KI-Analyse)

### Daten
- [ ] Coin-Liste (Top 100 Coins)
- [ ] Preis-Daten (aktuell + historisch 24h)
- [ ] News-Feeds (Crypto-News-Portale)
- [ ] Nutzer-Favoriten (pro Telegram-User)

---

## Out of Scope (zunächst NICHT)

- [ ] Trading/Transaktionen (nur Daten, kein echtes Trading)
- [ ] Preis-Threshold Alerts ("Informiere mich wenn BTC > 60k")
- [ ] Portfolio-Tracking (meine Bestände verwalten)
- [ ] Twitter/X Integration (prüfen ob Skill verfügbar)
- [ ] Mehrere News-Quellen parallel (starten mit einer)

---

## Success Criteria

- [ ] `/crypto` zeigt Top 10 Coins mit Preis + 24h %
- [ ] `/crypto bitcoin` zeigt BTC Details
- [ ] `/crypto briefing` zeigt sofortiges Marktbriefing
- [ ] Natürliche Fragen erkannt und beantwortet ("Wie hoch ist Bitcoin?")
- [ ] Daily Briefing kommt täglich um 09:00 automatisch
- [ ] Daten werden zwischengespeichert
- [ ] Setup < 5 Minuten

---

## Erstellt
**Projekt:** crypto
**Phase:** 0 (REQUIREMENTS)
**Datum:** 2026-02-19
**Status:** Pending User Approval
