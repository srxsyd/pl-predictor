import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, createSession, destroySession } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash);

  const token = createSession(id);
  res.cookie('session', token, SESSION_COOKIE_OPTS);
  res.status(201).json({ id, email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createSession(user.id);
  res.cookie('session', token, SESSION_COOKIE_OPTS);
  res.json({ id: user.id, email: user.email });
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
