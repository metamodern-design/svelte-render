const runParallel = async (tasks) => {
  const names = tasks.map(([n, _]) => n);
  const promises = tasks.map(([_, f]) => f());
  const results = await Promise.all(promises);
  
  return names.reduce(
    (a, c, i) => a.set(c, results[i]), 
    new Map(),
  );
};


export default runParallel;
