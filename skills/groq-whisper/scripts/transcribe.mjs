#!/usr/bin/env node
/**
 * Groq Whisper Transcription Script
 * Fast, affordable speech-to-text API
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { createReadStream, existsSync } from 'fs';

// Load env from credentials
config({ path: resolve(process.env.HOME, '.openclaw/credentials/.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

function showUsage() {
  console.log(`
Usage: node transcribe.mjs <audio_file> [options]

Options:
  --language <code>    Force language (e.g., 'de', 'en')
  --prompt <text>      Context prompt for better accuracy
  --output <file>      Save transcript to file instead of stdout
  --verbose            Show detailed response

Examples:
  node transcribe.mjs voice.ogg
  node transcribe.mjs audio.mp3 --language de --output transc.txt
`);
  process.exit(1);
}

async function transcribe(filePath, options = {}) {
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in ~/.openclaw/credentials/.env');
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const form = new FormData();
  form.append('file', createReadStream(filePath));
  form.append('model', 'whisper-large-v3');
  
  if (options.language) {
    form.append('language', options.language);
  }
  if (options.prompt) {
    form.append('prompt', options.prompt);
  }
  form.append('response_format', 'json');

  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    const data = await response.json();
    
    if (options.verbose) {
      console.log(JSON.stringify({ ...data, latency_ms: duration }, null, 2));
    } else {
      console.log(data.text);
    }

    // Save to file if requested
    if (options.output) {
      const fs = await import('fs');
      fs.writeFileSync(options.output, data.text);
      console.error(`\n✅ Saved to: ${options.output}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Transcription failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.length < 1) showUsage();

const filePath = args[0];
const options = {};

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case '--language':
    case '-l':
      options.language = args[++i];
      break;
    case '--prompt':
    case '-p':
      options.prompt = args[++i];
      break;
    case '--output':
    case '-o':
      options.output = args[++i];
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--help':
    case '-h':
      showUsage();
      break;
  }
}

transcribe(filePath, options);
