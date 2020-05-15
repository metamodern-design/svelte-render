<script>
  import tinydate from 'tinydate';
  import { onMount } from 'svelte';

  const formatTime = tinydate('{HH}:{mm}:{ss}');
  const formatDate = tinydate('{MM}/{DD}/{YY}');
   
  let now = new Date('Jan 1, 0 0:0');

  $: time = formatTime(now);
  $: date = formatDate(now);

  onMount(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });

</script>


<p id="time"> The time is now {time} on {date}. </p>


<style>
  p {
    color: red;
  }

</style>
