<script>
  import Message from './components/Message.svelte';
  import Clock from './components/Clock.svelte';
  
  export let adjective = 'nice';

</script>


<svelte:head>
  <title> My Site </title>
  <meta name="description" content="All the things">
</svelte:head>


<div>
  <p>
    <span id="hello"> Hello, World! </span>
    <Message {adjective}/>
  </p>
  <Clock/>
</div>


<style>
  p {
    font-weight: bold;
    color: blue;
  }
</style>
