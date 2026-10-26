require('dotenv').config();

const TEST_PORT = process.env.TEST_PORT || process.env.PORT || '5000';
const BASE_URL = process.env.TEST_API_URL || `http://localhost:${TEST_PORT}/api`;
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || process.env.TEST_PASSWORD || '';

async function request(path, options = {}) {
  const isAbsolute = path.startsWith('http://') || path.startsWith('https://');
  const url = isAbsolute ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
}

async function login(email, password = DEFAULT_PASSWORD) {
  if (!password) {
    throw new Error(`Login requires a password or SEED_PASSWORD/TEST_PASSWORD env variable`);
  }
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (!res.data?.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.token;
}

module.exports = {
  BASE_URL,
  request,
  login
};
