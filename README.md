# premier league predictor
a full-stack prediction app for the 26-27 EPL season

## roadmap

- [x] **Phase 1** — static HTML/CSS/JS prototype (`phase-1/`)
- [x] **Phase 2** — SvelteKit frontend with reactive leaderboard (`phase-2-svelte/`)
- [x] **Phase 3** — Express + SQLite CRUD API for fixtures (`phase-3-api/`)
- [x] **Phase 4** — authentication from scratch (bcrypt + session cookies), predictions moved server-side and scoped per user
- [x] **Phase 5** — Docker (containerize API + frontend, volume-mount the SQLite file)
- [x] **Phase 6** — S3-compatible file storage (MinIO) for avatar uploads via presigned URLs — **MinIO only, real AWS deliberately out of scope for now** (see note below)
- [ ] **Phase 7** — deploy to a self-managed VM (EC2/Lightsail/Droplet), HTTPS via Caddy/nginx
- [ ] **Phase 8** — polish: architecture diagram, scoring cron job, resume writeup

## running locally

**Option A — Docker (recommended, one command):**

```bash
docker compose up --build
```

This builds and starts three containers — MinIO (S3-compatible storage) on `http://localhost:9000` (console at `:9001`), API on `http://localhost:3001`, frontend on `http://localhost:5173`. Both the SQLite database and MinIO's data live in named Docker volumes, so they survive container rebuilds; they only disappear if you explicitly run `docker compose down -v`. A brand-new/empty database auto-seeds itself with fixtures on first boot, and the API auto-creates its S3 bucket (with a public-read policy scoped only to `avatars/*`) — no manual setup either way.

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

Sign up at `/signup` (email, password, and a public username), log in at `/login`. Predictions are stored server-side in SQLite (`phase-3-api/predictor.db`), scoped to your account via a session cookie — no more `localStorage`. Avatar uploads (`/profile`) require MinIO to be running — either via Docker (`docker compose up minio`) or Option A above; there's no plain-`npm run dev` equivalent for that piece since MinIO itself is a server you run in a container.

To get admin access (`/admin` — add matches, enter results), copy `.env.example` to `.env` at the repo root and set `ADMIN_EMAILS` to the email you'll sign up with, then `docker compose up` (Docker reads that file automatically). This file is gitignored — never commit real emails/credentials into `docker-compose.yml` itself.

## docker notes

- The frontend uses `@sveltejs/adapter-node` (not `adapter-auto`) so it builds into a plain, self-hostable Node server — `adapter-auto` only targets specific hosting platforms (Vercel, Netlify, etc.) and won't work in a generic container.
- Server-side rendering is turned off (`export const ssr = false` in `src/routes/+layout.ts`). Reason: the frontend and API are separate containers, each with their own private network namespace — `localhost:3001` means something different depending on which container is asking. Rather than juggle two different API addresses (one for the browser, one for server-side code running inside the frontend container), all data-fetching happens from the browser, same as it already did for auth and predictions.
- `PUBLIC_API_BASE` (`phase-2-svelte/.env` locally, or the `PUBLIC_API_BASE` build arg in `docker-compose.yml`) controls what address the browser calls — this gets baked into the JS bundle at build time.
- `better-sqlite3` and `bcrypt` are native modules (real compiled C++ code, not plain JS) — the API's `Dockerfile` installs `python3`/`make`/`g++` so they can compile inside the container. `better-sqlite3` actually ships a prebuilt binary for Linux/arm64 inside its own npm package, but that specific prebuilt file needed a newer version of a core system library (`glibc`) than `node:22-slim` has — so the Dockerfile deletes that mismatched file and forces a real from-source rebuild instead of trusting it.

## file storage (S3 / MinIO)

