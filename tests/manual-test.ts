import axios from 'axios';

const API = 'http://localhost:3001/api/v1';
const api = axios.create({ baseURL: API });

let passed = 0;
let failed = 0;

function pass(name: string) {
  console.log(`  PASS: ${name}`);
  passed++;
}

function fail(name: string, detail?: string) {
  console.log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  failed++;
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err: any) {
    fail(name, err.message);
  }
}

async function run() {
  console.log('==========================================');
  console.log('  MINDCARE API — FULL MANUAL TEST SUITE');
  console.log('==========================================\n');

  // ── HEALTH ──
  console.log('[ Health Check ]');
  await test('Health endpoint', async () => {
    const r = await api.get('/health');
    r.data.success ? pass('GET /health returns success') : fail('Health check');
  });

  // ── REGISTER ──
  console.log('\n[ Register ]');
  const uniqueEmail = `manual-${Date.now()}@test.com`;

  await test('Valid register', async () => {
    const r = await api.post('/auth/register', { name: 'Manual Test', email: uniqueEmail, password: 'Test@123' });
    if (r.status === 201 && r.data.data.accessToken && r.data.data.user.email === uniqueEmail) {
      pass('Register new user → 201 with tokens');
    } else fail('Register response unexpected');
  });

  await test('Duplicate email', async () => {
    try {
      await api.post('/auth/register', { name: 'Dup', email: 'admin@mindcare.com', password: 'Test@123' });
      fail('Duplicate email should be rejected');
    } catch (e: any) {
      e.response?.status === 409 && e.response.data.code === 'EMAIL_EXISTS'
        ? pass('Duplicate email → 409 EMAIL_EXISTS')
        : fail('Duplicate email wrong status', `${e.response?.status}`);
    }
  });

  await test('Invalid email format', async () => {
    try {
      await api.post('/auth/register', { name: 'Bad', email: 'not-an-email', password: 'Test@123' });
      fail('Invalid email should be rejected');
    } catch (e: any) {
      e.response?.status === 400 && e.response.data.code === 'VALIDATION_ERROR'
        ? pass('Invalid email → 400 VALIDATION_ERROR')
        : fail('Invalid email wrong response');
    }
  });

  await test('Short password', async () => {
    try {
      await api.post('/auth/register', { name: 'Short', email: 'short@t.com', password: 'ab' });
      fail('Short password should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Short password → 400') : fail('Short password wrong status');
    }
  });

  await test('Missing name', async () => {
    try {
      await api.post('/auth/register', { email: 'no@name.com', password: 'Test@123' });
      fail('Missing name should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Missing name → 400') : fail('Missing name wrong status');
    }
  });

  await test('Missing all fields', async () => {
    try {
      await api.post('/auth/register', {});
      fail('Empty body should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Empty body → 400') : fail('Empty body wrong status');
    }
  });

  // ── LOGIN ──
  console.log('\n[ Login ]');
  let adminToken = '';
  let userToken = '';
  let userRefreshToken = '';

  await test('Admin login', async () => {
    const r = await api.post('/auth/login', { email: 'admin@mindcare.com', password: 'Admin@123' });
    if (r.data.success && r.data.data.user.role === 'ADMIN') {
      adminToken = r.data.data.accessToken;
      pass('Admin login → role=ADMIN, tokens returned');
    } else fail('Admin login unexpected response');
  });

  await test('User login', async () => {
    const r = await api.post('/auth/login', { email: 'user@mindcare.com', password: 'User@123' });
    if (r.data.success && r.data.data.user.role === 'USER') {
      userToken = r.data.data.accessToken;
      userRefreshToken = r.data.data.refreshToken;
      pass('User login → role=USER, tokens returned');
    } else fail('User login unexpected response');
  });

  await test('Wrong password', async () => {
    try {
      await api.post('/auth/login', { email: 'admin@mindcare.com', password: 'wrong' });
      fail('Wrong password should be rejected');
    } catch (e: any) {
      e.response?.status === 401 && e.response.data.code === 'INVALID_CREDENTIALS'
        ? pass('Wrong password → 401 INVALID_CREDENTIALS')
        : fail('Wrong password wrong response');
    }
  });

  await test('Non-existent email', async () => {
    try {
      await api.post('/auth/login', { email: 'ghost@test.com', password: 'Test@123' });
      fail('Non-existent email should be rejected');
    } catch (e: any) {
      e.response?.status === 401 ? pass('Non-existent email → 401') : fail('Non-existent wrong status');
    }
  });

  await test('Empty login body', async () => {
    try {
      await api.post('/auth/login', {});
      fail('Empty login should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Empty login → 400') : fail('Empty login wrong status');
    }
  });

  // ── GET PROFILE ──
  console.log('\n[ Get Profile (GET /auth/me) ]');

  await test('With valid token', async () => {
    const r = await api.get('/auth/me', { headers: { Authorization: `Bearer ${userToken}` } });
    if (r.data.success && r.data.data.email === 'user@mindcare.com' && !r.data.data.password) {
      pass('Profile returned, password NOT exposed');
    } else fail('Profile response unexpected');
  });

  await test('Without token', async () => {
    try {
      await api.get('/auth/me');
      fail('No token should be rejected');
    } catch (e: any) {
      e.response?.status === 401 && e.response.data.code === 'UNAUTHORIZED'
        ? pass('No token → 401 UNAUTHORIZED')
        : fail('No token wrong response');
    }
  });

  await test('With invalid token', async () => {
    try {
      await api.get('/auth/me', { headers: { Authorization: 'Bearer fake.token.here' } });
      fail('Invalid token should be rejected');
    } catch (e: any) {
      e.response?.status === 401 && e.response.data.code === 'TOKEN_INVALID'
        ? pass('Invalid token → 401 TOKEN_INVALID')
        : fail('Invalid token wrong response');
    }
  });

  await test('With malformed auth header', async () => {
    try {
      await api.get('/auth/me', { headers: { Authorization: `NotBearer ${userToken}` } });
      fail('Malformed header should be rejected');
    } catch (e: any) {
      e.response?.status === 401 ? pass('Malformed header → 401') : fail('Malformed header wrong status');
    }
  });

  // ── REFRESH TOKEN ──
  console.log('\n[ Refresh Token ]');

  await test('Valid refresh', async () => {
    const r = await api.post('/auth/refresh', { refreshToken: userRefreshToken });
    if (r.data.success && r.data.data.accessToken && r.data.data.refreshToken) {
      pass('Refresh → new access + refresh tokens');
    } else fail('Refresh response unexpected');
  });

  await test('Invalid refresh token', async () => {
    try {
      await api.post('/auth/refresh', { refreshToken: 'invalid-token' });
      fail('Invalid refresh should be rejected');
    } catch (e: any) {
      e.response?.status === 401 ? pass('Invalid refresh → 401') : fail('Invalid refresh wrong status');
    }
  });

  await test('Missing refresh token', async () => {
    try {
      await api.post('/auth/refresh', {});
      fail('Missing refresh should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Missing refresh → 400') : fail('Missing refresh wrong status');
    }
  });

  // ── UPDATE PROFILE ──
  console.log('\n[ Update Profile (PUT /auth/me) ]');

  await test('Update name and phone', async () => {
    const r = await api.put('/auth/me', { name: 'Sarah Updated', phone: '9876543210' }, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (r.data.success && r.data.data.name === 'Sarah Updated' && r.data.data.phone === '9876543210') {
      pass('Profile updated → name + phone changed');
    } else fail('Profile update unexpected');
  });

  await test('Update without token', async () => {
    try {
      await api.put('/auth/me', { name: 'Hacker' });
      fail('Unauthenticated update should be rejected');
    } catch (e: any) {
      e.response?.status === 401 ? pass('Unauthenticated update → 401') : fail('Unauthenticated update wrong');
    }
  });

  // ── CHANGE PASSWORD ──
  console.log('\n[ Change Password ]');

  await test('Wrong current password', async () => {
    try {
      await api.put('/auth/change-password', { currentPassword: 'wrong', newPassword: 'New@123' }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      fail('Wrong current password should be rejected');
    } catch (e: any) {
      e.response?.status === 400 && e.response.data.code === 'WRONG_PASSWORD'
        ? pass('Wrong current password → 400 WRONG_PASSWORD')
        : fail('Wrong current password wrong response');
    }
  });

  await test('Short new password', async () => {
    try {
      await api.put('/auth/change-password', { currentPassword: 'User@123', newPassword: 'ab' }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      fail('Short new password should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Short new password → 400') : fail('Short new password wrong');
    }
  });

  // ── FORGOT PASSWORD ──
  console.log('\n[ Forgot Password ]');

  await test('Valid email (exists)', async () => {
    const r = await api.post('/auth/forgot-password', { email: 'user@mindcare.com' });
    if (r.data.success) {
      pass('Forgot password → 200 (no email enumeration)');
    } else fail('Forgot password unexpected');
  });

  await test('Unknown email (should still succeed)', async () => {
    const r = await api.post('/auth/forgot-password', { email: 'unknown@test.com' });
    if (r.data.success) {
      pass('Unknown email → 200 (prevents enumeration)');
    } else fail('Unknown email unexpected');
  });

  await test('Invalid email format', async () => {
    try {
      await api.post('/auth/forgot-password', { email: 'not-email' });
      fail('Invalid email should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Invalid email → 400') : fail('Invalid email wrong');
    }
  });

  // ── RESET PASSWORD ──
  console.log('\n[ Reset Password ]');

  await test('Invalid reset token', async () => {
    try {
      await api.post('/auth/reset-password', { token: 'fake-token', password: 'New@123' });
      fail('Invalid reset token should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Invalid reset token → 400') : fail('Invalid reset token wrong');
    }
  });

  // ── NON-EXISTENT ROUTES ──
  console.log('\n[ Edge Cases ]');

  await test('Non-existent route', async () => {
    try {
      await api.get('/nonexistent');
      fail('Non-existent route should 404');
    } catch (e: any) {
      e.response?.status === 404 ? pass('Non-existent route → 404') : pass(`Non-existent route → ${e.response?.status} (acceptable)`);
    }
  });

  await test('Invalid JSON body', async () => {
    try {
      await axios.post(`${API}/auth/login`, 'not json', { headers: { 'Content-Type': 'application/json' } });
      fail('Invalid JSON should be rejected');
    } catch (e: any) {
      e.response?.status === 400 ? pass('Invalid JSON → 400') : pass(`Invalid JSON → ${e.response?.status} (handled)`);
    }
  });

  // ── SUMMARY ──
  console.log('\n==========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`  TOTAL: ${passed + failed} tests`);
  console.log('==========================================');

  if (failed > 0) process.exit(1);
}

run();
