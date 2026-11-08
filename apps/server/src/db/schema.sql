-- ==============================================================================
-- CONVERSIO DATABASE SCHEMA REFERENCE
-- Engine: PostgreSQL 16+
-- Architecture: Distributed Real-Time Media Collaboration Platform
-- Concurrency Pattern: Optimistic Concurrency Control (OCC) + Dual-Layer Idempotency
-- ==============================================================================

-- Enable UUID extension for cryptographic primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS DIRECTORY TABLE
-- Stores participant profiles, host credentials, and default permissions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(64) NOT NULL DEFAULT 'user', -- 'admin', 'host', 'user'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 2. ROOMS TABLE (Core Collaboration Entity)
-- Features Optimistic Concurrency Control (OCC) via `lock_version` to prevent
-- race conditions when multiple hosts attempt to lock/unlock rooms simultaneously.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  host_id VARCHAR(255) NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by VARCHAR(255),
  locked_at TIMESTAMPTZ,
  lock_version INTEGER NOT NULL DEFAULT 1,
  max_participants INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  waiting_room_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes for Room Resolution
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_active_host ON rooms(host_id, is_active);

-- ------------------------------------------------------------------------------
-- 3. DURABLE IDEMPOTENCY RECORDS TABLE
-- Layer 2 of Dual-Layer Idempotency Pattern (Layer 1: Redis Distributed Mutex).
-- Stores cryptographic SHA-256 payload hash and HTTP response body for 24 hours.
-- Guarantees atomic at-most-once execution for room creation and mutation requests.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_records (
  key VARCHAR(255) PRIMARY KEY,
  payload_hash VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'processing', 'completed', 'failed'
  status_code INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for TTL expiration sweep
CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);

-- ------------------------------------------------------------------------------
-- 4. ROOM AUDIT & TELEMETRY EVENTS TABLE
-- Immutable event stream tracking room lifecycle, host actions, admissions,
-- and moderation commands (Mute All, Ejections, Lock/Unlock).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_events (
  id SERIAL PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Audit Trails & Room History Queries
CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_room_events_event_type ON room_events(event_type);
CREATE INDEX IF NOT EXISTS idx_room_events_created_at ON room_events(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- Auto-updates `updated_at` whenever room records are modified.
-- ------------------------------------------------------------------------------
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