- **MinIO only — this project deliberately never talks to real AWS.** MinIO speaks the same S3 API as AWS, so the code (`phase-3-api/s3.js`) is written against the real `@aws-sdk/client-s3` and would work against real S3 with just an endpoint/credentials change — but that change is out of scope until explicitly decided, to keep this project at zero billing risk.
- **Presigned URLs, not upload-through-server**: the browser asks the API for a temporary, single-use upload URL (`POST /api/avatar/upload-url`), then `PUT`s the file *directly* to MinIO — the file never passes through the Express server. The API only finds out afterward (`POST /api/avatar/confirm`), and verifies the object actually exists in the bucket before trusting the client's claim.
- Only the `avatars/` prefix in the bucket is publicly readable (set via a bucket policy on startup); everything else defaults to private.
- Two real bugs hit and fixed while building this, worth knowing about if you touch this code:
  - Newer versions of `@aws-sdk/client-s3` attach checksum headers by default that MinIO's API rejects with `NotImplemented` — fixed by setting `requestChecksumCalculation`/`responseChecksumValidation` to `'WHEN_REQUIRED'` on the client.
  - This MinIO version's S3-compatible API doesn't support the standard `PutBucketCors` call at all (also `NotImplemented`) — dropped that call entirely; MinIO handles the presigned-upload CORS case without it.
- Presigned URLs use two different S3 client instances with two different endpoints (`S3_ENDPOINT` vs `S3_PUBLIC_ENDPOINT`) for the same reason the frontend needed `PUBLIC_API_BASE` in Phase 5: inside Docker, the API container reaches MinIO via the internal address `minio:9000`, but a presigned URL is *used* by the browser, which can only reach `localhost:9000`.

## leaderboard

- `GET /api/leaderboard` is deliberately the one API route with **no** `requireAuth` — the whole point is that predictions and scores are public and visible to logged-out visitors too, the same way a real fantasy-football leaderboard would be.
- Scoring is computed **server-side** in that route (`phase-3-api/routes/leaderboard.js`) by joining every user's predictions against fixtures' actual results — it aggregates *everyone*, not just the logged-in user, which is why it couldn't stay client-side the way it started (the original version only ever knew about its own browser's predictions plus two hardcoded fake rows).
- Usernames are required at signup (2-24 chars, letters/numbers/`_`/`-`, enforced unique) specifically so there's a stable public handle to show here instead of an email address.
- After saving a prediction, the frontend re-fetches the leaderboard so your own score updates immediately — same instant-feedback feel as the original client-only version, just sourced from the server now.

## admin

- **Bootstrapping**: there's no separate "create an admin" flow (that's a chicken-and-egg problem — you'd need to already be an admin to create one). Instead, `ADMIN_EMAILS` (comma-separated) in a root `.env` file lists which email(s) get admin access. It's checked at signup, and **re-checked on every login** — so it also works retroactively on an account that already existed, and (worth knowing) will downgrade an account back to non-admin if you ever remove its email from the list.
- **What this closed, not just added**: before this feature, `POST/PUT/DELETE /api/fixtures` had **no authentication at all** — anyone could add, edit, or delete matches. `middleware/requireAdmin.js` (used after `requireAuth`) now gates all three; `GET` stays public, same read/write split as predictions and the leaderboard.
- **Auto-scoring**: there's no separate "run scoring" step. The leaderboard (`GET /api/leaderboard`) already recomputes every user's points live from current fixture results on every request — so the moment an admin saves a final score via `/admin`, the next leaderboard fetch reflects it automatically.
- **Countdown**: `kickoff_at` is a plain timestamp column on `fixtures`, set optionally when an admin adds a match. `FixtureCard.svelte` ticks a live countdown to it every second (via `setInterval` inside a Svelte 5 `$effect`, cleaned up on unmount) — this is a public display, visible to every visitor, not just admins; the admin's only job is setting the date/time.

## auth model

- Passwords hashed with `bcrypt` (cost factor 12), never stored in plaintext.
- Sessions are random opaque tokens (not JWT) stored in a `sessions` table and set as an httpOnly, `SameSite=Lax` cookie. Logging out deletes the row server-side, which actually revokes it (a real advantage over stateless JWTs for a project this size).
- `requireAuth` middleware (`phase-3-api/middleware/requireAuth.js`) gates `/api/auth/me` and all of `/api/predictions/*` — but deliberately not `/api/leaderboard` (see above).

**Known simplifications** (deliberately out of scope for this phase, worth naming if asked about hardening):
- No CSRF token — relies on `SameSite=Lax` + same-site (if not same-origin) requests. Would need revisiting if the frontend and API ever end up on different registrable domains.
- No login rate-limiting / brute-force lockout.
- No password reset or email verification flow.
