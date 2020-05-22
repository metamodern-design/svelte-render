import index from './index.svelte';


try {
  const client = new index({
    target: document.body,
    hydrate: true,
    props: {
      adjective: 'lovely',
    },
  });
} catch (err) {
  console.error(err);
}
