<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/auth.svelte';
  import { API_BASE } from '$lib/config';
  import type { Fixture } from '$lib/types';

  let fixtures = $state<Fixture[]>([]);
  let fixturesLoaded = $state(false);

  async function loadFixtures() {
    const res = await fetch(`${API_BASE}/api/fixtures`);
    fixtures = await res.json();
    for (const fixture of fixtures) {
      if (fixture.actual === null && !scoreInputs[fixture.id]) {
        scoreInputs[fixture.id] = { home: '', away: '' };
      }
    }
    fixturesLoaded = true;
  }

  onMount(loadFixtures);

  // --- add new match ---
  let home = $state('');
  let away = $state('');
  let matchweek = $state<number | ''>('');
  let kickoffLocal = $state(''); // raw value from <input type="datetime-local">
  let addError = $state('');
  let adding = $state(false);

  async function handleAddMatch(e: SubmitEvent) {
    e.preventDefault();
    addError = '';
    adding = true;
    try {
      const kickoffAt = kickoffLocal ? new Date(kickoffLocal).toISOString() : null;
      const res = await fetch(`${API_BASE}/api/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ home, away, matchweek, kickoffAt })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not add match');
      home = '';
      away = '';
      matchweek = '';
      kickoffLocal = '';
      await loadFixtures();
    } catch (err) {
      addError = err instanceof Error ? err.message : 'Could not add match';
    } finally {
      adding = false;
    }
  }

  // --- enter final scores ---
  let scoreInputs = $state<Record<string, { home: string; away: string }>>({});
  let scoreErrors = $state<Record<string, string>>({});

  async function handleSubmitScore(e: SubmitEvent, fixtureId: string) {
    e.preventDefault();
    const input = scoreInputs[fixtureId];
    scoreErrors[fixtureId] = '';
    try {
      const res = await fetch(`${API_BASE}/api/fixtures/${fixtureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actual: { home: Number(input.home), away: Number(input.away) } })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not save result');
      await loadFixtures();
    } catch (err) {
      scoreErrors[fixtureId] = err instanceof Error ? err.message : 'Could not save result';
    }
  }

  let pendingFixtures = $derived(fixtures.filter((f) => f.actual === null));
</script>

<h1>Admin</h1>

{#if authStore.loading}
  <p>Loading…</p>
{:else if !authStore.user?.isAdmin}
  <p>You don't have access to this page.</p>
{:else}
  <section>
    <h2>Add a new match</h2>
    <form onsubmit={handleAddMatch}>
      <label>
        Home team
        <input type="text" bind:value={home} required />
      </label>
      <label>
        Away team
        <input type="text" bind:value={away} required />
      </label>
      <label>
        Matchweek
        <input type="number" min="1" bind:value={matchweek} required />
      </label>
      <label>
        Kickoff (optional)
        <input type="datetime-local" bind:value={kickoffLocal} />
      </label>
      <button type="submit" disabled={adding}>Add match</button>
      {#if addError}<p class="error">{addError}</p>{/if}
    </form>
  </section>

  <section>
    <h2>Enter final scores</h2>
    {#if !fixturesLoaded}
      <p>Loading fixtures…</p>
    {:else if pendingFixtures.length === 0}
      <p>No fixtures awaiting a result.</p>
    {:else}
      {#each pendingFixtures as fixture (fixture.id)}
        <form class="score-row" onsubmit={(e) => handleSubmitScore(e, fixture.id)}>
          <span class="teams">{fixture.home} vs {fixture.away}</span>
          <input type="number" min="0" max="20" bind:value={scoreInputs[fixture.id].home} required />
          <span>-</span>
          <input type="number" min="0" max="20" bind:value={scoreInputs[fixture.id].away} required />
          <button type="submit">Save result</button>
          {#if scoreErrors[fixture.id]}<span class="error">{scoreErrors[fixture.id]}</span>{/if}
        </form>
      {/each}
    {/if}
  </section>
{/if}

<style>
  section {
    margin-bottom: 2.5rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 360px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  button {
    padding: 0.5rem;
    border-radius: 6px;
    border: none;
    background: #37003c;
    color: white;
    cursor: pointer;
    width: fit-content;
  }
  .score-row {
    flex-direction: row;
    align-items: center;
    max-width: none;
    margin-bottom: 0.75rem;
  }
  .score-row input {
    width: 56px;
    text-align: center;
  }
  .teams {
    flex: 1;
  }
  .error {
    color: #b00020;
    font-size: 0.85rem;
  }
</style>
