import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

function toFixtureDTO(row) {
  return {
    id: row.id,
    home: row.home,
    away: row.away,
    matchweek: row.matchweek,
    kickoffAt: row.kickoff_at,
    actual:
      row.actual_home === null || row.actual_away === null
        ? null
        : { home: row.actual_home, away: row.actual_away }
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM fixtures ORDER BY matchweek, id').all();
  res.json(rows.map(toFixtureDTO));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Fixture not found' });
  res.json(toFixtureDTO(row));
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { home, away, matchweek, kickoffAt } = req.body;
  if (!home || !away || !Number.isInteger(matchweek) || matchweek < 1) {
    return res.status(400).json({ error: 'home, away, and a positive integer matchweek are required' });
  }

  const id = randomUUID();
  db.prepare(
    'INSERT INTO fixtures (id, home, away, matchweek, kickoff_at, actual_home, actual_away) VALUES (?, ?, ?, ?, ?, NULL, NULL)'
  ).run(id, home, away, matchweek, kickoffAt ?? null);

  const row = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(id);
  res.status(201).json(toFixtureDTO(row));
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fixture not found' });

  const { home, away, matchweek, kickoffAt, actual } = req.body;
  const updated = {
    home: home ?? existing.home,
    away: away ?? existing.away,
    matchweek: matchweek ?? existing.matchweek,
    kickoff_at: kickoffAt === undefined ? existing.kickoff_at : kickoffAt,
    actual_home: actual === undefined ? existing.actual_home : (actual?.home ?? null),
    actual_away: actual === undefined ? existing.actual_away : (actual?.away ?? null)
  };

  db.prepare(
    'UPDATE fixtures SET home = ?, away = ?, matchweek = ?, kickoff_at = ?, actual_home = ?, actual_away = ? WHERE id = ?'
  ).run(
    updated.home,
    updated.away,
    updated.matchweek,
    updated.kickoff_at,
    updated.actual_home,
    updated.actual_away,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(req.params.id);
  res.json(toFixtureDTO(row));
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM fixtures WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Fixture not found' });
  res.status(204).send();
});

export default router;
