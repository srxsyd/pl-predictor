import { API_BASE } from './config';

type User = {
	id: string;
	email: string;
	username: string | null;
	avatarUrl: string | null;
	isAdmin: boolean;
};

async function parseError(res: Response): Promise<string> {
	try {
		const body = await res.json();
		return body.error ?? `Request failed with status ${res.status}`;
	} catch {
		return `Request failed with status ${res.status}`;
	}
}

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);

	async init() {
		try {
			const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
			this.user = res.ok ? await res.json() : null;
		} finally {
			this.loading = false;
		}
	}

	async signup(email: string, password: string, username: string) {
		const res = await fetch(`${API_BASE}/api/auth/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email, password, username })
		});
		if (!res.ok) throw new Error(await parseError(res));
		this.user = await res.json();
	}

	async login(email: string, password: string) {
		const res = await fetch(`${API_BASE}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email, password })
		});
		if (!res.ok) throw new Error(await parseError(res));
		this.user = await res.json();
	}

	async logout() {
		await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
		this.user = null;
	}

	setAvatarUrl(avatarUrl: string) {
		if (this.user) this.user = { ...this.user, avatarUrl };
	}
}

export const authStore = new AuthStore();
