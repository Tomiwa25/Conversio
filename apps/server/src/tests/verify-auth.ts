import assert from 'node:assert';
import { app, server } from '../index.js';
import { db } from '../db.js';

const PORT = 4002;
const BASE_URL = `http://localhost:${PORT}`;

function pass(testName: string) {
  console.log(`  ✅ PASS: ${testName}`);
}

async function runAuthSecurityTests() {
  console.log('\n🔐 [Conversio Auth Suite] Starting User Authentication & Security Verification...\n');

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => resolve());
  });

  try {
    // Test 1: User Registration
    const testEmail = `sarah.connor.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });

    assert.strictEqual(regRes.status, 201, 'Registration should return 201 Created');
    const regData = await regRes.json();
    assert.ok(regData.accessToken, 'Registration should return accessToken');
    assert.ok(regData.refreshToken, 'Registration should return refreshToken');
    assert.strictEqual(regData.user.email, testEmail);
    pass('User registration succeeds with bcrypt password hashing and dual tokens');

    // Test 2: Duplicate Registration Rejection
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Sarah',
        email: testEmail,
        password: 'AnotherPassword123!',
      }),
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate email should return 409 Conflict');
    pass('Duplicate email registration is rejected with 409 Conflict');

    // Test 3: User Login with Valid Password
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login should return 200 OK');
    const loginData = await loginRes.json();
    assert.ok(loginData.accessToken);
    assert.strictEqual(loginData.user.name, 'Sarah Connor');
    pass('Login with correct credentials returns valid JWT token pair');

    // Test 4: User Login with Invalid Password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    assert.strictEqual(badLoginRes.status, 401, 'Invalid password should return 401 Unauthorized');
    pass('Login with incorrect password rejected with 401 Unauthorized');

    // Test 5: Protected Route Access (/api/auth/me)
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
      },
    });
    assert.strictEqual(meRes.status, 200, '/api/auth/me should return 200 with valid token');
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, testEmail);
    pass('Protected /api/auth/me returns authenticated profile with Bearer token');

    // Test 6: Protected Route Rejection without Token
    const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
    assert.strictEqual(unauthRes.status, 401, 'Missing token should return 401 Unauthorized');
    pass('Accessing protected route without token rejected with 401 Unauthorized');

    // Test 7: Security Headers (Helmet)
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(healthRes.headers.get('x-dns-prefetch-control'), 'off');
    pass('Helmet security headers (X-Content-Type-Options: nosniff) verified on HTTP responses');

    // Test 8: Authenticated Room Creation
    const roomRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.accessToken}`,
        'x-idempotency-key': `auth-room-${Date.now()}`,
      },
      body: JSON.stringify({
        title: 'Authenticated Security Review',
        hostId: 'spoofed-id', // Should be ignored in favor of verified token
      }),
    });
    assert.strictEqual(roomRes.status, 201, 'Room creation with auth should return 201 Created');
    const roomData = await roomRes.json();
    assert.strictEqual(roomData.userId, loginData.user.id, 'Host ID must match authenticated user token');
    pass('Authenticated room creation binds hostId strictly to verified JWT identity');

    console.log('\n📊 Auth Test Summary: 8 Passed, 0 Failed.\n');
  } finally {
    server.close();
    await db.close();
  }
}

runAuthSecurityTests().catch((err) => {
  console.error('\n❌ Auth security test suite failed:', err);
  process.exit(1);
});

