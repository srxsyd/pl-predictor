import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// public — no requireAuth, so logged-out visitors see the same leaderboard
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT u.username AS username,
             p.predicted_home AS predictedHome,
             p.predicted_away AS predictedAway,
             f.actual_home AS actualHome,
             f.actual_away AS actualAway
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      LEFT JOIN fixtures f ON f.id = p.fixture_id
      WHERE u.username IS NOT NULL
      `
    )
    .all();

  const pointsByUsername = {};
  for (const row of rows) {
    pointsByUsername[row.username] ??= 0;

    if (row.actualHome === null || row.actualHome === undefined) continue; // no prediction, or fixture has no result yet

    const exactMatch = row.predictedHome === row.actualHome && row.predictedAway === row.actualAway;
    const sameResult = Math.sign(row.predictedHome - row.predictedAway) === Math.sign(row.actualHome - row.actualAway);
    pointsByUsername[row.username] += exactMatch ? 3 : sameResult ? 1 : 0;
  }

  const leaderboard = Object.entries(pointsByUsername)
    .map(([username, points]) => ({ username, points }))
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

  res.json(leaderboard);
});

export default router;
