import { getUserBySessionToken } from '../auth.js';

export function requireAuth(req, res, next) {
  const user = getUserBySessionToken(req.cookies.session);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}
