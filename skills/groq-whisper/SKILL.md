# Groq Whisper Skill

Voice message transcription using Groq's Whisper API. Ultra-fast, affordable speech-to-text.

## Features
- **Whisper Large v3** - State-of-the-art transcription
- **Ultra-fast** - ~10x faster than realtime
- **Cost-effective** - $0.0001 per second of audio
- **Multilingual** - 99 languages supported

## Usage

### Transcribe Audio File
```bash
node skills/groq-whisper/scripts/transcribe.mjs <audio_file_path> [options]
```

### Options
- `--language <code>` - Force language (e.g., 'de', 'en')
- `--prompt <text>` - Context prompt for better accuracy
- `--output <file>` - Save transcript to file

### Examples
```bash
# Basic transcription
node skills/groq-whisper/scripts/transcribe.mjs voice_message.ogg

# German transcription with prompt
node skills/groq-whisper/scripts/transcribe.mjs voice.ogg --language de --prompt "Technische Dokumentation, AI, Software"

# Save to file
node skills/groq-whisper/scripts/transcribe.mjs audio.mp3 --output transcript.txt
```

## Environment
Key loaded from: `~/.openclaw/credentials/.env`
- `GROQ_API_KEY` - Your Groq API key

## API Docs
https://console.groq.com/docs/speech-text
