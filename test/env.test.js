import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import { loadEnv, getOpenAiApiKey } from '../src/config/env.js';

test('loadEnv reads values from a .env file without overwriting existing variables', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budget-env-'));
  const envPath = path.join(tempDir, '.env');
  await fs.writeFile(envPath, "EXISTING=value\nOPENAI_API_KEY=temp-key\n");

  process.env.EXISTING = 'already-set';
  delete process.env.OPENAI_API_KEY;

  loadEnv({ envPath });

  assert.equal(process.env.EXISTING, 'already-set');
  assert.equal(process.env.OPENAI_API_KEY, 'temp-key');
});

test('getOpenAiApiKey returns trimmed value when available in environment', async (t) => {
  process.env.OPENAI_API_KEY = '   padded-key   ';
  const key = getOpenAiApiKey();
  assert.equal(key, 'padded-key');
});

test('getOpenAiApiKey loads from .env file and throws if missing', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'budget-env-missing-'));
  const envPath = path.join(tempDir, '.env');
  await fs.writeFile(envPath, '# comment only\n');

  delete process.env.OPENAI_API_KEY;

  assert.throws(() => getOpenAiApiKey({ envPath }), /OPENAI_API_KEY is not configured/);
});
