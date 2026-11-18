import assert from 'node:assert';
import { app, server } from '../index.js';
import { config } from '../config.js';

const PORT = 4005;
const BASE_URL = `http://localhost:${PORT}`;

function pass(testName: string) {
  console.log(`  ✅ PASS: ${testName}`);
}

async function runPasswordResetAndSecurityTests() {
  console.log('\n🛡️ [Conversio Security Suite] Verifying Password Reset Poisoning & Fault Tolerance...\n');

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => resolve());
  });

  try {
    // 1. Register a test user
    const testEmail = `victim.${Date.now()}@conversio.io`;
    const initialPassword = 'InitialSecure123!';

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Victim User',
        email: testEmail,
        password: initialPassword,
      }),
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    pass('Target user registered with valid credentials');

    // 2. Layer 1 Defense: Host Header Whitelist Guard blocks unauthorized Host / X-Forwarded-Host header poisoning
    const poisonedHost = 'attacker-controlled-site.com';
    const blockedRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Host': poisonedHost,
      },
      body: JSON.stringify({ email: testEmail }),
    });

    assert.strictEqual(blockedRes.status, 400, 'Spoofed Host header should be rejected with 400');
    const blockedData = await blockedRes.json();
    assert.strictEqual(blockedData.error.code, 'INVALID_HOST_HEADER');
    pass('Layer 1 Defense: HostHeaderGuard rejects untrusted Host header poisoning with 400 Bad Request');

    // 3. Layer 2 Defense: Reset URL strictly anchors to config.frontendUrl, never to request headers
    const validResetReq = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    assert.strictEqual(validResetReq.status, 200, 'Legitimate forgot-password request returns 200 OK');
    const resetReqData = await validResetReq.json();
    assert.ok(resetReqData.resetUrl, 'Reset URL returned for verification in test environment');
    assert.ok(
      resetReqData.resetUrl.startsWith(config.frontendUrl),
      `Reset URL must strictly match server configuration frontendUrl (${config.frontendUrl})`
    );
    pass('Layer 2 Defense: Generated reset URL is strictly anchored to config.frontendUrl');

    // 4. Timing / Enumeration resistance: Requesting reset for non-existent email gives uniform generic response
    const fakeReqRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent-user-xyz@conversio.io' }),
    });
    assert.strictEqual(fakeReqRes.status, 200);
    const fakeData = await fakeReqRes.json();
    assert.strictEqual(
      fakeData.message,
      'If an account exists with this email address, password reset instructions have been dispatched.'
    );
    pass('User enumeration defense verified: Non-existent email returns identical generic response');

    // 5. Reset password with invalid token is rejected
    const badResetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-fake-token-12345678901234567890123456789012',
        newPassword: 'BrandNewPassword123!',
      }),
    });
    assert.strictEqual(badResetRes.status, 400);
    pass('Resetting password with invalid token is rejected with 400 Bad Request');

    // 6. Complete legitimate password reset with valid token
    const validToken = resetReqData.resetToken;
    const newPassword = 'BrandNewPassword123!';

    const validResetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: validToken,
        newPassword,
      }),
    });
    assert.strictEqual(validResetRes.status, 200);
    pass('Password successfully reset using valid cryptographic token');

    // 7. Single-Use Invalidation: Re-using the same reset token is strictly rejected
    const reuseResetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: validToken,
        newPassword: 'AnotherPassword999!',
      }),
    });
    assert.strictEqual(reuseResetRes.status, 400);
    const reuseData = await reuseResetRes.json();
    assert.ok(
      reuseData.error.message.includes('already been used') || reuseData.error.message.includes('expired'),
      'Token reuse must be blocked'
    );
    pass('Single-use token integrity verified: Reusing consumed reset token is rejected');

    // 8. Login with old password must fail
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    assert.strictEqual(oldLoginRes.status, 401);
    pass('Authentication with previous password rejected');

    // 9. Login with new password succeeds
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    assert.strictEqual(newLoginRes.status, 200);
    const newLoginData = await newLoginRes.json();
    assert.ok(newLoginData.accessToken);
    pass('Authentication with newly reset password succeeds');

    // 10. Health diagnostic check
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');
    assert.ok(healthData.components.memory.heapUsedMb > 0);
    pass('Healthcheck endpoint returns detailed service & component diagnostics');

    console.log('\n📊 Security & Password Reset Test Summary: 10 Passed, 0 Failed.\n');
  } finally {
    server.close();
  }
}

runPasswordResetAndSecurityTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
