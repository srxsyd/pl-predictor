<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/auth.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      await authStore.signup(email, password);
      goto('/');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Signup failed';
    } finally {
      submitting = false;
    }
  }
</script>

<h1>Sign up</h1>

<form onsubmit={handleSubmit}>
  <label>
    Email
    <input type="email" bind:value={email} required />
  </label>
  <label>
    Password
    <input type="password" bind:value={password} minlength="8" required />
    <span class="hint">At least 8 characters</span>
  </label>
  <button type="submit" disabled={submitting}>Sign up</button>
  {#if error}<p class="error">{error}</p>{/if}
</form>

<p>Already have an account? <a href="/login">Log in</a></p>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 320px;
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
  .hint {
    color: #666;
    font-size: 0.8rem;
  }
  button {
    padding: 0.5rem;
    border-radius: 6px;
    border: none;
    background: #37003c;
    color: white;
    cursor: pointer;
  }
  .error {
    color: #b00020;
    font-size: 0.9rem;
  }
</style>
