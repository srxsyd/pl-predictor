# premier league predictor
a full-stack prediction app for the 26-27 EPL season

## roadmap

- [x] **Phase 1** — static HTML/CSS/JS prototype (`phase-1/`)
- [x] **Phase 2** — SvelteKit frontend with reactive leaderboard (`phase-2-svelte/`)
- [x] **Phase 3** — Express + SQLite CRUD API for fixtures (`phase-3-api/`)
- [x] **Phase 4** — authentication from scratch (bcrypt + session cookies), predictions moved server-side and scoped per user
- [x] **Phase 5** — Docker (containerize API + frontend, volume-mount the SQLite file)
- [ ] **Phase 6** — S3-compatible file storage (MinIO locally, AWS S3 in prod) for avatars/exports
- [ ] **Phase 7** — deploy to a self-managed VM (EC2/Lightsail/Droplet), HTTPS via Caddy/nginx
- [ ] **Phase 8** — polish: architecture diagram, scoring cron job, resume writeup

## running locally

**Option A — Docker (recommended, one command):**

```bash
docker compose up --build
```

This builds and starts both containers — API on `http://localhost:3001`, frontend on `http://localhost:5173`. The SQLite database lives in a named Docker volume (`pl-predictor_api-data`), so your data survives even if you tear the containers down and rebuild them; it only disappears if you explicitly run `docker compose down -v`. A brand-new/empty database auto-seeds itself with fixtures on first boot — no manual step needed.

Requires Docker (or a Docker-compatible runtime like [Colima](https://github.com/abiosoft/colima) on macOS) to be installed and running.

**Option B — run each piece by hand, two terminals:**

```bash
# API (fixtures + auth + predictions, SQLite-backed)
cd phase-3-api
npm install
npm run seed   # only needed once, or to reset fixture data
npm run dev    # http://localhost:3001

# frontend
cd phase-2-svelte
npm install
npm run dev    # http://localhost:5173
```

Sign up at `/signup`, log in at `/login`. Predictions are stored server-side in SQLite (`phase-3-api/predictor.db`), scoped to your account via a session cookie — no more `localStorage`.

## docker notes

- The frontend uses `@sveltejs/adapter-node` (not `adapter-auto`) so it builds into a plain, self-hostable Node server — `adapter-auto` only targets specific hosting platforms (Vercel, Netlify, etc.) and won't work in a generic container.
- Server-side rendering is turned off (`export const ssr = false` in `src/routes/+layout.ts`). Reason: the frontend and API are separate containers, each with their own private network namespace — `localhost:3001` means something different depending on which container is asking. Rather than juggle two different API addresses (one for the browser, one for server-side code running inside the frontend container), all data-fetching happens from the browser, same as it already did for auth and predictions.
- `PUBLIC_API_BASE` (`phase-2-svelte/.env` locally, or the `PUBLIC_API_BASE` build arg in `docker-compose.yml`) controls what address the browser calls — this gets baked into the JS bundle at build time.
- `better-sqlite3` and `bcrypt` are native modules (real compiled C++ code, not plain JS) — the API's `Dockerfile` installs `python3`/`make`/`g++` so they can compile inside the container. `better-sqlite3` actually ships a prebuilt binary for Linux/arm64 inside its own npm package, but that specific prebuilt file needed a newer version of a core system library (`glibc`) than `node:22-slim` has — so the Dockerfile deletes that mismatched file and forces a real from-source rebuild instead of trusting it.

## auth model

- Passwords hashed with `bcrypt` (cost factor 12), never stored in plaintext.
- Sessions are random opaque tokens (not JWT) stored in a `sessions` table and set as an httpOnly, `SameSite=Lax` cookie. Logging out deletes the row server-side, which actually revokes it (a real advantage over stateless JWTs for a project this size).
- `requireAuth` middleware (`phase-3-api/middleware/requireAuth.js`) gates `/api/auth/me` and all of `/api/predictions/*`.

**Known simplifications** (deliberately out of scope for this phase, worth naming if asked about hardening):
- No CSRF token — relies on `SameSite=Lax` + same-site (if not same-origin) requests. Would need revisiting if the frontend and API ever end up on different registrable domains.
- No login rate-limiting / brute-force lockout.
- No password reset or email verification flow.
