<script lang="ts">
  import FixtureCard from '$lib/FixtureCard.svelte';

  let fixtures = $state([
    { id: 'f1', home: 'Arsenal', away: 'Manchester United' },
    { id: 'f2', home: 'Liverpool', away: 'Chelsea' },
    { id: 'f3', home: 'Manchester City', away: 'Tottenham' },
    { id: 'f4', home: 'Newcastle', away: 'Aston Villa' },
  ]);
</script>

<h1>Matchweek 1</h1>

{#each fixtures as fixture (fixture.id)}
  <FixtureCard {fixture} />
{/each}