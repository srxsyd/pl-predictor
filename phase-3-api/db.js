import Database from 'better-sqlite3';

export const db = new Database(process.env.DB_PATH || 'predictor.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS fixtures (
    id TEXT PRIMARY KEY,
    home TEXT NOT NULL,
    away TEXT NOT NULL,
    matchweek INTEGER NOT NULL,
    kickoff_at TEXT,
    actual_home INTEGER,
    actual_away INTEGER
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fixture_id TEXT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    predicted_home INTEGER NOT NULL,
    predicted_away INTEGER NOT NULL,
    UNIQUE(user_id, fixture_id)
  );
`);

// additive migrations for databases created before these columns existed —
// CREATE TABLE IF NOT EXISTS above only helps on a brand-new database
for (const alterStatement of [
  'ALTER TABLE users ADD COLUMN avatar_url TEXT',
  'ALTER TABLE users ADD COLUMN username TEXT',
  'ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE fixtures ADD COLUMN kickoff_at TEXT'
]) {
  try {
    db.exec(alterStatement);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) throw err;
  }
}

// a UNIQUE index (rather than an inline UNIQUE column constraint) so this same
// statement works whether username came from CREATE TABLE or the ALTER above —
// SQLite's ALTER TABLE ADD COLUMN doesn't allow adding UNIQUE constraints directly
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
