<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/auth.svelte';

  let { children } = $props();

  onMount(() => {
    authStore.init();
  });
</script>

<header>
  <h1>Premier League Predictor</h1>
  <p class="subtitle">2026-2027 Season - Phase 2 (SvelteKit)</p>
  <nav>
    {#if authStore.loading}
      <span class="nav-text">...</span>
    {:else if authStore.user}
      <span class="nav-text">{authStore.user.email}</span>
      <button onclick={() => authStore.logout()}>Log out</button>
    {:else}
      <a href="/login">Log in</a>
      <a href="/signup">Sign up</a>
    {/if}
  </nav>
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
    margin: 0 0 1rem;
    color: #04f5ff;
    font-size: 0.95rem;
  }
  nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    font-size: 0.9rem;
  }
  nav a {
    color: #04f5ff;
  }
  nav button {
    background: transparent;
    border: 1px solid #04f5ff;
    color: #04f5ff;
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .nav-text {
    color: #ddd;
  }
  main {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }
</style>
