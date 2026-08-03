import { API_BASE } from '$lib/config';
import type { Fixture, LeaderboardEntry } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [fixturesRes, leaderboardRes] = await Promise.all([
		fetch(`${API_BASE}/api/fixtures`),
		fetch(`${API_BASE}/api/leaderboard`)
	]);
	const fixtures: Fixture[] = await fixturesRes.json();
	const leaderboard: LeaderboardEntry[] = await leaderboardRes.json();
	return { fixtures, leaderboard };
};
