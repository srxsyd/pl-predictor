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
      <a href="/profile" class="profile-link">
        {#if authStore.user.avatarUrl}
          <img class="avatar" src={authStore.user.avatarUrl} alt="" />
        {:else}
          <span class="avatar-placeholder">{authStore.user.email[0].toUpperCase()}</span>
        {/if}
        <span class="nav-text">{authStore.user.email}</span>
      </a>
      {#if authStore.user.isAdmin}
        <a href="/admin">Admin</a>
      {/if}
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
  .profile-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
  .avatar,
  .avatar-placeholder {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #04f5ff;
    color: #37003c;
    font-size: 0.75rem;
    font-weight: 700;
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
