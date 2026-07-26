<script lang="ts">
  let { fixture }: { fixture: { id: string; home: string; away: string } } = $props();

  const storageKey = `pl-predictor-${fixture.id}`;

  function loadSaved() {
    if (typeof localStorage === 'undefined') return { home: '', away: '' };
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : { home: '', away: '' };
  }

  let saved = loadSaved();
  let homeScore = $state<number | ''>(saved.home);
  let awayScore = $state<number | ''>(saved.away);
  let justSaved = $state(false);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    localStorage.setItem(storageKey, JSON.stringify({ home: homeScore, away: awayScore }));
    justSaved = true;
    setTimeout(() => (justSaved = false), 1500);
  }
</script>

<div class="fixture-card">
  <span class="teams">{fixture.home} vs {fixture.away}</span>
  <form onsubmit={handleSubmit}>
    <input type="number" min="0" max="20" bind:value={homeScore} required />
    <span>-</span>
    <input type="number" min="0" max="20" bind:value={awayScore} required />
    <button type="submit">Save</button>
    {#if justSaved}<span class="saved-badge">Saved</span>{/if}
  </form>
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
  input {
    width: 48px;
    text-align: center;
  }
  .saved-badge {
    color: #0a8a3f;
    font-size: 0.8rem;
    font-weight: 600;
  }
</style>