import index from './index.svelte';


try {
  const client = new index({
    target: document.body,
    hydrate: true,
  });
} catch (err) {
  console.error(err);
}
