-- Tichu Score Keeper Database Schema

-- Create tables
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('2_teams', '3_teams')),
  target_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'finished')),
  winner_team_id UUID,
  is_draw BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE game_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  final_score INTEGER DEFAULT 0,
  UNIQUE(game_id, team_id),
  UNIQUE(game_id, position),
  CONSTRAINT valid_position CHECK (position IN (1, 2, 3))
);

CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, round_number)
);

CREATE TABLE round_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  score_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id, team_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_games_finished_at ON games(finished_at);
CREATE INDEX idx_game_teams_game_id ON game_teams(game_id);
CREATE INDEX idx_game_teams_team_id ON game_teams(team_id);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_round_scores_round_id ON round_scores(round_id);
CREATE INDEX idx_round_scores_team_id ON round_scores(team_id);
CREATE INDEX idx_teams_username ON teams(username);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public (anon role) read/write access
-- Teams: Allow read all, insert new
CREATE POLICY "teams_read_all" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_all" ON teams FOR INSERT WITH CHECK (true);

-- Games: Allow read all, insert new
CREATE POLICY "games_read_all" ON games FOR SELECT USING (true);
CREATE POLICY "games_insert_all" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "games_update_all" ON games FOR UPDATE USING (true) WITH CHECK (true);

-- Game Teams: Allow read all, insert new
CREATE POLICY "game_teams_read_all" ON game_teams FOR SELECT USING (true);
CREATE POLICY "game_teams_insert_all" ON game_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "game_teams_update_all" ON game_teams FOR UPDATE USING (true) WITH CHECK (true);

-- Rounds: Allow read all, insert new
CREATE POLICY "rounds_read_all" ON rounds FOR SELECT USING (true);
CREATE POLICY "rounds_insert_all" ON rounds FOR INSERT WITH CHECK (true);

-- Round Scores: Allow read all, insert new, delete
CREATE POLICY "round_scores_read_all" ON round_scores FOR SELECT USING (true);
CREATE POLICY "round_scores_insert_all" ON round_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "round_scores_delete_all" ON round_scores FOR DELETE USING (true);
