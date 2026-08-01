import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

router.get('/mine', (req, res) => {
  const rows = db
    .prepare('SELECT fixture_id, predicted_home, predicted_away FROM predictions WHERE user_id = ?')
    .all(req.user.id);
  res.json(rows.map((r) => ({ fixtureId: r.fixture_id, home: r.predicted_home, away: r.predicted_away })));
});

router.post('/', (req, res) => {
  const { fixtureId, home, away } = req.body;
  if (!fixtureId || home === undefined || away === undefined) {
    return res.status(400).json({ error: 'fixtureId, home, away are required' });
  }

  const fixture = db.prepare('SELECT id FROM fixtures WHERE id = ?').get(fixtureId);
  if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

  const existing = db
    .prepare('SELECT id FROM predictions WHERE user_id = ? AND fixture_id = ?')
    .get(req.user.id, fixtureId);

  if (existing) {
    db.prepare('UPDATE predictions SET predicted_home = ?, predicted_away = ? WHERE id = ?').run(
      home,
      away,
      existing.id
    );
  } else {
    db.prepare(
      'INSERT INTO predictions (id, user_id, fixture_id, predicted_home, predicted_away) VALUES (?, ?, ?, ?, ?)'
    ).run(randomUUID(), req.user.id, fixtureId, home, away);
  }

  res.status(200).json({ fixtureId, home, away });
});

export default router;
