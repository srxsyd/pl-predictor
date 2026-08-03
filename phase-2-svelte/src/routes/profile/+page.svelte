<script lang="ts">
  import { authStore } from '$lib/auth.svelte';
  import { API_BASE } from '$lib/config';

  let uploading = $state(false);
  let error = $state('');

  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    error = '';
    uploading = true;
    try {
      // step 1: ask our API for a presigned URL — a temporary permission slip
      // to upload directly to MinIO, without the file passing through our server
      const urlRes = await fetch(`${API_BASE}/api/avatar/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentType: file.type })
      });
      if (!urlRes.ok) throw new Error((await urlRes.json()).error ?? 'Could not get an upload URL');
      const { uploadUrl, key } = await urlRes.json();

      // step 2: upload the file straight to MinIO using that presigned URL
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      // step 3: tell our API the upload succeeded, so it can save the final URL
      const confirmRes = await fetch(`${API_BASE}/api/avatar/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key })
      });
      if (!confirmRes.ok) throw new Error((await confirmRes.json()).error ?? 'Could not save avatar');
      const { avatarUrl } = await confirmRes.json();
      authStore.setAvatarUrl(avatarUrl);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading = false;
      input.value = '';
    }
  }
</script>

<h1>Profile</h1>

{#if authStore.user}
  <div class="profile">
    {#if authStore.user.avatarUrl}
      <img class="avatar-large" src={authStore.user.avatarUrl} alt="Your avatar" />
    {:else}
      <div class="avatar-placeholder">{authStore.user.email[0].toUpperCase()}</div>
    {/if}

    <div>
      <p class="email">{authStore.user.email}</p>
      <label class="upload-button">
        {uploading ? 'Uploading…' : 'Change avatar'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onchange={handleFileChange} disabled={uploading} />
      </label>
      {#if error}<p class="error">{error}</p>{/if}
    </div>
  </div>
{:else}
  <p>You need to <a href="/login">log in</a> to view your profile.</p>
{/if}

<style>
  .profile {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .avatar-large,
  .avatar-placeholder {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #37003c;
    color: white;
    font-size: 2rem;
    font-weight: 700;
  }
  .email {
    margin: 0 0 0.75rem;
    font-weight: 600;
  }
  .upload-button {
    display: inline-block;
    padding: 0.5rem 0.9rem;
    border-radius: 6px;
    border: 1px solid #37003c;
    color: #37003c;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .upload-button input {
    display: none;
  }
  .error {
    color: #b00020;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
</style>
