export type Score = { home: number; away: number };

export type Fixture = {
	id: string;
	home: string;
	away: string;
	matchweek: number;
	kickoffAt: string | null;
	actual: Score | null;
};

export type LeaderboardEntry = {
	username: string;
	points: number;
};
