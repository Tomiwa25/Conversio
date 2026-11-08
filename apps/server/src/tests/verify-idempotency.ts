import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app, server } from '../index.js';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { authService } from '../services/auth.service.js';

process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('🧪 [Conversio Test Suite] Starting Idempotency, Concurrency & Security Verification...\n');

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Healthcheck verification
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'Healthcheck endpoint responds healthy');

    // 2. Initial Room Creation with Idempotency Key K-100 & Cryptographic Host Token
    const key1 = 'test-idempotency-key-100';
    const createPayload1 = {
      title: 'Senior Engineering Standup',
      hostId: 'user-host-42',
      hostName: 'Sarah Senior',
      maxParticipants: 10,
    };

    const res1 = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [IDEMPOTENCY_HEADER]: key1,
      },
      body: JSON.stringify(createPayload1),
    });

    const data1 = await res1.json();
    assert(res1.status === 201 && data1.room?.id, 'Initial room creation returns 201 Created with valid room ID');
    assert(data1.token && data1.role === 'host', 'Host receives cryptographically signed admission token');
    const createdRoomId = data1.room.id;
    const hostToken = data1.token;

    // 3. Cryptographic Token Verification
    const verifiedHost = authService.verifyRoomToken(hostToken);
    assert(
      verifiedHost?.userId === 'user-host-42' && verifiedHost?.role === 'host' && verifiedHost?.roomId === createdRoomId,
      'AuthService verifies host token signature and extracts authenticated role claims'
    );

    // 4. Exact Retry with Key K-100 (Replay Test)
    const res2 = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [IDEMPOTENCY_HEADER]: key1,
      },
      body: JSON.stringify(createPayload1),
    });

    const data2 = await res2.json();
    const isReplayed = res2.headers.get('x-idempotency-replayed') === 'true';
    assert(
      res2.status === 201 && data2.room?.id === createdRoomId && isReplayed,
      'Duplicate request with identical key returns cached response with x-idempotency-replayed header'
    );

    // 5. Payload Mismatch Detection
    const mismatchedPayload = {
      title: 'Mismatched Title For Same Key',
      hostId: 'user-host-42',
    };

    const res3 = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [IDEMPOTENCY_HEADER]: key1,
      },
      body: JSON.stringify(mismatchedPayload),
    });

    const data3 = await res3.json();
    assert(
      res3.status === 422 && data3.error?.includes('Unprocessable Entity'),
      'Reusing idempotency key with mismatched payload returns 422 Unprocessable Entity'
    );

    // 6. Participant Join Token Issuance
    const joinRes = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Participant' }),
    });

    const joinData = await joinRes.json();
    assert(
      joinRes.status === 200 && joinData.token && joinData.role === 'participant',
      'Participant joining room receives signed admission token with role participant'
    );

    // 7. Atomic Room Locking - Successful Host Lock (Expected Version 1 -> Version 2)
    const lockRes1 = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        isLocked: true,
        userId: 'user-host-42',
        expectedVersion: 1,
      }),
    });

    const lockData1 = await lockRes1.json();
    assert(
      lockRes1.status === 200 &&
        lockData1.room?.lockState.isLocked === true &&
        lockData1.room?.lockState.lockVersion === 2,
      'Host locks room with matching expectedVersion and valid token (increments version to 2)'
    );

    // 8. Rejection of Join on Locked Room
    const joinLockedRes = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Late Arrival' }),
    });
    const joinLockedData = await joinLockedRes.json();
    assert(
      joinLockedRes.status === 403 && joinLockedData.code === 'ROOM_LOCKED',
      'Attempting to join locked room is rejected with 403 Forbidden (ROOM_LOCKED)'
    );

    // 9. Optimistic Concurrency Control - Stale Version Rejection
    const staleLockRes = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        isLocked: false,
        userId: 'user-host-42',
        expectedVersion: 1, // Stale! Current version is 2
      }),
    });

    const staleData = await staleLockRes.json();
    assert(
      staleLockRes.status === 409 && staleData.versionMismatch === true,
      'Locking with stale expectedVersion returns 409 Conflict with versionMismatch indicator'
    );

    // 10. Non-host / Tampered Token Lock Rejection
    const unauthorizedLockRes = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${joinData.token}`, // Bob's participant token!
      },
      body: JSON.stringify({
        isLocked: false,
        userId: joinData.userId,
        expectedVersion: 2,
      }),
    });

    assert(
      unauthorizedLockRes.status === 403,
      'Non-host participant token attempting to lock room is rejected with 403 Forbidden'
    );

    // 11. Successful Unlock with Correct Version (Version 2 -> Version 3)
    const unlockRes = await fetch(`${baseUrl}/api/rooms/${createdRoomId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        isLocked: false,
        userId: 'user-host-42',
        expectedVersion: 2,
      }),
    });

    const unlockData = await unlockRes.json();
    assert(
      unlockRes.status === 200 &&
        unlockData.room?.lockState.isLocked === false &&
        unlockData.room?.lockState.lockVersion === 3,
      'Host unlocks room with version 2 and valid token (increments version to 3)'
    );
  } catch (err) {
    console.error('Unexpected test exception:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
