const fs = require('fs');
const path = require('path');

const loadedEnvPaths = new Set();

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();

  if (!key) {
    return null;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadEnv(options = {}) {
  const envPath = options.envPath
    ? path.resolve(options.envPath)
    : path.resolve(process.cwd(), '.env');

  if (loadedEnvPaths.has(envPath)) {
    return;
  }

  if (!fs.existsSync(envPath)) {
    loadedEnvPaths.add(envPath);
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const entry = parseLine(line);
    if (!entry) {
      continue;
    }

    const [key, value] = entry;
    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }
    process.env[key] = value;
  }

  loadedEnvPaths.add(envPath);
}

function getOpenAiApiKey(options = {}) {
  loadEnv(options);
  const rawValue = process.env.OPENAI_API_KEY;
  if (!rawValue) {
    throw new Error('OPENAI_API_KEY is not configured. Set it in your environment or in a .env file.');
  }
  return rawValue.trim();
}

module.exports = {
  loadEnv,
  getOpenAiApiKey,
};
