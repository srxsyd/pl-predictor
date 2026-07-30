import { API_BASE } from '$lib/config';
import type { Fixture } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch(`${API_BASE}/api/fixtures`);
	const fixtures: Fixture[] = await res.json();
	return { fixtures };
};
