-- Migration: 004_room_passcode.sql
-- Description: Adds optional passcode_hash to rooms table for meeting password protection

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS passcode_hash VARCHAR(255);
