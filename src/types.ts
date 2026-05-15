export enum GameMode {
  TWO_TEAMS = '2_teams',
  THREE_TEAMS = '3_teams',
}

export enum GameStatus {
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface Team {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

export interface Game {
  id: string;
  mode: GameMode;
  target_score: number;
  status: GameStatus;
  winner_team_id: string | null;
  is_draw: boolean;
  created_at: string;
  finished_at: string | null;
}

export interface GameTeam {
  id: string;
  game_id: string;
  team_id: string;
  position: number;
  final_score: number;
  team?: Team;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  created_at: string;
  scores?: RoundScore[];
}

export interface RoundScore {
  id: string;
  round_id: string;
  team_id: string;
  score_change: number;
  created_at: string;
}

export interface TeamStats {
  display_name: string;
  username: string;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  average_score: number;
  highest_score: number;
  total_rounds: number;
}
