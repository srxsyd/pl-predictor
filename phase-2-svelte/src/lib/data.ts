import type { Fixture, LeaderboardEntry } from './types';

// hardcoded for now — replaces itself with a real fixtures API in Phase 3
export const FIXTURES: Fixture[] = [
	{ id: 'f1', home: 'Arsenal', away: 'Manchester United', actual: { home: 2, away: 1 } },
	{ id: 'f2', home: 'Liverpool', away: 'Chelsea', actual: { home: 1, away: 1 } },
	{ id: 'f3', home: 'Manchester City', away: 'Tottenham', actual: null },
	{ id: 'f4', home: 'Newcastle', away: 'Aston Villa', actual: null }
];

export const MOCK_USERS: LeaderboardEntry[] = [
	{ name: 'Sam', points: 7 },
	{ name: 'Jordan', points: 5 }
];
