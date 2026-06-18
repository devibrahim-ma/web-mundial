export interface Team {
  name: string;
  flag: string;
  sportsDbId?: number;
  isPlaceholder?: boolean;
}

export interface Match {
  id: string;
  home: string;
  away: string;
  label?: string;
  phase?: 'groups' | 'knockouts';
}

export interface MatchResult {
  score1: number | null;
  score2: number | null;
  penaltyWinner?: number | null;
}

export interface Profile {
  id: number;
  name: string;
  predictions: Record<string, MatchResult>;
  password?: string;
}

export interface LeaderboardItem {
  id: number | string;
  name: string;
  points: number;
  perfect: number;
  outcome: number;
  fail: number;
}

export interface FriendTheme {
  flags: string[];
  bgImage: string;
  gradient: string;
}
