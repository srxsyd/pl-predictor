<script lang="ts">
  let { children } = $props();
</script>

<header>
  <h1>Premier League Predictor</h1>
  <p class="subtitle">2026-2027 Season - Phase 2 (SvelteKit)</p>
</header>

<main>
  {@render children()}
</main>

<style>
  header {
    background: #37003c;
    color: white;
    padding: 2rem 1.5rem;
    text-align: center;
  }
  header h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
  }
  .subtitle {
    margin: 0;
    color: #04f5ff;
    font-size: 0.95rem;
  }
  main {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }
</style>