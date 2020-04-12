<script>
  import Message from './components/Message.svelte';
  import Clock from './components/Clock.svelte';

</script>


<svelte:head>
  <title> My Site </title>
  <meta name="description" content="All the things">
</svelte:head>


<div>
  <p> Hello, World! <Message adjective='lovely'/></p>
  <Clock/>
</div>


<style>
  p {
    font-weight: bold;
    color: blue;
  }
</style>
