<script lang="ts">
  import { onMount } from 'svelte';
  import FixtureCard from '$lib/FixtureCard.svelte';
  import { MOCK_USERS } from '$lib/data';
  import { API_BASE } from '$lib/config';
  import { calculatePoints } from '$lib/scoring';
  import type { Score } from '$lib/types';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let predictions = $state<Record<string, Score>>({});
  let predictionsLoaded = $state(false);

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/predictions/mine`, { credentials: 'include' });
      if (res.ok) {
        const rows: { fixtureId: string; home: number; away: number }[] = await res.json();
        predictions = Object.fromEntries(rows.map((r) => [r.fixtureId, { home: r.home, away: r.away }]));
      }
    } finally {
      predictionsLoaded = true;
    }
  });

  async function handleSave(fixtureId: string, score: Score) {
    const res = await fetch(`${API_BASE}/api/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fixtureId, home: score.home, away: score.away })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Failed to save prediction');
    }
    predictions[fixtureId] = score;
  }

  let myPoints = $derived(
    data.fixtures.reduce((sum, fixture) => {
      const predicted = predictions[fixture.id];
      if (!predicted) return sum;
      const pts = calculatePoints(predicted, fixture.actual);
      return pts !== null ? sum + pts : sum;
    }, 0)
  );

  let leaderboard = $derived(
    [...MOCK_USERS, { name: 'You', points: myPoints }].sort((a, b) => b.points - a.points)
  );
</script>

<h1>Matchweek 1</h1>

{#if predictionsLoaded}
  {#each data.fixtures as fixture (fixture.id)}
    <FixtureCard {fixture} saved={predictions[fixture.id]} onSave={(score) => handleSave(fixture.id, score)} />
  {/each}
{:else}
  <p>Loading fixtures…</p>
{/if}

<h2>Leaderboard</h2>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Name</th>
      <th>Points</th>
    </tr>
  </thead>
  <tbody>
    {#each leaderboard as entry, index (entry.name)}
      <tr class:me={entry.name === 'You'}>
        <td>{index + 1}</td>
        <td>{entry.name}</td>
        <td>{entry.points}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  h2 {
    margin-top: 2rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid #ddd;
  }
  tr.me {
    font-weight: 700;
    color: #37003c;
  }
</style>
