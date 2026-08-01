import { db } from './db.js';

const FIXTURES = [
  { id: 'f1', home: 'Arsenal', away: 'Manchester United', matchweek: 1, actual_home: 2, actual_away: 1 },
  { id: 'f2', home: 'Liverpool', away: 'Chelsea', matchweek: 1, actual_home: 1, actual_away: 1 },
  { id: 'f3', home: 'Manchester City', away: 'Tottenham', matchweek: 1, actual_home: null, actual_away: null },
  { id: 'f4', home: 'Newcastle', away: 'Aston Villa', matchweek: 1, actual_home: null, actual_away: null }
];

export function seedFixtures() {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO fixtures (id, home, away, matchweek, actual_home, actual_away)
    VALUES (@id, @home, @away, @matchweek, @actual_home, @actual_away)
  `);

  const seedAll = db.transaction((fixtures) => {
    for (const fixture of fixtures) insert.run(fixture);
  });

  seedAll(FIXTURES);
  return FIXTURES.length;
}

// only run automatically when invoked directly (`npm run seed`), not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  const count = seedFixtures();
  console.log(`Seeded ${count} fixtures`);
}
