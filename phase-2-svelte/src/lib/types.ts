export type Score = { home: number; away: number };

export type Fixture = {
	id: string;
	home: string;
	away: string;
	actual: Score | null;
};

export type LeaderboardEntry = {
	name: string;
	points: number;
};
