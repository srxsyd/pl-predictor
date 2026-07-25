const STORAGE_KEY = 'pl-predictor-phase1-predictions';

// hardcoded, fix later
const FIXTURES = [
  { id: 'f1', home: 'Arsenal', away: 'Manchester United', actual: { home: 2, away: 1 } },
  { id: 'f2', home: 'Liverpool', away: 'Chelsea', actual: { home: 1, away: 1 } },
  { id: 'f3', home: 'Manchester City', away: 'Tottenham', actual: null },
  { id: 'f4', home: 'Newcastle', away: 'Aston Villa', actual: null },
];

const MOCK_USERS = [
  { name: 'Sam', points: 7 },
  { name: 'Jordan', points: 5 },
];

function getResult({ home, away }) {
  if (home > away) return 'HOME_WIN';
  if (home < away) return 'AWAY_WIN';
  return 'DRAW';
}

function calculatePoints(predicted, actual) {
  if (!actual) return null;
  const exactMatch = predicted.home === actual.home && predicted.away === actual.away;
  if (exactMatch) return 3;
  return getResult(predicted) === getResult(actual) ? 1 : 0;
}

function loadPredictions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read predictions from localStorage', err);
    return {};
  }
}

function savePrediction(fixtureId, prediction) {
  const all = loadPredictions();
  all[fixtureId] = prediction;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function renderFixtures() {
  const container = document.getElementById('fixture-list');
  const predictions = loadPredictions();
  container.innerHTML = '';

  FIXTURES.forEach((fixture) => {
    const saved = predictions[fixture.id];

    const card = document.createElement('div');
    card.className = 'fixture-card';

    const teams = document.createElement('div');
    teams.className = 'fixture-teams';
    teams.textContent = `${fixture.home} vs ${fixture.away}`;
    card.appendChild(teams);

    const form = document.createElement('form');
    form.className = 'fixture-form';
    form.dataset.fixtureId = fixture.id;

    form.innerHTML = `
      <input type="number" min="0" max="20" name="home" value="${saved?.home ?? ''}" required />
      <span>-</span>
      <input type="number" min="0" max="20" name="away" value="${saved?.away ?? ''}" required />
      <button type="submit">Save</button>
      <span class="saved-badge" hidden>Saved ✓</span>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const homeVal = Number(form.elements.home.value);
      const awayVal = Number(form.elements.away.value);
      const prediction = { home: homeVal, away: awayVal };

      savePrediction(fixture.id, prediction);

      const badge = form.querySelector('.saved-badge');
      badge.hidden = false;
      setTimeout(() => (badge.hidden = true), 1500);

      renderLeaderboard();
    });

    card.appendChild(form);
    container.appendChild(card);
  });
}

function renderLeaderboard() {
  const predictions = loadPredictions();
  let myPoints = 0;

  FIXTURES.forEach((fixture) => {
    const predicted = predictions[fixture.id];
    if (predicted && fixture.actual) {
      const pts = calculatePoints(predicted, fixture.actual);
      if (pts !== null) myPoints += pts;
    }
  });

  const board = [...MOCK_USERS, { name: 'You', points: myPoints }].sort(
    (a, b) => b.points - a.points
  );

  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';
  board.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.points}</td>
    `;
    tbody.appendChild(row);
  });
}

renderFixtures();
renderLeaderboard();