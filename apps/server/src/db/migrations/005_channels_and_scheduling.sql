-- ==============================================================================
-- MIGRATION 005: CHANNELS, DIRECT MESSAGING & MEETING SCHEDULING
-- Adds persistent team hub capabilities (Slack/Zoom Team Chat + Zoom Calendar)
-- ==============================================================================

-- 1. Channels (Team Workspaces & Group Discussions)
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_slug ON channels(slug);
CREATE INDEX IF NOT EXISTS idx_channels_is_private ON channels(is_private);

-- 2. Channel Memberships
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(64) NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);

-- 3. Persistent Channel Messages
CREATE TABLE IF NOT EXISTS channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created ON channel_messages(channel_id, created_at DESC);

-- 4. 1-to-1 Direct Messaging (DMs)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_unread ON direct_messages(recipient_id, is_read);

-- 5. Scheduled Meetings (Calendar & Agenda Management)
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  passcode VARCHAR(255),
  recurrence_rule VARCHAR(255), -- e.g. RRULE:FREQ=WEEKLY
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_host ON scheduled_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_time ON scheduled_meetings(scheduled_start, scheduled_end);

-- 6. Scheduled Meeting Invitees
CREATE TABLE IF NOT EXISTS scheduled_meeting_invitees (
  meeting_id UUID REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  PRIMARY KEY (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_invitees_user ON scheduled_meeting_invitees(user_id, status);
