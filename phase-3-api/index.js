import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import { seedFixtures } from './seed.js';
import fixturesRouter from './routes/fixtures.js';
import authRouter from './routes/auth.js';
import predictionsRouter from './routes/predictions.js';

const { count: fixtureCount } = db.prepare('SELECT COUNT(*) AS count FROM fixtures').get();
if (fixtureCount === 0) {
  const seeded = seedFixtures();
  console.log(`Empty database detected, seeded ${seeded} fixtures`);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/fixtures', fixturesRouter);
app.use('/api/auth', authRouter);
app.use('/api/predictions', predictionsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
