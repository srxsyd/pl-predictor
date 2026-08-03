import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { db } from './db.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// bootstrap mechanism for the very first admin(s): list their email(s) in the
// ADMIN_EMAILS env var (comma-separated) and they're granted admin on
// signup/login — no separate "create an admin" flow needed
export function isAdminEmail(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function getUserBySessionToken(token) {
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  const row = db
    .prepare('SELECT id, email, username, avatar_url AS avatarUrl, is_admin AS isAdmin, created_at FROM users WHERE id = ?')
    .get(session.user_id);
  return row && { ...row, isAdmin: Boolean(row.isAdmin) };
}

export function destroySession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
