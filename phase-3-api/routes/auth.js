import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, createSession, destroySession, isAdminEmail } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,24}$/;

router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
  }
  if (!username || !USERNAME_PATTERN.test(username)) {
    return res
      .status(400)
      .json({ error: 'Username must be 2-24 characters: letters, numbers, underscores, or hyphens' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) return res.status(409).json({ error: 'An account with this email already exists' });

  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUsername) return res.status(409).json({ error: 'That username is already taken' });

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const isAdmin = isAdminEmail(email);
  db.prepare('INSERT INTO users (id, email, username, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)').run(
    id,
    email,
    username,
    passwordHash,
    isAdmin ? 1 : 0
  );

  const token = createSession(id);
  res.cookie('session', token, SESSION_COOKIE_OPTS);
  res.status(201).json({ id, email, username, avatarUrl: null, isAdmin });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // re-sync on every login in case ADMIN_EMAILS was set/changed after this account was created
  const isAdmin = isAdminEmail(user.email);
  if (isAdmin !== Boolean(user.is_admin)) {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, user.id);
  }

  const token = createSession(user.id);
  res.cookie('session', token, SESSION_COOKIE_OPTS);
  res.json({ id: user.id, email: user.email, username: user.username, avatarUrl: user.avatar_url, isAdmin });
});

router.post('/logout', (req, res) => {
  if (req.cookies.session) destroySession(req.cookies.session);
  res.clearCookie('session');
  res.status(204).send();
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
