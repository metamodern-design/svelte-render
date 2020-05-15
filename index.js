import path from 'path';
import fs from 'fs-extra';

import del from 'del';
import esmConfig from 'esm-config';
import uid from 'uid';

import makeBundle from './src/make-bundle.js';
import renderHtml from './src/render-html.js';


const svelteRender = async (context, {
  src = 'src',
  dist = 'dist',
  entry = 'index.svelte',
  client = 'client.js',
  development = false,
  ...options
} = {}) => {
  const cache = path.resolve(context, `./.svelte-render/entry-${uid()}}.js`);
  
  const generateHtml = async () => {
    const [component, template] = await Promise.all([
      esmConfig(cache),
      fs.readFile(path.resolve(context, src, 'template.html'), 'utf8'),
    ]);

    await fs.outputFile(
      path.resolve(context, dist, 'index.html'),
      renderHtml(component, template),
    );
    
    await del(cache);
    
    return 1;
  };

  if (!client) {
    const entryBundle = await makeBundle(
      path.resolve(context, src, entry),
      { ssr: true, development, ...options },
    );

    await entryBundle.write({
      format: 'es',
      file: cache,
    });
    
    return generateHtml();
  } 
  
  if (development) {
    const clientBundle = await makeBundle(
      path.resolve(context, src, client),
      { ssr: false, development, ...options },
    );

    await clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, client),
    });
    
    return 1;
  }
  
  const [entryBundle, clientBundle] = await Promise.all([
    makeBundle(
      path.resolve(context, src, entry),
      { ssr: true, development, ...options },
    ),
    makeBundle(
      path.resolve(context, src, client),
      { ssr: false, development, ...options },
    ),
  ]);

  await Promise.all([
    entryBundle.write({
      format: 'es',
      file: cache,
    }),
    clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, client),
    }),
  ]);

  return generateHtml();
};


export default svelteRender;
