-- Remove PIN authentication from teams.
-- Run this once on an existing database (Supabase SQL editor).
ALTER TABLE teams DROP COLUMN IF EXISTS pin_hash;
