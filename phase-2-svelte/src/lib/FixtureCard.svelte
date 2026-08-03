<script lang="ts">
  import { untrack } from 'svelte';
  import { authStore } from './auth.svelte';
  import type { Fixture, Score } from './types';

  let {
    fixture,
    saved,
    onSave
  }: { fixture: Fixture; saved: Score | undefined; onSave: (score: Score) => Promise<void> } = $props();

  let homeScore = $state<number | ''>(untrack(() => saved?.home ?? ''));
  let awayScore = $state<number | ''>(untrack(() => saved?.away ?? ''));
  let justSaved = $state(false);
  let error = $state('');

  let now = $state(Date.now());
  $effect(() => {
    const interval = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(interval);
  });

  let countdown = $derived.by(() => {
    if (!fixture.kickoffAt || fixture.actual) return null;
    const diffMs = new Date(fixture.kickoffAt).getTime() - now;
    if (diffMs <= 0) return 'Kickoff!';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    return days > 0
      ? `Kicks off in ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `Kicks off in ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (homeScore === '' || awayScore === '') return;
    error = '';
    try {
      await onSave({ home: homeScore, away: awayScore });
      justSaved = true;
      setTimeout(() => (justSaved = false), 1500);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save prediction';
    }
  }
</script>

<div class="fixture-card">
  <div class="teams-block">
    <span class="teams">{fixture.home} vs {fixture.away}</span>
    {#if countdown}<span class="countdown">{countdown}</span>{/if}
  </div>
  {#if authStore.user}
    <form onsubmit={handleSubmit}>
      <input type="number" min="0" max="20" bind:value={homeScore} required />
      <span>-</span>
      <input type="number" min="0" max="20" bind:value={awayScore} required />
      <button type="submit">Save</button>
      {#if justSaved}<span class="saved-badge">Saved</span>{/if}
      {#if error}<span class="error-badge">{error}</span>{/if}
    </form>
  {:else}
    <a href="/login" class="login-prompt">Log in to predict</a>
  {/if}
</div>

<style>
  .fixture-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 10px;
    margin-bottom: 0.75rem;
  }
  .teams-block {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .countdown {
    font-size: 0.78rem;
    color: #37003c;
    font-variant-numeric: tabular-nums;
  }
  input {
    width: 48px;
    text-align: center;
  }
  .saved-badge {
    color: #0a8a3f;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .error-badge {
    color: #b00020;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .login-prompt {
    font-size: 0.85rem;
    color: #37003c;
  }
</style>
