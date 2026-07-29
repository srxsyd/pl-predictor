import type { Score } from './types';

const STORAGE_KEY = 'pl-predictor-phase2-predictions';

function loadAll(): Record<string, Score> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch (err) {
		console.error('Failed to read predictions from localStorage', err);
		return {};
	}
}

class PredictionsStore {
	predictions = $state<Record<string, Score>>(loadAll());

	get(fixtureId: string): Score | undefined {
		return this.predictions[fixtureId];
	}

	save(fixtureId: string, score: Score) {
		this.predictions[fixtureId] = score;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.predictions));
	}
}

export const predictionsStore = new PredictionsStore();
