import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export async function runSeeder(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://conversio_admin:conversio_secure_db_password_2026@localhost:5432/conversio';

  console.log('🌱 [Database Seeder] Initializing sample demo data seeder...');
  console.log(`📡 Target Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    // 1. Seed Demo Users
    console.log('  👥 Seeding demo users...');
    const users = [
      {
        id: 'user-sarah-host',
        name: 'Sarah Connor (Host)',
        email: 'sarah@conversio.io',
        role: 'host',
      },
      {
        id: 'user-alex-dev',
        name: 'Alex Mercer (Staff Engineer)',
        email: 'alex@conversio.io',
        role: 'user',
      },
      {
        id: 'user-elena-pm',
        name: 'Elena Rostova (Product Manager)',
        email: 'elena@conversio.io',
        role: 'user',
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role`,
        [u.id, u.name, u.email, u.role]
      );
    }
    console.log(`    ✅ Seeded ${users.length} users.`);

    // 2. Seed Realistic Demo Collaboration Rooms
    console.log('  🎥 Seeding demo video conferencing rooms...');
    const demoRooms = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        title: 'Engineering Daily Standup',
        host_id: 'user-sarah-host',
        is_locked: false,
        lock_version: 1,
        waiting_room_enabled: false,
        max_participants: 25,
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        title: 'Executive Strategy Sync (Locked Demo)',
        host_id: 'user-sarah-host',
        is_locked: true,
        locked_by: 'user-sarah-host',
        locked_at: new Date().toISOString(),
        lock_version: 2,
        waiting_room_enabled: false,
        max_participants: 10,
      },
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        title: 'Design Systems & Product Jam (Waiting Room Demo)',
        host_id: 'user-sarah-host',
        is_locked: false,
        lock_version: 1,
        waiting_room_enabled: true,
        max_participants: 50,
      },
    ];

    for (const r of demoRooms) {
      await client.query(
        `INSERT INTO rooms (id, title, host_id, is_locked, locked_by, locked_at, lock_version, waiting_room_enabled, max_participants)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           is_locked = EXCLUDED.is_locked,
           locked_by = EXCLUDED.locked_by,
           locked_at = EXCLUDED.locked_at,
           lock_version = EXCLUDED.lock_version,
           waiting_room_enabled = EXCLUDED.waiting_room_enabled`,
        [
          r.id,
          r.title,
          r.host_id,
          r.is_locked,
          (r as any).locked_by || null,
          (r as any).locked_at || null,
          r.lock_version,
          r.waiting_room_enabled,
          r.max_participants,
        ]
      );
    }
    console.log(`    ✅ Seeded ${demoRooms.length} rooms.`);

    // 3. Seed Audit Log Events
    console.log('  📜 Seeding room audit event logs...');
    for (const r of demoRooms) {
      await client.query(
        `INSERT INTO room_events (room_id, event_type, actor_id, metadata)
         VALUES ($1, 'ROOM_CREATED', $2, $3)`,
        [r.id, r.host_id, JSON.stringify({ seeded: true, timestamp: new Date().toISOString() })]
      );
    }

    client.release();

    console.log('\n🎉 [Database Seeder] Seeding completed successfully!');
    console.log('\n📋 Available Demo Meeting Rooms for Testing:');
    console.log('---------------------------------------------------------------------------------');
    console.log('1. Open Meeting:');
    console.log('   Title: Engineering Daily Standup');
    console.log('   Link:  http://localhost:3000/room/a0000000-0000-0000-0000-000000000001?name=DemoGuest\n');
    console.log('2. Locked Meeting (Tests OCC & Locked State UI):');
    console.log('   Title: Executive Strategy Sync');
    console.log('   Link:  http://localhost:3000/room/a0000000-0000-0000-0000-000000000002?name=DemoGuest\n');
    console.log('3. Virtual Waiting Room (Tests Admittance Flow):');
    console.log('   Title: Design Systems & Product Jam');
    console.log('   Link:  http://localhost:3000/room/a0000000-0000-0000-0000-000000000003?name=DemoGuest');
    console.log('---------------------------------------------------------------------------------\n');
  } catch (err: any) {
    console.error('\n❌ [Database Seeder] Seeding failed:');
    console.error(`   Error message: ${err.message}`);
    console.error('\n💡 Troubleshooting Tip:');
    console.error('   Ensure PostgreSQL is running and migrations have been executed first:');
    console.error('   1. docker-compose up -d postgres');
    console.error('   2. npm run db:migrate');
    console.error('   3. npm run db:seed\n');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Execute directly if run as a CLI script
if (process.argv[1]?.includes('seed')) {
  runSeeder();
}
