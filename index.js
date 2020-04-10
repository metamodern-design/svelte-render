import fs from 'fs-extra';
import { rollup } from 'rollup';

import makeBundle from './src/make-bundle.js';


const svelteRender = async (context, {
  src = 'src',
  dist = 'dist',
  index = 'index.svelte',
  client = 'client.js',
  mode = 'production',
  ...options
} = {}) => {
  if (mode === 'production') {
    const indexEntry = path.resolve(context, src, index);

    const indexBundle = await makeBundle(indexEntry, {
      generate: 'ssr',
      mode,
      ...options,
    });
    
    const cache = path.resolve(context, './.svelte-render/index.js');
    
    await indexBundle.write({
      format: 'es',
      file: cache,
    });
  
    const component = await import(cache);
  
    const { head, html, css } = component.render();
    
    fs.writeFileSync('./temp/head.html', head);
    fs.writeFileSync('./temp/app.html', html);
    fs.writeFileSync('./temp/app.css', css.code);
  
  } // else generate minimal index.html 
  
  const clientEntry = path.resolve(context, src, client);

  const clientBundle = await makeBundle(clientEntry, {
    generate: 'dom',
    mode,
    ...options,
  });
  
  await clientBundle.write({
    format: 'iife',
    file: path.resolve(context, dist, client),
  });
};


export default svelteRender;
