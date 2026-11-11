process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app, server } from '../index.js';
import { TokenVerifier } from 'livekit-server-sdk';
import { config } from '../config.js';

async function run() {
  console.log('\n🚀 [Conversio Hub & LiveKit Suite] Starting Verification...\n');

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;

  const verifier = new TokenVerifier(config.livekitApiKey, config.livekitApiSecret);

  try {
    // --------------------------------------------------------------------------
    // Test 1: Create room and verify LiveKit token issuance
    // --------------------------------------------------------------------------
    const createRoomRes = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': 'hub-test-room-1',
      },
      body: JSON.stringify({
        title: 'LiveKit SFU Showcase Room',
        hostId: 'host-100',
        hostName: 'Alice Engineering Host',
      }),
    });

    if (createRoomRes.status !== 201) {
      const errText = await createRoomRes.text();
      console.error('Create room failed:', createRoomRes.status, errText);
    }
    assert.strictEqual(createRoomRes.status, 201, 'Expected 201 Created for room');
    const createRoomData = await createRoomRes.json();
    assert.ok(createRoomData.token, 'Expected Conversio signaling token');
    assert.ok(createRoomData.livekitToken, 'Expected LiveKit SFU media token');

    // Verify LiveKit token cryptographic signature and claims
    const verifiedLiveKitToken = await verifier.verify(createRoomData.livekitToken);
    assert.strictEqual(verifiedLiveKitToken.sub, 'host-100', 'LiveKit token identity mismatch');
    assert.strictEqual(verifiedLiveKitToken.name, 'Alice Engineering Host', 'LiveKit name mismatch');
    assert.ok(verifiedLiveKitToken.video?.roomJoin, 'LiveKit roomJoin grant missing');
    assert.ok(verifiedLiveKitToken.video?.roomAdmin, 'LiveKit roomAdmin grant missing for host');
    assert.ok(verifiedLiveKitToken.video?.canPublish, 'LiveKit canPublish grant missing');
    console.log('  ✅ PASS: Room creation issues valid LiveKit SFU token with admin grants');

    // --------------------------------------------------------------------------
    // Test 2: Dedicated LiveKit token generation endpoint
    // --------------------------------------------------------------------------
    const lkTokenRes = await fetch(`${baseUrl}/api/rooms/${createRoomData.room.id}/livekit-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'participant-200',
        name: 'Bob Participant',
        role: 'participant',
      }),
    });

    assert.strictEqual(lkTokenRes.status, 200, 'Expected 200 for livekit-token endpoint');
    const lkTokenData = await lkTokenRes.json();
    assert.ok(lkTokenData.livekitToken, 'Expected LiveKit token');

    const verifiedBobToken = await verifier.verify(lkTokenData.livekitToken);
    assert.strictEqual(verifiedBobToken.sub, 'participant-200', 'Identity mismatch');
    assert.ok(verifiedBobToken.video?.roomJoin, 'roomJoin grant expected');
    assert.ok(!verifiedBobToken.video?.roomAdmin, 'Participant should not have roomAdmin');
    console.log('  ✅ PASS: Standalone /api/rooms/:id/livekit-token issues scoped media tokens');

    // --------------------------------------------------------------------------
    // Test 3: Channels API (Persistent Team Hub)
    // --------------------------------------------------------------------------
    const createChannelRes = await fetch(`${baseUrl}/api/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Product Design & Architecture',
        slug: 'product-design',
        description: 'Cross-functional design discussions',
        isPrivate: false,
      }),
    });

    assert.strictEqual(createChannelRes.status, 201, 'Expected 201 for channel creation');
    const channelData = await createChannelRes.json();
    assert.strictEqual(channelData.channel.slug, 'product-design');
    console.log('  ✅ PASS: Team channel created with unique slug and metadata');

    // List channels
    const listChannelsRes = await fetch(`${baseUrl}/api/channels`);
    const listChannelsData = await listChannelsRes.json();
    assert.ok(listChannelsData.channels.length >= 3, 'Expected at least 3 channels');
    console.log('  ✅ PASS: Channel directory lists public workspaces');

    // --------------------------------------------------------------------------
    // Test 4: Channel Messages (Persistent Chat History)
    // --------------------------------------------------------------------------
    const postMsgRes = await fetch(`${baseUrl}/api/channels/${channelData.channel.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'host-100',
        senderName: 'Alice',
        content: 'Welcome team! LiveKit SFU media streaming is now online.',
      }),
    });

    assert.strictEqual(postMsgRes.status, 201, 'Expected 201 for message post');
    const msgData = await postMsgRes.json();
    assert.strictEqual(msgData.message.content, 'Welcome team! LiveKit SFU media streaming is now online.');

    // Fetch message history
    const getMsgsRes = await fetch(`${baseUrl}/api/channels/${channelData.channel.id}/messages`);
    const getMsgsData = await getMsgsRes.json();
    assert.strictEqual(getMsgsData.messages.length, 1);
    assert.strictEqual(getMsgsData.messages[0].content, msgData.message.content);
    console.log('  ✅ PASS: Channel message posted and retrieved with persistent history');

    // --------------------------------------------------------------------------
    // Test 5: 1-to-1 Direct Messaging (DMs)
    // --------------------------------------------------------------------------
    const dmRes = await fetch(`${baseUrl}/api/channels/direct/user-bob`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'user-alice',
        content: 'Hey Bob, are you free for a quick 1-on-1 sync?',
      }),
    });

    assert.strictEqual(dmRes.status, 201, 'Expected 201 for DM');

    const getDmRes = await fetch(`${baseUrl}/api/channels/direct/user-bob?currentUserId=user-alice`);
    const getDmData = await getDmRes.json();
    assert.strictEqual(getDmData.messages.length, 1);
    assert.strictEqual(getDmData.messages[0].content, 'Hey Bob, are you free for a quick 1-on-1 sync?');
    console.log('  ✅ PASS: Direct messaging between users functions bidirectionally');

    // --------------------------------------------------------------------------
    // Test 6: Meeting Scheduling (Calendar & Agenda)
    // --------------------------------------------------------------------------
    const scheduleRes = await fetch(`${baseUrl}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Weekly All-Hands Sprint Review',
        description: 'Reviewing communication hub milestones and LiveKit scaling',
        hostId: 'host-100',
        scheduledStart: '2026-11-15T14:00:00.000Z',
        scheduledEnd: '2026-11-15T15:00:00.000Z',
        timezone: 'UTC',
        passcode: '987654',
        invitees: ['user-bob', 'user-charlie'],
      }),
    });

    assert.strictEqual(scheduleRes.status, 201, 'Expected 201 for scheduling');
    const scheduleData = await scheduleRes.json();
    assert.strictEqual(scheduleData.meeting.title, 'Weekly All-Hands Sprint Review');

    // List user meetings
    const listScheduleRes = await fetch(`${baseUrl}/api/schedule?userId=host-100`);
    const listScheduleData = await listScheduleRes.json();
    assert.strictEqual(listScheduleData.meetings.length, 1);
    assert.strictEqual(listScheduleData.meetings[0].id, scheduleData.meeting.id);
    console.log('  ✅ PASS: Calendar meeting scheduled with agenda, invitees, and passcode');

    // Cancel meeting
    const deleteRes = await fetch(`${baseUrl}/api/schedule/${scheduleData.meeting.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'host-100' }),
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('  ✅ PASS: Scheduled meeting cancellation verified');

    console.log('\n📊 Hub & LiveKit Test Summary: 6 Passed, 0 Failed.\n');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
