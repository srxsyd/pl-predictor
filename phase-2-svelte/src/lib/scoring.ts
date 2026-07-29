import type { Score } from './types';

type MatchResult = 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';

function getResult({ home, away }: Score): MatchResult {
	if (home > away) return 'HOME_WIN';
	if (home < away) return 'AWAY_WIN';
	return 'DRAW';
}

export function calculatePoints(predicted: Score, actual: Score | null): number | null {
	if (!actual) return null;
	const exactMatch = predicted.home === actual.home && predicted.away === actual.away;
	if (exactMatch) return 3;
	return getResult(predicted) === getResult(actual) ? 1 : 0;
}
