import path from 'path';
import fs from 'fs-extra';
import esmConfig from 'esm-config';

import makeBundle from './src/make-bundle.js';
import renderHtml from './src/render-html.js';


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

    const component = await esmConfig(cache);

    const template = await fs.readFile(
      path.resolve(context, src, 'template.html'),
      'utf8',
    );

    await fs.outputFile(
      path.resolve(context, dist, 'index.html'),
      renderHtml(component, template),
    );
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
