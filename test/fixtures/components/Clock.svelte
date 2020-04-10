<script>
  import tinydate from 'tinydate';
  import { onMount } from 'svelte';
  
  let now = new Date(`Jan 1, 0 0:0`);
  
  $: time = tinydate('{HH}:{mm}:{ss}')(now);
​
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
