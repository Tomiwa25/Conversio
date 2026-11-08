-- Migration: 002_indexes_and_constraints.sql
-- Description: Indexes, triggers, and foreign keys for high-performance lookups

-- Indexes on Rooms
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_active_host ON rooms(host_id, is_active);

-- Indexes on Idempotency Records
CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);

-- Indexes on Room Events
CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_room_events_event_type ON room_events(event_type);
CREATE INDEX IF NOT EXISTS idx_room_events_created_at ON room_events(created_at DESC);

-- Users Index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at Trigger on Rooms
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rooms_timestamp ON rooms;
CREATE TRIGGER trigger_update_rooms_timestamp
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

