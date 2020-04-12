<script>
  import tinydate from 'tinydate';
  import { onMount } from 'svelte';

  const format = tinydate('{HH}:{mm}:{ss}');
   
  let now = new Date('Jan 1, 0 0:0');

  $: time = format(now);

  onMount(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });

</script>


<p> The time is now {time}. </p>


<style>
  p {
    color: red;
  }

</style>
