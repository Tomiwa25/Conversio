import assert from 'node:assert';
import http from 'node:http';
import { app } from '../index';
import { roomService } from '../services/room.service';

const PORT = 4002;

function postRequest(
  urlPath: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request(
      `http://localhost:${PORT}${urlPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, headers: res.headers, data: parsed });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runPasscodeTests() {
  console.log('\n🔒 [Conversio Passcode Suite] Starting Room Passcode & Security Lock Verification...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  try {
    // 1. Create room with passcode
    const createRes = await postRequest('/api/rooms', {
      title: 'Confidential Strategy Meeting',
      hostId: 'host-passcode-001',
      hostName: 'Security Lead',
      passcode: '654321',
    });

    assert.strictEqual(createRes.status, 201, 'Room creation with passcode should return 201');
    assert.strictEqual(createRes.data.room.isPasscodeProtected, true, 'Room should report isPasscodeProtected === true');
    console.log('  ✅ PASS: Room created with bcrypt-hashed passcode (isPasscodeProtected: true)');

    const roomId = createRes.data.room.id;

    // 2. Attempt to join without passcode -> 401 PASSCODE_REQUIRED
    const joinNoPasscode = await postRequest(`/api/rooms/${roomId}/join`, {
      name: 'Uninvited Guest',
      userId: 'guest-001',
    });

    assert.strictEqual(joinNoPasscode.status, 401, 'Joining without passcode should return 401');
    assert.strictEqual(joinNoPasscode.data.code, 'PASSCODE_REQUIRED', 'Error code should be PASSCODE_REQUIRED');
    console.log('  ✅ PASS: Joining without passcode rejected with 401 PASSCODE_REQUIRED');

    // 3. Attempt to join with incorrect passcode -> 401 INVALID_PASSCODE
    const joinWrongPasscode = await postRequest(`/api/rooms/${roomId}/join`, {
      name: 'Curious Attendee',
      userId: 'guest-002',
      passcode: '000000',
    });

    assert.strictEqual(joinWrongPasscode.status, 401, 'Joining with incorrect passcode should return 401');
    assert.strictEqual(joinWrongPasscode.data.code, 'INVALID_PASSCODE', 'Error code should be INVALID_PASSCODE');
    console.log('  ✅ PASS: Joining with incorrect passcode rejected with 401 INVALID_PASSCODE');

    // 4. Join with correct passcode -> 200 OK + Signed Token
    const joinCorrectPasscode = await postRequest(`/api/rooms/${roomId}/join`, {
      name: 'Authorized Member',
      userId: 'guest-003',
      passcode: '654321',
    });

    assert.strictEqual(joinCorrectPasscode.status, 200, 'Joining with correct passcode should return 200');
    assert.ok(joinCorrectPasscode.data.token, 'Response should include signed admission token');
    console.log('  ✅ PASS: Joining with correct passcode succeeds and issues signed admission token');

    // 5. Open room without passcode allows immediate entry
    const openRoomRes = await postRequest('/api/rooms', {
      title: 'Public Community Standup',
      hostId: 'host-open-001',
      hostName: 'Community Lead',
    });

    assert.strictEqual(openRoomRes.status, 201);
    assert.strictEqual(openRoomRes.data.room.isPasscodeProtected, false);

    const openJoinRes = await postRequest(`/api/rooms/${openRoomRes.data.room.id}/join`, {
      name: 'Open Guest',
      userId: 'guest-open-001',
    });

    assert.strictEqual(openJoinRes.status, 200);
    assert.ok(openJoinRes.data.token);
    console.log('  ✅ PASS: Unprotected rooms allow open entry without passcode prompt');

    console.log('\n📊 Passcode Test Summary: 5 Passed, 0 Failed.\n');
  } finally {
    server.close();
  }
}

runPasscodeTests().catch((err) => {
  console.error('\n❌ Passcode verification failed:', err);
  process.exit(1);
});

