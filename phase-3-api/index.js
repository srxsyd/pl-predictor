import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import { seedFixtures } from './seed.js';
import { ensureBucket } from './s3.js';
import fixturesRouter from './routes/fixtures.js';
import authRouter from './routes/auth.js';
import predictionsRouter from './routes/predictions.js';
import avatarRouter from './routes/avatar.js';
import leaderboardRouter from './routes/leaderboard.js';

const { count: fixtureCount } = db.prepare('SELECT COUNT(*) AS count FROM fixtures').get();
if (fixtureCount === 0) {
  const seeded = seedFixtures();
  console.log(`Empty database detected, seeded ${seeded} fixtures`);
}

// MinIO may still be starting up when this container boots, so retry a few
// times with a short delay instead of crashing on the first failed attempt
async function ensureBucketWithRetry(attemptsLeft = 10) {
  try {
    await ensureBucket();
    console.log('S3 bucket ready');
  } catch (err) {
    if (attemptsLeft <= 1) throw err;
    console.log('Waiting for MinIO...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await ensureBucketWithRetry(attemptsLeft - 1);
  }
}
await ensureBucketWithRetry();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/fixtures', fixturesRouter);
app.use('/api/auth', authRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/avatar', avatarRouter);
app.use('/api/leaderboard', leaderboardRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
