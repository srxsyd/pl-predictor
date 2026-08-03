<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import FixtureCard from '$lib/FixtureCard.svelte';
  import { authStore } from '$lib/auth.svelte';
  import { API_BASE } from '$lib/config';
  import type { Score, LeaderboardEntry } from '$lib/types';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let predictions = $state<Record<string, Score>>({});
  let predictionsLoaded = $state(false);
  let leaderboard = $state<LeaderboardEntry[]>(untrack(() => data.leaderboard));

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

  async function refreshLeaderboard() {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    if (res.ok) leaderboard = await res.json();
  }

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
    await refreshLeaderboard();
  }
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
      <th>Username</th>
      <th>Points</th>
    </tr>
  </thead>
  <tbody>
    {#each leaderboard as entry, index (entry.username)}
      <tr class:me={entry.username === authStore.user?.username}>
        <td>{index + 1}</td>
        <td>{entry.username}</td>
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
