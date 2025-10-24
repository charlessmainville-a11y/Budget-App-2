import { describe, it } from 'node:test';
import dotenv from 'dotenv';
import assert from 'assert';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const RATE_LIMIT_FILE = path.resolve('.last-openai-check');

function canRunTest() {
  try {
    const lastRun = fs.readFileSync(RATE_LIMIT_FILE, 'utf8');
    const last = new Date(lastRun);
    const now = new Date();
    const hours = (now - last) / (1000 * 60 * 60);
    return hours >= 24;
  } catch {
    return true;
  }
}

function updateLastRun() {
  fs.writeFileSync(RATE_LIMIT_FILE, new Date().toISOString());
}

describe('OpenAI API Connection', () => {
  it('should connect successfully using the environment key (rate-limited)', async () => {
    if (!canRunTest()) {
      console.log('⏳ Skipping OpenAI connection test (last run <24h ago).');
      return;
    }

    assert.ok(OPENAI_KEY, 'Missing OPENAI_API_KEY in .env');

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
    });

    assert.strictEqual(response.status, 200, 'OpenAI API did not return 200 OK');

    const data = await response.json();
    assert.ok(Array.isArray(data.data), 'Response format is unexpected');
    console.log(`✅ Connection OK. Models available: ${data.data.length}`);

    updateLastRun();
  });
});
