<script lang="ts">
  import FixtureCard from '$lib/FixtureCard.svelte';
  import { FIXTURES, MOCK_USERS } from '$lib/data';
  import { predictionsStore } from '$lib/predictions.svelte';
  import { calculatePoints } from '$lib/scoring';

  let myPoints = $derived(
    FIXTURES.reduce((sum, fixture) => {
      const predicted = predictionsStore.get(fixture.id);
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

{#each FIXTURES as fixture (fixture.id)}
  <FixtureCard {fixture} />
{/each}

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
